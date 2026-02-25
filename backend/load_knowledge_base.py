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
        
        print("Knowledge Base Loader - Fixed Version")
        print("-" * 60)
        
        print("\nLoading embedding model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("  Model loaded")
        
        print("\nInitializing ChromaDB...")
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Nepal tourism knowledge base"}
        )
        
        print(f"  ChromaDB ready")
        print(f"  Current chunks: {self.collection.count()}")
    
    def chunk_by_paragraphs(self, text, target_words=400, min_words=100):
        """
        Better chunking: Split by paragraphs, then combine to reach target size
        """
        # Split by double newline (paragraphs)
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        chunks = []
        current_chunk = []
        current_word_count = 0
        
        for para in paragraphs:
            para_words = len(para.split())
            
            
            if current_word_count + para_words > target_words and current_chunk:
                chunk_text = '\n\n'.join(current_chunk)
                if len(chunk_text.split()) >= min_words:
                    chunks.append(chunk_text)
                current_chunk = [para]
                current_word_count = para_words
            else:
                current_chunk.append(para)
                current_word_count += para_words
        
        
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            if len(chunk_text.split()) >= min_words:
                chunks.append(chunk_text)
        
        return chunks
    
    def generate_id(self, content):
        return hashlib.md5(content.encode()).hexdigest()
    
    def load_all(self):
        print("\n" + "="*60)
        print("LOADING KNOWLEDGE BASE")
        print("="*60)
        
        md_files = list(self.kb_path.rglob('*.md'))
        
        if not md_files:
            print(f"\nERROR: No files in {self.kb_path}")
            return False
        
        print(f"\nFound {len(md_files)} documents")
        
        total_chunks = 0
        
        for filepath in md_files:
            try:
                print(f"\nProcessing: {filepath.name}")
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Extract title
                title = "Untitled"
                for line in content.split('\n'):
                    if line.startswith('# '):
                        title = line.replace('# ', '').strip()
                        break
                
                # Count total words
                total_words = len(content.split())
                print(f"  Title: {title}")
                print(f"  Total words: {total_words}")
                
                # Use new chunking
                chunks = self.chunk_by_paragraphs(content)
                print(f"  Created chunks: {len(chunks)}")
                
                # Show chunk sizes
                if chunks:
                    chunk_sizes = [len(c.split()) for c in chunks]
                    print(f"  Chunk sizes: min={min(chunk_sizes)}, max={max(chunk_sizes)}, avg={sum(chunk_sizes)//len(chunk_sizes)}")
                
                # Prepare for database
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
                if documents:
                    self.collection.add(
                        documents=documents,
                        metadatas=metadatas,
                        ids=ids
                    )
                    total_chunks += len(chunks)
                    print(f"  Status: SUCCESS")
                else:
                    print(f"  Status: NO CHUNKS CREATED")
                
            except Exception as e:
                print(f"  ERROR: {e}")
                import traceback
                traceback.print_exc()
        
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        print(f"\nDocuments: {len(md_files)}")
        print(f"Total chunks: {total_chunks}")
        print(f"Database size: {self.collection.count()}")
        print(f"\nDatabase: {Path(self.db_path).absolute()}")
        
        return True
    
    def search(self, query, n_results=3):
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