"""
Chatbot API Views
GET  /api/health/  — system status
POST /api/chat/    — main chat endpoint
"""

import time
import sys
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ── Make scripts/ importable ──────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent.parent / 'scripts'
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from load_knowledge_base import KnowledgeLoader
from chatbot.ollama_client import OllamaClient

# ── Initialise once at startup ────────────────────────────────────────────────
print("\n" + "=" * 50)
print("  Initialising NepalTravel AI...")
print("=" * 50)

_knowledge_base = KnowledgeLoader()
_ollama         = OllamaClient()

print(f"  KB chunks loaded : {_knowledge_base.collection.count()}")
print(f"  Ollama model     : {_ollama.model}")
print(f"  Ollama healthy   : {_ollama.is_healthy()}")
print("=" * 50 + "\n")

# ── System prompts ────────────────────────────────────────────────────────────

RAG_SYSTEM_PROMPT = """You are NepalTravel AI, a knowledgeable and friendly Nepal travel assistant.

You have been provided with relevant excerpts from a curated Nepal travel knowledge base.
Use ONLY the provided context to answer the question.
Be accurate, concise, and practical.

Guidelines:
- Answer in 2–4 short paragraphs or use bullet points for lists
- Include specific details like costs, durations, and difficulty where available
- If the context does not fully answer the question, say so honestly
- Never fabricate prices, permit fees, or trek details
- Always prioritise traveller safety when relevant

FOR TRANSPORT PRICING:
- The base rate listed is always for a standard CAR
- State the car base rate clearly and mention 13% VAT is added on top
- Other vehicles cost more — multiply the car rate by the vehicle multiplier"""

FALLBACK_SYSTEM_PROMPT = """You are NepalTravel AI, a knowledgeable and friendly Nepal travel assistant.

The user has asked a question that is not covered in your Nepal travel knowledge base.
Answer using your general knowledge about Nepal travel.
Be helpful and accurate, but end your response with this exact line:
"Note: This answer is based on general knowledge. Please verify with official sources before travelling."

Guidelines:
- Be concise and practical
- Do not fabricate specific prices or permit fees
- If you are unsure, say so"""


# ── Views ─────────────────────────────────────────────────────────────────────

class HealthCheckView(APIView):
    """GET /api/health/ — returns status of all components"""

    def get(self, request):
        kb_count = 0
        kb_ok    = False

        try:
            kb_count = _knowledge_base.collection.count()
            kb_ok    = kb_count > 0
        except Exception as e:
            pass

        ollama_ok = _ollama.is_healthy()
        overall   = 'healthy' if (kb_ok and ollama_ok) else 'degraded'

        return Response({
            'status':     overall,
            'components': {
                'chromadb':            kb_ok,
                'knowledge_base_size': kb_count,
                'ollama':              ollama_ok,
                'ollama_model':        _ollama.model,
            }
        })


class ChatView(APIView):
    """
    POST /api/chat/

    Request:
        { "message": "What are the best treks in Nepal?" }

    Response:
        {
            "response":        "...",
            "sources":         [{"title": "...", "category": "...", "relevance": 0.85}],
            "mode":            "rag" | "fallback",
            "processing_time": 2.3
        }
    """

    THRESHOLD = getattr(settings, 'RAG_RELEVANCE_THRESHOLD', 0.40)

    def post(self, request):
        start = time.time()

        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'error': 'message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ── Step 1: Search ChromaDB ───────────────────────────────────
            results = _knowledge_base.search(message, n_results=8)

            docs      = results['documents']
            metas     = results['metadatas']
            distances = results['distances']

            # ── Step 2: Decide mode ───────────────────────────────────────
            top_relevance = (1 - distances[0]) if distances else 0.0
            use_rag       = top_relevance >= self.THRESHOLD

            # ── Step 3: Build context and sources ─────────────────────────
            context = ""
            sources = []

            if use_rag:
                # Separate content chunks from transport chunks.
                # When a query matches both (e.g. "entry fee for Bhaktapur"),
                # content (practical/treks/destinations) surfaces first.
                preferred = []
                transport = []

                for i in range(len(docs)):
                    cat   = metas[i].get('category', '')
                    entry = {
                        'doc':       docs[i],
                        'meta':      metas[i],
                        'relevance': round(1 - distances[i], 3),
                    }
                    if cat == 'transport':
                        transport.append(entry)
                    else:
                        preferred.append(entry)

                # Content first, transport fills remaining slots
                ranked = preferred + transport

                for entry in ranked[:3]:
                    context += entry['doc'] + "\n\n"
                    sources.append({
                        'title':     entry['meta'].get('title', 'Unknown'),
                        'category':  entry['meta'].get('category', ''),
                        'relevance': entry['relevance'],
                    })

            # ── Step 4: Build prompt ──────────────────────────────────────
            if use_rag:
                prompt = (
                    f"CONTEXT:\n{context}\n"
                    f"QUESTION: {message}\n\n"
                    f"ANSWER:"
                )
                system = RAG_SYSTEM_PROMPT
                mode   = "rag"
            else:
                prompt = message
                system = FALLBACK_SYSTEM_PROMPT
                mode   = "fallback"

            print(f"[{mode.upper()}] relevance={top_relevance:.3f} | {message[:60]}")

            # ── Step 5: Generate response ─────────────────────────────────
            answer = _ollama.generate(prompt, system)

            return Response({
                'response':        answer,
                'sources':         sources,
                'mode':            mode,
                'processing_time': round(time.time() - start, 2),
            })

        except Exception as e:
            print(f"[ERROR] ChatView: {e}")
            return Response(
                {'error': f'Error processing request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )