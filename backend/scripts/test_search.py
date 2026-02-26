"""
Test RAG Search Functionality
Verify ChromaDB retrieval works
"""

from load_knowledge_base import KnowledgeLoader

print("="*60)
print("TESTING RAG SEARCH")
print("="*60)

# Initialize loader (connects to existing database)
loader = KnowledgeLoader()

print(f"\nDatabase has {loader.collection.count()} chunks loaded")

# Test queries
test_queries = [
    "What are the best treks in Nepal?",
    "Tell me about hidden places in Nepal",
    "What are the major tourist attractions?",
    "Heritage site entry fees",
    "Best time to trek in Nepal",
    "What is the entry fee for Chitwan National Park?",
]

print("\n" + "="*60)
print("RUNNING TEST QUERIES")
print("="*60)

for query in test_queries:
    print(f"\nQuery: {query}")
    print("-" * 60)
    
    results = loader.search(query, n_results=2)
    
    for i in range(len(results['documents'])):
        print(f"\nResult {i+1}:")
        print(f"  Source: {results['metadatas'][i]['title']}")
        print(f"  Relevance: {1 - results['distances'][i]:.3f}")
        print(f"  Preview: {results['documents'][i][:200]}...")
    
    print()

print("="*60)
print("TEST COMPLETE")
print("="*60)
