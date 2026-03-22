"""
Chatbot API Views
GET  /api/health/  — system status
POST /api/chat/    — main chat endpoint
"""

import re
import time
import sys
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ── Make backend/ importable (for scripts/ package) ──────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from scripts.load_knowledge_base import KnowledgeLoader
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

RAG_SYSTEM_PROMPT = """You are NepalTravel AI, a Nepal travel assistant. Answer using ONLY the provided context. Be concise. Use bullet points.

RULE 1 — TRANSPORT PRICES (CRITICAL — read, never calculate):
• The context contains FINAL pre-calculated vehicle prices after the words "FINAL vehicle prices".
• Copy the price directly from context. NEVER add, multiply, or combine prices yourself.
• Format your answer exactly like this:
  Route: [name]
  Car base: NPR [X]
  [Vehicle]: NPR [Y] (from context)
  +13% VAT: NPR [Z]
  Total: NPR [final]
• If the user asks for Hiace price, find "Hiace NPR ___" in the FINAL vehicle prices line and copy that number.

RULE 2 — VEHICLE SELECTION BY PASSENGER COUNT (use ONLY these exact ranges):
• 1-3 passengers → Car
• 4-6 passengers → Van or Jeep (Jeep for hills)
• 7-14 passengers → Hiace
• 15-25 passengers → Coaster / Mini Bus
• 25-35 passengers → Bus
• 27 people = 1 Bus. 19 people = 1 Coaster. Do NOT suggest multiple vehicles when one fits.
• Only suggest multiple vehicles if passengers exceed 35.
• NEVER change or invent capacity numbers. Use the exact ranges above.

RULE 3 — ITINERARIES (keep short):
• Use this exact format — one line per day, no paragraphs:
  Day 1: [Origin] → [Destination] ([drive time]) - [2-3 activities max]
  Day 2: [Place] - [2-3 activities max]
• Maximum 1-2 short sentences per day. No long descriptions.
• Only include destinations on the actual route. Do NOT add treks, passes, or detours unless the user explicitly asks.
• A road trip between two cities is NOT a trek. Keep it simple.
• End with vehicle recommendation and price if available in context.

RULE 4 — MULTI-SEGMENT TRANSPORT:
• List each segment price from context on its own line.
• Sum segments as TOTAL BEFORE VAT. Add 13% VAT once at the end.
• If a segment price is not in context, write "rate not available".

RULE 5 — ENTRY FEES:
• List every nationality tier from context: Foreign | SAARC | Chinese | Indian | Nepalese.

RULE 6 — GENERAL QUESTIONS:
• 3-5 sentences max. Include practical details from context (duration, difficulty, best season).
• Never fabricate prices or facts not in context.

NEVER invent numbers. If the answer is not in the context, say "I don't have this information."
"""

FALLBACK_SYSTEM_PROMPT = """You are NepalTravel AI, a knowledgeable and friendly Nepal travel assistant.

The user has asked a question that is not covered in your Nepal travel knowledge base.
Answer using your general knowledge about Nepal travel.
Be helpful and accurate, but end your response with this exact line:
"Note: This answer is based on general knowledge. Please verify with official sources before travelling."

Guidelines:
- Be concise and practical
- Do not fabricate specific prices or permit fees
- If you are unsure, say so"""

ITINERARY_SYSTEM_PROMPT = """You are NepalTravel AI, a Nepal travel assistant. Plan a day-by-day itinerary using ONLY the provided context.

FORMAT — use this exact structure, one line per day:
  Day 1: [Origin] → [Destination] ([drive time]) - [2-3 activities]
  Day 2: [Place] - [2-3 activities]
  Day 3: [Place] → [Next place] ([drive time]) - [2-3 activities]

RULES:
1. Maximum 1-2 short sentences per day. No long paragraphs.
2. Only include destinations on the actual route. Do NOT add detours, side trips, or treks unless the user explicitly asked.
3. A road trip between two cities is NOT a trek. Keep it simple and practical.
4. Include practical details from context: driving time, altitude, key sights.
5. At the END of the itinerary, add one line for transport:
   "Recommended vehicle: [type] — approximately NPR [price] + 13% VAT" (only if price is in context).
6. If the context does not have enough information for a full itinerary, plan what you can and say "I don't have detailed day-by-day information for this route."
7. NEVER fabricate place names, distances, or prices not found in the context.
8. Keep the total response short — no more than 10-12 lines."""

