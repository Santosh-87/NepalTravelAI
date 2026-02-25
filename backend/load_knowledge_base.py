"""
Knowledge Base Loader - Fixed Version
Loads markdown documents into ChromaDB vector database
"""

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from pathlib import Path
import hashlib
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

    def load_all(self):
        """Load all markdown files from knowledge base"""
        print("\n" + "="*60)
        print("LOADING KNOWLEDGE BASE")
        print("="*60)

        md_files = list(self.kb_path.rglob('*.md'))

        if not md_files:
            print(f"\nERROR: No .md files found in {self.kb_path}")
            return False

        print(f"\nFound {len(md_files)} markdown documents")

        total_chunks = 0

        for filepath in md_files:
            try:
                print(f"\nProcessing: {filepath.name}")

                # Load and preprocess
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

                # Determine category from folder name
                category = filepath.parent.name

                # Chunk document
                chunks = self.chunk_text(content)
                print(f"  Chunks: {len(chunks)}")

                # Prepare for ChromaDB
                documents = []
                metadatas = []
                ids = []

                for idx, chunk in enumerate(chunks):
                    # Enrich table chunks with context
                    enriched_chunk = self.enrich_table_chunk(chunk, title)

                    doc_id = f"{filepath.stem}_{idx}_{self.generate_id(enriched_chunk)[:8]}"

                    documents.append(enriched_chunk)
                    metadatas.append({
                        'source': str(filepath),
                        'title': title,
                        'category': category,
                        'chunk_index': idx,
                        'total_chunks': len(chunks)
                    })
                    ids.append(doc_id)

                # Add to ChromaDB (embedding happens automatically via ef)
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )

                total_chunks += len(chunks)
                print(f"  Added {len(chunks)} chunks")

            except Exception as e:
                print(f"  ERROR: {e}")

        print(f"\n{'='*60}")
        print(f" DONE: {len(md_files)} docs, {total_chunks} total chunks")
        print(f"   Collection size: {self.collection.count()}")
        return True

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
    print("\nTest search:")
    results = loader.search("Chitwan National Park entry fee")
    for i, doc in enumerate(results['documents']):
        print(f"\n[{i+1}] Relevance: {1 - results['distances'][i]:.3f}")
        print(f"     Source: {results['metadatas'][i]['title']}")
        print(f"     Preview: {doc[:150]}...")