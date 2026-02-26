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

    def __init__(self, kb_path='knowledge_base', db_path='chroma_db'):
        self.kb_path = Path(kb_path)
        self.db_path = db_path
        self.collection_name = 'nepal_tourism'

        print("Initializing Knowledge Base Loader")
        print("-" * 60)

        print("\nLoading embedding model...")
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name='all-MiniLM-L6-v2'
        )
        print("  Embedding model loaded")

        # Initialize ChromaDB
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

    # Preprocess markdown content by removing metadata lines, horizontal rules, and redundant headings

    def preprocess_document(self, text, doc_title=''):
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            # Skip metadata lines
            if re.match(r'^\*?(Source:|Last updated:|Information accurate)', stripped):
                continue
            # Skip horizontal rules and blank lines
            if stripped in ['---', '']:
                continue
            # Only skip headings that exactly repeat the document title
            if re.match(r'^#{1,2}\s+', stripped):
                heading_text = re.sub(r'^#{1,2}\s+', '', stripped).strip()
                if heading_text.lower() == doc_title.lower():
                    continue
            cleaned.append(line)
        return '\n'.join(cleaned)

    def enrich_table_chunk(self, chunk, title):
        if chunk.count('|') > 4:
            return (
                f"The following table shows fee and pricing information for {title} "
                f"in Nepal, including costs for foreign nationals, SAARC nationals, "
                f"Chinese nationals, and Nepali citizens:\n\n{chunk}"
            )
        return chunk

    def chunk_text(self, text, chunk_size=300, overlap=30):
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if len(chunk.strip()) > 80:
                chunks.append(chunk)
        return chunks

    def generate_id(self, content):
        return hashlib.md5(content.encode()).hexdigest()

    # Load markdown files from knowledge base, preprocess, chunk, enrich tables, and add to ChromaDB

    def load_markdown_files(self):
        """Load all markdown files from knowledge base."""
        print("\n" + "="*60)
        print("LOADING MARKDOWN DOCUMENTS")
        print("="*60)

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

                print(f"  Title: {title}")

                category = filepath.parent.name
                chunks = self.chunk_text(content)
                print(f"  Chunks: {len(chunks)}")

                documents = []
                metadatas = []
                ids = []

                for idx, chunk in enumerate(chunks):
                    enriched_chunk = self.enrich_table_chunk(chunk, title)
                    doc_id = f"{filepath.stem}_{idx}_{self.generate_id(enriched_chunk)[:8]}"

                    documents.append(enriched_chunk)
                    metadatas.append({
                        'source': str(filepath),
                        'title': title,
                        'category': category,
                        'chunk_index': idx,
                        'total_chunks': len(chunks),
                        'data_type': 'markdown'
                    })
                    ids.append(doc_id)

                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )

                total_chunks += len(chunks)
                print(f"  Added {len(chunks)} chunks")

            except Exception as e:
                print(f"  ERROR processing {filepath.name}: {e}")

        print(f"\n  Markdown total: {total_chunks} chunks from {len(md_files)} files")
        return total_chunks

    # Transport-specific loaders: rental routes and pricing policies. These are converted into plain English paragraphs for better RAG retrieval and chatbot explanations.

    def load_transport_routes(self):
        """
        Load rental_pricing.jsonl into ChromaDB.
        Each route is one document — the rag_text field is what gets embedded.
        All other fields go into metadata for filtering.
        """
        print("\n" + "="*60)
        print("LOADING TRANSPORT ROUTES (rental_pricing.jsonl)")
        print("="*60)

        routes_path = self.kb_path / "transportation" / "rental_pricing.jsonl"

        if not routes_path.exists():
            print(f"\n  WARNING: {routes_path} not found — skipping.")
            return 0

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

        print(f"\n  Found {len(routes)} routes")

        documents = []
        metadatas = []
        ids = []

        for route in routes:
           
            rag_text = route.get("rag_text", "").strip()
            if not rag_text:
                print(f"  [SKIP] Route {route.get('id')} has empty rag_text")
                continue

            doc_id = f"transport_route_{route['id']}"

            documents.append(rag_text)
            metadatas.append({
                'source': str(routes_path),
                'title': route.get('route_name', ''),
                'category': 'transport',
                'data_type': 'transport_route',
                'route_id': route.get('id', ''),
                'category_name': route.get('category_name', ''),
                'trip_type': route.get('trip_type', ''),
                'car_base_rate_npr': route.get('car_base_rate_npr', 0),
                'distance_km': route.get('distance_km') or 0,
                'duration_hours': route.get('duration_hours') or 0,
                'has_rate_deviation': str(route.get('has_rate_deviation', False)),
            })
            ids.append(doc_id)

        if documents:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"  Added {len(documents)} transport route chunks")

        return len(documents)

    def load_transport_policy(self):
        """
        Load pricing_rules.json and vehicle_types.json into ChromaDB.
        These are converted into plain English paragraphs so the
        chatbot can retrieve and explain pricing rules naturally.
        """
        print("\n" + "="*60)
        print("LOADING TRANSPORT POLICY FILES")
        print("="*60)

        total = 0

        # 1. pricing_rules.json
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
                (
                    "pricing_rules_calculation",
                    (
                        "How to calculate the final NATTA transport price step by step: "
                        f"{policy['calculation_guide']}"
                    )
                ),
            ]

            documents = [chunk[1] for chunk in policy_chunks]
            metadatas = [
                {
                    'source': str(policy_path),
                    'title': 'NATTA Pricing Rules',
                    'category': 'transport',
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

       
        vehicles_path = self.kb_path / "transportation" / "vehicle_types.json"

        if vehicles_path.exists():
            with open(vehicles_path, 'r', encoding='utf-8') as f:
                vehicles_data = json.load(f)

            vehicle_chunks = []

            # One chunk describing all vehicles together (for "what vehicle should I use?" queries)
            all_vehicles_text = (
                "NATTA Tourist Vehicle Types and Multipliers in Nepal: "
                f"{vehicles_data.get('description', '')} "
                f"{vehicles_data.get('selection_guide', '')} "
                "Vehicle details: "
            )
            for key, v in vehicles_data["vehicles"].items():
                all_vehicles_text += (
                    f"{v['label']} (multiplier {v['multiplier']}x, "
                    f"{v['pax_min']} to {v['pax_max']} passengers) — {v['description']}. "
                )
            vehicle_chunks.append(("vehicle_types_overview", all_vehicles_text))

            # One chunk per vehicle type (for specific vehicle queries)
            for key, v in vehicles_data["vehicles"].items():
                chunk_text = (
                    f"NATTA Vehicle Type — {v['label']}: "
                    f"{v['description']} "
                    f"Multiplier: {v['multiplier']}x the car base rate. "
                    f"Suitable for {v['pax_min']} to {v['pax_max']} passengers. "
                    f"To calculate price: multiply the car base rate of the route by {v['multiplier']}."
                )
                vehicle_chunks.append((f"vehicle_type_{key}", chunk_text))

            documents = [chunk[1] for chunk in vehicle_chunks]
            metadatas = [
                {
                    'source': str(vehicles_path),
                    'title': 'NATTA Vehicle Types',
                    'category': 'transport',
                    'data_type': 'vehicle_types',
                    'vehicle_key': chunk[0],
                }
                for chunk in vehicle_chunks
            ]
            ids = [f"transport_vehicle_{chunk[0]}" for chunk in vehicle_chunks]

            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"  Added {len(documents)} vehicle type chunks from vehicle_types.json")
            total += len(documents)

        else:
            print(f"  WARNING: {vehicles_path} not found — skipping.")

        return total

    # Master loader to load all knowledge base sources

    def load_all(self):
        """Load ALL knowledge base sources — markdown + transport pricing."""
        print("\n" + "="*60)
        print("LOADING FULL KNOWLEDGE BASE")
        print("="*60)

        md_chunks        = self.load_markdown_files()
        route_chunks     = self.load_transport_routes()
        policy_chunks    = self.load_transport_policy()

        total = md_chunks + route_chunks + policy_chunks

        print(f"\n{'='*60}")
        print(f"  LOAD COMPLETE")
        print(f"  Markdown chunks  : {md_chunks}")
        print(f"  Route chunks     : {route_chunks}")
        print(f"  Policy chunks    : {policy_chunks}")
        print(f"  Total chunks     : {total}")
        print(f"  Collection size  : {self.collection.count()}")
        print(f"{'='*60}")
        return True

    # Search function to query ChromaDB with relevance filtering

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

    print("\n" + "="*60)
    print("TEST SEARCHES")
    print("="*60)

    test_queries = [
        "How much does it cost to go from Kathmandu to Pokhara?",
        "What vehicle should I use for 8 passengers?",
        "Is VAT included in the transport rates?",
        "Chitwan National Park entry fee",
        "What is the night surcharge for transport?",
    ]

    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        results = loader.search(query, n_results=3)
        for i, doc in enumerate(results['documents']):
            print(f"  [{i+1}] Relevance: {1 - results['distances'][i]:.3f}")
            print(f"       Source : {results['metadatas'][i]['title']}")
            print(f"       Type   : {results['metadatas'][i]['data_type']}")
            print(f"       Preview: {doc[:120]}...")