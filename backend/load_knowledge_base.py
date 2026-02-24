"""
Knowledge Base Loader
Loads markdown documents into ChromaDB vector database
"""

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pathlib import Path
import hashlib

class KnowledgeLoader:
    
    def __init__(self, kb_path='knowledge_base', db_path='chroma_db'):
        self.kb_path = Path(kb_path)
        self.db_path = db_path
        self.collection_name = 'nepal_tourism'
        
        print("Initializing Knowledge Base Loader")
        print("-" * 60)
        
        # Load embedding model
        print("\nLoading embedding model (30 seconds)...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("  Embedding model loaded")
        
        # Initialize ChromaDB
        print("\nInitializing ChromaDB...")
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Nepal tourism knowledge base"}
        )
        
        print(f"  ChromaDB initialized")
        print(f"  Current documents: {self.collection.count()}")
    
    def chunk_text(self, text, chunk_size=500, overlap=50):
        """Split text into overlapping chunks for better context preservation"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if len(chunk.strip()) > 100:
                chunks.append(chunk)
        
        return chunks
    
    def load_document(self, filepath):
        """Load single markdown file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def generate_id(self, content):
        """Generate unique ID for chunk"""
        return hashlib.md5(content.encode()).hexdigest()
    
    def load_all(self):
        """Load all markdown files from knowledge base"""
        print("\n" + "="*60)
        print("LOADING KNOWLEDGE BASE")
        print("="*60)
        
        # Find all .md files
        md_files = list(self.kb_path.rglob('*.md'))
        
        if not md_files:
            print(f"\nERROR: No .md files found in {self.kb_path}")
            return False
        
        print(f"\nFound {len(md_files)} markdown documents")
        
        total_chunks = 0
        
        for filepath in md_files:
            try:
                print(f"\nProcessing: {filepath.name}")
                
                # Load content
                content = self.load_document(filepath)
                
                # Extract title
                title = "Untitled"
                for line in content.split('\n'):
                    if line.startswith('# '):
                        title = line.replace('# ', '').strip()
                        break
                
                print(f"  Title: {title}")
                
                # Chunk document
                chunks = self.chunk_text(content)
                print(f"  Chunks: {len(chunks)}")
                
                # Prepare for ChromaDB
                documents = []
                metadatas = []
                ids = []
                
                for idx, chunk in enumerate(chunks):
                    doc_id = f"{filepath.stem}_{idx}_{self.generate_id(chunk)[:8]}"
                    
                    documents.append(chunk)
                    metadatas.append({
                        'source': str(filepath),
                        'title': title,
                        'chunk_index': idx,
                        'total_chunks': len(chunks)
                    })
                    ids.append(doc_id)
                
                # Add to database
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                
                total_chunks += len(chunks)
                print(f"  Added to database: SUCCESS")
                
            except Exception as e:
                print(f"  ERROR: {e}")
        
        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        print(f"\nDocuments processed: {len(md_files)}")
        print(f"Total chunks created: {total_chunks}")
        print(f"Database size: {self.collection.count()}")
        print(f"\nDatabase location: {Path(self.db_path).absolute()}")
        print(f"Knowledge base location: {self.kb_path.absolute()}")
        
        return True
    
    def search(self, query, n_results=3):
        """Test search functionality"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return {
            'documents': results['documents'][0],
            'metadatas': results['metadatas'][0],
            'distances': results['distances'][0]
        }

if __name__ == '__main__':
    loader = KnowledgeLoader()
    loader.load_all()