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

FOR ENTRY FEES AND SITE PRICES:
- Always list ALL nationality tiers from the context: Foreign Nationals, SAARC Nationals, Chinese Nationals, and Nepalese
- Never show only one price — show the full breakdown
- Format as a bullet list: Foreign: NPR X | SAARC: NPR Y | Nepalese: NPR Z

FOR TRANSPORT PRICING:
- Find the route chunk whose title matches the destination in the question
- Use ONLY that matching route chunk for prices — ignore all other route chunks
- State the route name and the pre-calculated vehicle price from the context
- Always show: Vehicle price NPR X (before VAT)
- Then show: If VAT bill required: +13% VAT = NPR Y → Total NPR Z
- Do NOT fabricate prices — only use numbers explicitly stated in the context

FOR MULTI-SEGMENT ITINERARY OR QUOTATION:
- List each segment on its own line with its pre-VAT price from the context
- For overnight stays: Car overnight = NPR 3,000 per night, multiply by vehicle multiplier
- Sum all segment prices into a single TOTAL BEFORE VAT at the bottom
- Do NOT add VAT to each line separately
- At the very end show once: "If VAT bill required: +13% VAT = NPR X → Grand Total NPR Y"
- If a segment is not found in the context, say "rate not available" for that line
- Do NOT fabricate any prices"""

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

    # Transport/vehicle words → transport chunks rank first
    VEHICLE_KEYWORDS = {
        'hiace', 'van', 'jeep', 'coaster', 'bus', 'minibus',
        'microbus', 'vehicle', 'car', 'transport', 'ride',
        'driver', 'pickup', 'drop', 'transfer'
    }

    # Itinerary/quotation words → multi-segment mode (more chunks passed)
    ITINERARY_KEYWORDS = {
        'itinerary', 'quotation', 'quote', 'trip', 'tour',
        'arrival', 'departure', 'overnight', 'nights', 'days',
        'package', 'multi', 'full', 'complete'
    }

    def _is_transport_query(self, message: str) -> bool:
        """Return True if the query is clearly about transport/vehicle pricing."""
        words = set(message.lower().split())
        return bool(words & self.VEHICLE_KEYWORDS)

    def _is_itinerary_query(self, message: str) -> bool:
        """Return True if the query is asking for a multi-segment itinerary or quotation."""
        words = set(message.lower().split())
        return bool(words & self.ITINERARY_KEYWORDS)

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
            # Use more results for itinerary queries so all segments
            # have a chance to be retrieved
            is_transport  = self._is_transport_query(message)
            is_itinerary  = self._is_itinerary_query(message)

            if is_transport and is_itinerary:
                n_results = 15   # multi-segment — need many route chunks
            elif is_transport:
                n_results = 8    # single route query
            else:
                n_results = 8    # content query

            results = _knowledge_base.search(message, n_results=n_results)

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
                preferred         = []   # practical, treks, destinations
                transport_routes  = []   # data_type = transport_route
                transport_policy  = []   # data_type = pricing_policy or vehicle_types

                for i in range(len(docs)):
                    cat       = metas[i].get('category', '')
                    data_type = metas[i].get('data_type', '')
                    entry = {
                        'doc':       docs[i],
                        'meta':      metas[i],
                        'relevance': round(1 - distances[i], 3),
                    }
                    if cat != 'transport':
                        preferred.append(entry)
                    elif data_type == 'transport_route':
                        transport_routes.append(entry)
                    else:
                        # pricing_policy and vehicle_types
                        transport_policy.append(entry)

                if is_transport and is_itinerary:
                    # Multi-segment itinerary — pass up to 5 route chunks
                    # so arrival, sightseeing, intercity, overnight, departure
                    # all have a route chunk in context
                    # Also pass 2 policy chunks (VAT + overnight rule)
                    ranked = transport_routes[:5] + transport_policy[:2] + preferred[:1]
                    print(f"  [RERANK] itinerary-mode | routes={len(transport_routes)} policy={len(transport_policy)} content={len(preferred)}")

                elif is_transport:
                    # Top 3 routes so correct destination chunk is always included
                    # (ChromaDB may rank correct chunk 2nd or 3rd due to embedding similarity)
                    ranked = transport_routes[:3] + transport_policy[:1]
                    print(f"  [RERANK] transport-first | routes={len(transport_routes)} policy={len(transport_policy)} content={len(preferred)}")

                else:
                    # Content first, transport fills remaining slots
                    ranked = preferred + transport_routes + transport_policy
                    print(f"  [RERANK] content-first | content={len(preferred)} transport={len(transport_routes)}")

                # Cap context at 4 chunks maximum to avoid overloading LLM
                for entry in ranked[:4]:
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