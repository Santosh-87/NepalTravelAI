"""
Diagnose ChromaDB loading issue
"""
from load_knowledge_base import KnowledgeLoader

loader = KnowledgeLoader()

print(f"Total chunks in database: {loader.collection.count()}")
print("\nQuerying for all documents...")

# Get sample of what's in database
results = loader.collection.get(
    limit=50,
    include=['documents', 'metadatas']
)

# Count unique sources
sources = {}
for meta in results['metadatas']:
    source = meta.get('title', 'Unknown')
    sources[source] = sources.get(source, 0) + 1

print("\nDocuments in database:")
for source, count in sources.items():
    print(f"  {source}: {count} chunks")

print(f"\nTotal unique documents: {len(sources)}")