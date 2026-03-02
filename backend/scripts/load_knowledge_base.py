"""
Knowledge Base Loader
Loads markdown documents AND transport pricing data into ChromaDB vector database
"""

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from pathlib import Path
import hashlib
import json
import re


class KnowledgeLoader:

    # Fee/park files: split per ### heading (one chunk per site)
    # All other markdown files: standard word chunking
    HEADING_SPLIT_FILES = {
        'ntb_heritage_site_fees',
        'ntb_park_entry_fees',
    }

    def __init__(self, kb_path=None, db_path=None):

        BACKEND_DIR = Path(__file__).resolve().parent.parent

        self.kb_path = Path(kb_path) if kb_path else BACKEND_DIR / "knowledge_base"
        self.db_path = str(Path(db_path) if db_path else BACKEND_DIR / "chroma_db")
        self.collection_name = 'nepal_tourism'

        print("Initializing Knowledge Base Loader")
        print("-" * 60)
        print(f"\n  Backend dir : {BACKEND_DIR}")
        print(f"  KB path     : {self.kb_path}")
        print(f"  DB path     : {self.db_path}")

        print("\nLoading embedding model...")
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name='all-MiniLM-L6-v2'
        )
        print("  Embedding model loaded")

        print("\nInitializing ChromaDB...")
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(anonymized_telemetry=False)
        )

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.ef,
            metadata={"description": "Nepal tourism knowledge base"}
        )

        print(f"  ChromaDB initialized")
        print(f"  Current documents: {self.collection.count()}")

    # ── Preprocessing ─────────────────────────────────────────────────────

    def preprocess_document(self, text, doc_title=''):
        """Remove metadata lines, horizontal rules, and redundant title headings."""
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if re.match(r'^\*?(Source:|Last updated:|Information accurate|\*\*Source|Sources:)', stripped):
                continue
            if stripped in ['---', '']:
                continue
            if re.match(r'^#{1,2}\s+', stripped):
                heading_text = re.sub(r'^#{1,2}\s+', '', stripped).strip()
                if heading_text.lower() == doc_title.lower():
                    continue
            cleaned.append(line)
        return '\n'.join(cleaned)

    def enrich_chunk_with_title(self, chunk, title, category):
        """
        Prepend document title and category to every chunk.
        e.g. '[Everest Base Camp Trek | treks] Day 03: Fly to Lukla...'
        """
        prefix = f"[{title} | {category}] "
        return prefix + chunk

    def chunk_text(self, text, chunk_size=500, overlap=50):
        """Split text into overlapping word-based chunks."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if len(chunk.strip()) > 80:
                chunks.append(chunk)
        return chunks

    def split_by_heading(self, content, title, category):
        """
        Split on ### headings — one chunk per site/park.
        Used for fee files that list many sites in one document.

        Prepends SITE: <name> so the exact site name dominates the
        embedding — prevents wrong site chunks from winning retrieval.

        e.g. 'SITE: Bhaktapur Durbar Square' beats
             'SITE: National Art Museum Bhaktapur' for the query
             'entry fee for Bhaktapur Durbar Square'
        """
        chunks = []
        sections = content.split('\n### ')

        for section in sections:
            section = section.strip()
            if not section:
                continue
            # Re-add heading marker removed by split
            if not section.startswith('#'):
                section = '### ' + section
            # Skip very short intro sections (overview paragraphs)
            if len(section) < 80:
                continue
            # Extract site name from ### heading line
            first_line = section.split('\n')[0]
            site_name = re.sub(r'^#+\s*', '', first_line).strip()
            # SITE: prefix boosts exact site name matching in embeddings
            prefix = f"[{title} | {category}] SITE: {site_name}. "
            chunks.append(prefix + section)

        return chunks

    def generate_id(self, content):
        return hashlib.md5(content.encode()).hexdigest()

    # ── Markdown Loader ───────────────────────────────────────────────────

    def load_markdown_files(self):
        """Load all markdown files from knowledge base."""
        print("\n" + "=" * 60)
        print("LOADING MARKDOWN DOCUMENTS")
        print("=" * 60)

        md_files = list(self.kb_path.rglob('*.md'))

        if not md_files:
            print(f"\nWARNING: No .md files found in {self.kb_path}")
            return 0

        print(f"\nFound {len(md_files)} markdown documents")
        total_chunks = 0

        for filepath in md_files:
            try:
                print(f"\nProcessing: {filepath.name}")

                with open(filepath, 'r', encoding='utf-8') as f:
                    raw_content = f.read()

                content = self.preprocess_document(raw_content)

                # Extract title from first # heading
                title = filepath.stem.replace('_', ' ').title()
                for line in content.split('\n'):
                    if line.startswith('# '):
                        title = line.replace('# ', '').strip()
                        break

                print(f"  Title   : {title}")

                category = filepath.parent.name

                # Fee files: one chunk per ### site heading
                # All other markdown: standard overlapping word chunking
                if filepath.stem in self.HEADING_SPLIT_FILES:
                    chunks = self.split_by_heading(content, title, category)
                    print(f"  Mode    : heading-split")
                else:
                    chunks = [
                        self.enrich_chunk_with_title(c, title, category)
                        for c in self.chunk_text(content)
                    ]
                    print(f"  Mode    : word-chunked")

                print(f"  Chunks  : {len(chunks)}")

                documents = []
                metadatas = []
                ids       = []

                for idx, chunk in enumerate(chunks):
                    doc_id = f"{filepath.stem}_{idx}_{self.generate_id(chunk)[:8]}"
                    documents.append(chunk)
                    metadatas.append({
                        'source':       str(filepath),
                        'title':        title,
                        'category':     category,
                        'chunk_index':  idx,
                        'total_chunks': len(chunks),
                        'data_type':    'markdown'
                    })
                    ids.append(doc_id)

                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )

                total_chunks += len(chunks)
                print(f"  Added   : {len(chunks)} chunks")

            except Exception as e:
                print(f"  ERROR processing {filepath.name}: {e}")

        print(f"\n  Markdown total: {total_chunks} chunks from {len(md_files)} files")
        return total_chunks

    # ── Transport Loaders ─────────────────────────────────────────────────

    def _load_vehicle_multipliers(self):
        """
        Load vehicle multipliers from vehicle_types.json.
        Returns dict: { 'Car': 1.0, 'Van': 1.5, 'Hiace': 1.75, ... }
        Used to pre-calculate vehicle prices inside every route chunk.
        """
        vehicles_path = self.kb_path / "transportation" / "vehicle_types.json"
        if vehicles_path.exists():
            with open(vehicles_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {v['label']: v['multiplier'] for v in data['vehicles'].values()}
        # Fallback if file missing
        return {
            'Car': 1.0, 'Van': 1.5, 'Jeep': 1.75,
            'Hiace': 1.75, 'Coaster / Mini Bus': 2.5, 'Bus': 3.0
        }

    def load_transport_routes(self):
        """
        Load rental_pricing.jsonl into ChromaDB.

        Each route chunk is enriched with pre-calculated vehicle prices
        from vehicle_types.json so queries like 'hiace from KTM to Pokhara'
        match the route chunk directly — LLM never has to multiply itself.
        """
        print("\n" + "=" * 60)
        print("LOADING TRANSPORT ROUTES (rental_pricing.jsonl)")
        print("=" * 60)

        routes_path = self.kb_path / "transportation" / "rental_pricing.jsonl"

        if not routes_path.exists():
            print(f"\n  WARNING: {routes_path} not found — skipping.")
            return 0

        # Load multipliers once, reuse for every route
        multipliers = self._load_vehicle_multipliers()
        print(f"\n  Vehicle multipliers loaded: {list(multipliers.keys())}")

        routes = []
        with open(routes_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    routes.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"  [ERROR] Line {line_num}: {e}")

        print(f"  Found {len(routes)} routes")

        documents = []
        metadatas = []
        ids       = []

        for route in routes:
            rag_text = route.get("rag_text", "").strip()
            if not rag_text:
                print(f"  [SKIP] Route {route.get('id')} has empty rag_text")
                continue

            # Enrich with pre-calculated vehicle prices (before VAT)
            # This allows vehicle-type queries (e.g. 'hiace', 'coaster') to
            # match route chunks directly without needing a separate lookup
            car_rate = route.get('car_base_rate_npr', 0)
            if car_rate and multipliers:
                vehicle_prices = " | ".join(
                    f"{label} NPR {round(car_rate * mult):,}"
                    for label, mult in multipliers.items()
                )
                rag_text += (
                    f" Pre-calculated vehicle prices (car base NPR {car_rate:,},"
                    f" add 13% VAT): {vehicle_prices}."
                )

            doc_id = f"transport_route_{route['id']}"
            documents.append(rag_text)
            metadatas.append({
                'source':             str(routes_path),
                'title':              route.get('route_name', ''),
                'category':           'transport',
                'data_type':          'transport_route',
                'route_id':           route.get('id', ''),
                'category_name':      route.get('category_name', ''),
                'trip_type':          route.get('trip_type', ''),
                'car_base_rate_npr':  route.get('car_base_rate_npr', 0),
                'distance_km':        route.get('distance_km') or 0,
                'duration_hours':     route.get('duration_hours') or 0,
                'has_rate_deviation': str(route.get('has_rate_deviation', False)),
            })
            ids.append(doc_id)

        if documents:
            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"  Added {len(documents)} transport route chunks (with vehicle prices)")

        return len(documents)

    def load_transport_policy(self):
        """
        Load pricing_rules.json and vehicle_types.json into ChromaDB.

        pricing_rules.json → 6 policy chunks (VAT, night surcharge,
        road surcharge, disposal, overnight, base rule)
        NOTE: calculation_guide chunk removed — prices are now pre-calculated
        in route chunks so the LLM does not need to calculate.

        vehicle_types.json → 1 overview chunk only (for passenger-count
        vehicle recommendation queries like 'what vehicle for 10 people?')
        NOTE: individual per-vehicle chunks removed — multiplier info is
        now baked into every route chunk directly.
        """
        print("\n" + "=" * 60)
        print("LOADING TRANSPORT POLICY FILES")
        print("=" * 60)

        total = 0

        # ── pricing_rules.json ─────────────────────────────────────────────
        policy_path = self.kb_path / "transportation" / "pricing_rules.json"

        if policy_path.exists():
            with open(policy_path, 'r', encoding='utf-8') as f:
                policy = json.load(f)

            policy_chunks = [
                (
                    "pricing_rules_base",
                    (
                        "NATTA Tourist Vehicle Pricing Base Rule: "
                        "All transport rates listed are the CAR base rate in Nepali Rupees (NPR). "
                        "To calculate the price for any other vehicle type, multiply the car base rate "
                        "by that vehicle's multiplier. For example, a Hiace costs 1.75 times the car rate. "
                        f"{policy.get('base_rate_note', '')}"
                    )
                ),
                (
                    "pricing_rules_vat",
                    (
                        f"NATTA VAT Rule: {policy['vat']['rate_percent']}% VAT is NOT included in any "
                        f"listed transport rates in Nepal. {policy['vat']['note']} "
                        "Always add 13% VAT on top of the final calculated vehicle price."
                    )
                ),
                (
                    "pricing_rules_night",
                    (
                        "NATTA Night Surcharge Rules: "
                        f"After 8:00 PM — {policy['time_surcharges']['after_8pm']['description']} "
                        f"After 12:00 AM midnight — {policy['time_surcharges']['after_midnight']['description']}"
                    )
                ),
                (
                    "pricing_rules_road",
                    (
                        "NATTA Road Type Surcharge: "
                        f"{policy['road_type_surcharges']['offroad_gravel_hill']['description']} "
                        "This applies to routes to hill stations, national parks via unpaved roads, "
                        "and any off-road destinations."
                    )
                ),
                (
                    "pricing_rules_disposal",
                    (
                        "NATTA Disposal (Hourly Hire) Rules: "
                        f"{policy['disposal_rules']['note']} "
                        f"Car rate is NPR {policy['disposal_rules']['car_rate_per_hour_npr']} per hour. "
                        f"Full day disposal is {policy['disposal_rules']['full_day_disposal_hours']} hours "
                        f"at NPR {policy['disposal_rules']['full_day_car_rate_per_hour_npr']} per hour for car. "
                        "Multiply by vehicle multiplier for other vehicle types."
                    )
                ),
                (
                    "pricing_rules_overnight",
                    (
                        "NATTA Overnight Stay Charge: "
                        f"{policy['overnight_stay']['description']} "
                        f"Car base rate is NPR {policy['overnight_stay']['car_base_rate_npr']} per night. "
                        f"{policy['overnight_stay']['note']} "
                        "Multiply by vehicle multiplier for other vehicle types."
                    )
                ),
                # NOTE: pricing_rules_calculation removed — pre-calculated
                # vehicle prices in route chunks make this redundant.
            ]

            documents = [chunk[1] for chunk in policy_chunks]
            metadatas = [
                {
                    'source':    str(policy_path),
                    'title':     'NATTA Pricing Rules',
                    'category':  'transport',
                    'data_type': 'pricing_policy',
                    'rule_type': chunk[0],
                }
                for chunk in policy_chunks
            ]
            ids = [f"transport_policy_{chunk[0]}" for chunk in policy_chunks]

            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"  Added {len(documents)} pricing rule chunks from pricing_rules.json")
            total += len(documents)

        else:
            print(f"  WARNING: {policy_path} not found — skipping.")

        # ── vehicle_types.json ─────────────────────────────────────────────
        vehicles_path = self.kb_path / "transportation" / "vehicle_types.json"

        if vehicles_path.exists():
            with open(vehicles_path, 'r', encoding='utf-8') as f:
                vehicles_data = json.load(f)

            # ONE overview chunk only — for passenger-count recommendation queries
            # e.g. "what vehicle should I use for 10 passengers?"
            # Individual per-vehicle chunks removed — multipliers are now
            # baked directly into every route chunk via load_transport_routes()
            overview_text = (
                "NATTA Tourist Vehicle Types and Passenger Capacity in Nepal: "
                f"{vehicles_data.get('description', '')} "
                f"{vehicles_data.get('selection_guide', '')} "
                "Vehicle details: "
            )
            for key, v in vehicles_data["vehicles"].items():
                overview_text += (
                    f"{v['label']} (multiplier {v['multiplier']}x, "
                    f"{v['pax_min']} to {v['pax_max']} passengers) — {v['description']}. "
                )

            self.collection.add(
                documents=[overview_text],
                metadatas=[{
                    'source':    str(vehicles_path),
                    'title':     'NATTA Vehicle Types',
                    'category':  'transport',
                    'data_type': 'vehicle_types',
                }],
                ids=["transport_vehicle_overview"]
            )
            print(f"  Added 1 vehicle overview chunk from vehicle_types.json")
            total += 1

        else:
            print(f"  WARNING: {vehicles_path} not found — skipping.")

        return total

    # ── Master Loader ─────────────────────────────────────────────────────

    def load_all(self):
        """Load ALL knowledge base sources — markdown + transport pricing."""
        print("\n" + "=" * 60)
        print("LOADING FULL KNOWLEDGE BASE")
        print("=" * 60)

        md_chunks     = self.load_markdown_files()
        route_chunks  = self.load_transport_routes()
        policy_chunks = self.load_transport_policy()

        total = md_chunks + route_chunks + policy_chunks

        print(f"\n{'=' * 60}")
        print(f"  LOAD COMPLETE")
        print(f"  Markdown chunks  : {md_chunks}")
        print(f"  Route chunks     : {route_chunks}")
        print(f"  Policy chunks    : {policy_chunks}")
        print(f"  Total chunks     : {total}")
        print(f"  Collection size  : {self.collection.count()}")
        print(f"{'=' * 60}")
        return True

    # ── Search ────────────────────────────────────────────────────────────

    def search(self, query, n_results=5, min_relevance=0.30):
        raw = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        filtered_docs = []
        filtered_meta = []
        filtered_dist = []

        for doc, meta, dist in zip(
            raw['documents'][0],
            raw['metadatas'][0],
            raw['distances'][0]
        ):
            relevance = 1 - dist
            if relevance >= min_relevance:
                filtered_docs.append(doc)
                filtered_meta.append(meta)
                filtered_dist.append(dist)

        return {
            'documents': filtered_docs,
            'metadatas': filtered_meta,
            'distances': filtered_dist
        }


if __name__ == '__main__':
    loader = KnowledgeLoader()
    loader.load_all()

    print("\n" + "=" * 60)
    print("TEST SEARCHES")
    print("=" * 60)

    test_queries = [
        "How much does it cost to go from Kathmandu to Pokhara?",
        "How much does a hiace from Kathmandu to Pokhara cost?",
        "What vehicle should I use for 8 passengers?",
        "Is VAT included in the transport rates?",
        "What is the night surcharge for transport?",
        "Chitwan National Park entry fee",
        "How many days is the Everest Base Camp trek?",
        "What permits do I need for Manaslu Circuit?",
        "Entry fee for Bhaktapur Durbar Square",
    ]

    for query in test_queries:
        print(f"\n Query: {query}")
        results = loader.search(query, n_results=3)
        if not results['documents']:
            print("  No results found.")
            continue
        for i, doc in enumerate(results['documents']):
            print(f"  [{i+1}] Relevance: {1 - results['distances'][i]:.3f}")
            print(f"       Source : {results['metadatas'][i].get('title', 'N/A')}")
            print(f"       Type   : {results['metadatas'][i].get('data_type', 'markdown')}")
            print(f"       Preview: {doc[:120]}...")