VEHICLE_RECOMMENDATION_PROMPT = """You are NepalTravel AI, a Nepal travel assistant.

VEHICLE CAPACITY TABLE (use ONLY these exact ranges — do NOT change the numbers):
• Car: 1-3 passengers
• Van: 4-6 passengers
• Jeep: 4-6 passengers (for hills/off-road)
• Hiace: 7-14 passengers
• Coaster / Mini Bus: 15-25 passengers
• Bus: 25-35 passengers

RULES:
1. Read the number of passengers from the question.
2. Find the vehicle whose range contains that number using the table above.
3. If passengers exceed 35, suggest multiple vehicles (e.g. 2 x Bus).
4. NEVER invent capacity numbers. ONLY use the exact ranges from the table above.
5. A Bus holds 25-35 passengers. 27 people fits in 1 Bus.
6. A Coaster holds 15-25 passengers. 19 people fits in 1 Coaster.

Format:
• Recommended vehicle: [type] ([X]-[Y] passengers)
• Why: [one sentence]

If multiple vehicles needed:
• Option A: [N] x [vehicle] ([X]-[Y] passengers each)
• Option B: 1 x [larger vehicle] ([X]-[Y] passengers)

Do NOT show route prices, VAT, NPR amounts, or pricing templates.
Do NOT mention specific routes unless the user asked about one.
Keep it to 3-5 lines maximum."""


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
        'driver', 'pickup', 'drop', 'transfer', 'rental', 'rent', 'hire',
    }

    # Itinerary/quotation words → multi-segment mode (more chunks passed)
    ITINERARY_KEYWORDS = {
        'itinerary', 'quotation', 'quote', 'trip', 'tour',
        'arrival', 'departure', 'overnight', 'nights', 'days',
        'package', 'multi', 'full', 'complete', 'plan', 'schedule',
    }

    # Passenger-count patterns → force vehicle_types chunk into context
    PASSENGER_KEYWORDS = {
        'people', 'person', 'persons', 'passengers', 'pax',
        'family', 'group', 'members', 'friends', 'seats',
    }

    def _is_transport_query(self, message: str) -> bool:
        """Return True if the query is clearly about transport/vehicle pricing."""
        words = set(message.lower().split())
        return bool(words & self.VEHICLE_KEYWORDS)

    def _is_itinerary_query(self, message: str) -> bool:
        """Return True if the query is asking for a multi-segment itinerary or quotation."""
        words = set(message.lower().split())
        return bool(words & self.ITINERARY_KEYWORDS)

    # Passenger count → marketplace vehicle_type choices
    # Knowledge base uses: car, van, jeep, hiace, coaster, bus
    # Marketplace model uses: car, suv, hiace, coaster, bus
    PASSENGER_TO_VEHICLE_TYPES = [
        (1,  3,  ['car', 'suv']),
        (4,  6,  ['suv', 'hiace']),
        (7,  14, ['hiace']),
        (15, 25, ['coaster']),
        (26, 35, ['bus']),
    ]

    def _is_passenger_query(self, message: str) -> bool:
        """Return True if the query mentions passenger count or group size."""
        lower = message.lower()
        # Regex check handles cases like "19people" (no space)
        if re.search(r'\d+\s*(?:' + '|'.join(self.PASSENGER_KEYWORDS) + r')', lower):
            return True
        words = set(lower.split())
        return bool(words & self.PASSENGER_KEYWORDS)

    def _is_vehicle_recommendation_query(self, message: str) -> bool:
        """
        Pure vehicle recommendation: user asks which vehicle for N people,
        but is NOT asking about a specific route or price.
        """
        if not self._is_passenger_query(message):
            return False
        lower = message.lower()
        # If asking for a price on a specific route, it's a pricing query
        if any(kw in lower for kw in ['how much', 'price', 'cost', 'rate', 'npr']):
            return False
        # If mentioning a route direction, it's a transport query
        if ' to ' in lower or ' from ' in lower:
            return False
        return True

    def _extract_passenger_count(self, message: str):
        """Extract passenger count from message. Returns int or None."""
        patterns = [
            r'(\d+)\s*(?:people|person|persons|passengers|pax|members|friends|seats)',
            r'(?:family|group)\s*(?:of)?\s*(\d+)',
            r'(?:for|of)\s+(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                return int(match.group(1))
        return None

    def _get_vehicle_types_for_passengers(self, count):
        """Map passenger count to marketplace vehicle_type filter values."""
        for pax_min, pax_max, types in self.PASSENGER_TO_VEHICLE_TYPES:
            if pax_min <= count <= pax_max:
                return types
        if count > 35:
            return ['bus']
        return []

    def _find_marketplace_vehicles(self, passenger_count=None, vehicle_types_list=None):
        """
        Query marketplace for available vehicles matching the recommendation.
        Returns list of dicts with vehicle info for the frontend.
        """
        from marketplace.models import VehicleListing

        qs = VehicleListing.objects.filter(status='approved', is_available=True)

        if vehicle_types_list:
            qs = qs.filter(vehicle_type__in=vehicle_types_list)

        if passenger_count:
            qs = qs.filter(seating_capacity__gte=passenger_count)

        qs = qs.order_by('price_per_day')[:6]

        vehicles = []
        for v in qs:
            img_url = None
            if v.primary_image:
                try:
                    img_url = v.primary_image.url
                except Exception:
                    pass

            vehicles.append({
                'id':                v.id,
                'vehicle_name':      v.vehicle_name,
                'vehicle_type':      v.get_vehicle_type_display(),
                'seating_capacity':  v.seating_capacity,
                'price_per_day':     str(v.price_per_day),
                'available_location': v.available_location,
                'primary_image':     img_url,
            })

        return vehicles

    @staticmethod
    def _clean_response(text):
        """Remove unfilled template placeholders from LLM output."""
        # Replace "NPR [Z]", "NPR [final]", "NPR [X]", "NPR " (empty) patterns
        text = re.sub(r'NPR\s*\[[\w\s]*\]', 'NPR (not available)', text)
        # Remove lines that are just template remnants
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            # Skip lines that are just "+13% VAT: NPR (not available)" or "Total: NPR (not available)"
            if stripped in ('', '+13% VAT: NPR (not available)', 'Total: NPR (not available)'):
                continue
            # Skip lines with empty NPR values like "Car base: NPR "
            if re.match(r'^.*:\s*NPR\s*$', stripped):
                continue
            cleaned.append(line)
        return '\n'.join(cleaned).strip()

    def post(self, request):
        start = time.time()

        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'error': 'message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ── Step 1: Classify query ────────────────────────────────────
            is_transport      = self._is_transport_query(message)
            is_itinerary      = self._is_itinerary_query(message)
            is_passenger      = self._is_passenger_query(message)
            is_recommendation = self._is_vehicle_recommendation_query(message)
            pax_count         = self._extract_passenger_count(message) if is_passenger else None

            # Determine query_type for dynamic token allocation
            if is_itinerary:
                query_type = 'itinerary'
            elif is_transport:
                query_type = 'transport'
            else:
                query_type = 'default'

            # ── Step 2: Direct-fetch vehicle_types chunk for passenger queries
            # Bypasses semantic search — always available when needed
            vehicle_types_chunk = None
            if is_passenger:
                try:
                    vt_result = _knowledge_base.collection.get(
                        ids=["transport_vehicle_overview"]
                    )
                    if vt_result and vt_result['documents']:
                        vehicle_types_chunk = {
                            'doc':       vt_result['documents'][0],
                            'meta':      vt_result['metadatas'][0],
                            'relevance': 1.0,
                        }
                        print(f"  [DIRECT-FETCH] vehicle_types chunk loaded for passenger query")
                except Exception as e:
                    print(f"  [WARN] Could not fetch vehicle_types chunk: {e}")

            # ── Step 3: Search ChromaDB ───────────────────────────────────
            if is_transport and is_itinerary:
                n_results = 15
            elif is_transport:
                n_results = 8
            else:
                n_results = 8

            results = _knowledge_base.search(message, n_results=n_results)

            docs      = results['documents']
            metas     = results['metadatas']
            distances = results['distances']

            # ── Step 4: Decide RAG vs fallback ────────────────────────────
            top_relevance = (1 - distances[0]) if distances else 0.0
            use_rag       = top_relevance >= self.THRESHOLD

            # Override: if we have the vehicle_types chunk, force RAG mode
            # so passenger queries never fall to generic fallback
            if not use_rag and vehicle_types_chunk:
                use_rag = True
                print(f"  [OVERRIDE] Forcing RAG — vehicle_types chunk available")

            context = ""
            sources = []

            if use_rag:
                preferred         = []
                transport_routes  = []
                transport_policy  = []
                vehicle_types     = []

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
                    elif data_type == 'vehicle_types':
                        vehicle_types.append(entry)
                    else:
                        transport_policy.append(entry)

                # ── Step 4b: Rerank by query type ─────────────────────────
                if is_recommendation:
                    # Pure vehicle recommendation — vehicle_types chunk only,
                    # no route chunks (they confuse the model into pricing mode)
                    ranked = []
                    max_chunks = 1
                    print(f"  [RERANK] vehicle-recommendation | pax={pax_count}")

                elif is_transport and is_itinerary:
                    ranked = transport_routes[:5] + transport_policy[:2] + preferred[:1]
                    max_chunks = 5
                    print(f"  [RERANK] itinerary+transport | routes={len(transport_routes)} policy={len(transport_policy)} content={len(preferred)}")

                elif is_transport:
                    ranked = transport_routes[:3] + transport_policy[:1]
                    max_chunks = 3
                    print(f"  [RERANK] transport-first | routes={len(transport_routes)} policy={len(transport_policy)} content={len(preferred)}")

                elif is_itinerary:
                    # Prioritise destination content; limit route chunks to 1
                    # to avoid pricing data overwhelming the itinerary format
                    ranked = preferred[:4] + transport_routes[:1]
                    max_chunks = 4
                    print(f"  [RERANK] itinerary-content | content={len(preferred)} routes={len(transport_routes)}")

                else:
                    ranked = preferred + transport_routes + transport_policy
                    max_chunks = 3
                    print(f"  [RERANK] content-first | content={len(preferred)} transport={len(transport_routes)}")

                # Inject vehicle_types chunk for any passenger query
                # Uses the direct-fetched chunk (guaranteed available)
                if is_passenger and vehicle_types_chunk:
                    vt_doc = vehicle_types_chunk['doc']
                    if not any(e['doc'] == vt_doc for e in ranked):
                        ranked.insert(0, vehicle_types_chunk)
                        max_chunks += 1
                        print(f"  [INJECT] vehicle_types chunk added for passenger query")

                # Build context string
                for entry in ranked[:max_chunks]:
                    context += entry['doc'] + "\n\n"
                    sources.append({
                        'title':     entry['meta'].get('title', 'Unknown'),
                        'category':  entry['meta'].get('category', ''),
                        'relevance': entry['relevance'],
                    })

                # ── Debug: log what context is being sent to LLM ──────────
                print(f"  [CONTEXT] {len(ranked[:max_chunks])} chunks, ~{len(context)} chars")
                for idx, entry in enumerate(ranked[:max_chunks]):
                    print(f"    chunk {idx+1}: [{entry['meta'].get('data_type','md')}] "
                          f"{entry['meta'].get('title','?')[:40]} "
                          f"(rel={entry['relevance']:.3f})")

            # ── Step 5: Build prompt ──────────────────────────────────────
            if use_rag:
                prompt = (
                    f"CONTEXT:\n{context}\n"
                    f"QUESTION: {message}\n\n"
                    f"ANSWER:"
                )
                # Use dedicated prompts to prevent small models mixing formats
                if is_recommendation:
                    system = VEHICLE_RECOMMENDATION_PROMPT
                elif is_itinerary and not is_transport:
                    system = ITINERARY_SYSTEM_PROMPT
                else:
                    system = RAG_SYSTEM_PROMPT
                mode = "rag"
            else:
                prompt = message
                system = FALLBACK_SYSTEM_PROMPT
                mode   = "fallback"

            print(f"[{mode.upper()}] relevance={top_relevance:.3f} | query_type={query_type} "
                  f"| recommend={is_recommendation} | {message[:60]}")

            # ── Step 6: Generate response ─────────────────────────────────
            answer = _ollama.generate(prompt, system, query_type=query_type)
            answer = self._clean_response(answer)

            # ── Step 7: Marketplace vehicle lookup ────────────────────────
            marketplace_vehicles = []
            if is_passenger and pax_count:
                vtype_filters = self._get_vehicle_types_for_passengers(pax_count)
                marketplace_vehicles = self._find_marketplace_vehicles(
                    passenger_count=pax_count,
                    vehicle_types_list=vtype_filters,
                )
                print(f"  [MARKETPLACE] {len(marketplace_vehicles)} vehicles for {pax_count} pax "
                      f"(types={vtype_filters})")

            return Response({
                'response':        answer,
                'sources':         sources,
                'mode':            mode,
                'processing_time': round(time.time() - start, 2),
                'vehicles':        marketplace_vehicles,
            })

        except Exception as e:
            print(f"[ERROR] ChatView: {e}")
            return Response(
                {'error': f'Error processing request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )