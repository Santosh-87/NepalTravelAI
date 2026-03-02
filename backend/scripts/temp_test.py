from load_knowledge_base import KnowledgeLoader
kb = KnowledgeLoader()
results = kb.search('entry fee for Bhaktapur Durbar Square', n_results=8)
for i, doc in enumerate(results['documents']):
    rel = round(1 - results['distances'][i], 3)
    cat = results['metadatas'][i]['category']
    title = results['metadatas'][i]['title']
    print(f'[{i+1}] {rel} | {cat} | {title}')
    print(f'     {doc[:80]}')
    print()
