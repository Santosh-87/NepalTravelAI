"""
Test RAG Search Functionality
Verify ChromaDB retrieval works across the full knowledge base
"""

from load_knowledge_base import KnowledgeLoader

print("=" * 60)
print("TESTING RAG SEARCH — FULL KNOWLEDGE BASE")
print("=" * 60)

loader = KnowledgeLoader()
print(f"\nDatabase has {loader.collection.count()} chunks loaded")

test_queries = [

    # ── TREKS ─────────────────────────────────────────────────────────────
    "How many days is the Everest Base Camp trek?",
    "What is the highest point of the Annapurna Circuit trek?",
    "What permits do I need for the Manaslu Circuit trek?",
    "How difficult is the Poon Hill trek?",
    "What can I see from Gokyo Ri?",
    "What is the best time to do the Annapurna Base Camp trek?",
    "How long is the Langtang Valley trek?",
    "Tell me about Rara Lake trek",
    "What is special about Upper Mustang?",

    # ── DESTINATIONS ──────────────────────────────────────────────────────
    "What are the best things to do in Kathmandu?",
    "Tell me about Pokhara",
    "What can I see in Chitwan National Park?",
    "Tell me about Bandipur village",
    "What is Bhaktapur famous for?",
    "What is Lumbini known for?",
    "Tell me about Bardiya National Park",
    "What are the top short tours in Nepal?",

    # ── HIDDEN GEMS ───────────────────────────────────────────────────────
    "What are the hidden places in Nepal?",
    "Tell me about Nagarkot",

    # ── FEES & PERMITS ────────────────────────────────────────────────────
    "How much is the entry fee for Sagarmatha National Park?",
    "What is the entry fee for Bhaktapur Durbar Square for foreigners?",
    "How much does it cost to enter Pashupatinath Temple?",
    "What is the entry fee for Boudhanath Stupa?",
    "How much is the Annapurna Conservation Area permit?",
    "What are the trekking permits required for Nepal?",

    # ── PRACTICAL ─────────────────────────────────────────────────────────
    "What is the best time to visit Nepal?",
    "How do I get a Nepal tourist visa?",
    "How much does a trip to Nepal cost?",
    "What are the symptoms of altitude sickness?",
    "How much does trekking in Nepal cost?",

    # ── TRANSPORT ─────────────────────────────────────────────────────────
    "How much does it cost to go from Kathmandu to Pokhara by car?",
    "What vehicle should I use for 8 passengers?",
    "Is VAT included in the transport rates?",
    "What is the night surcharge for transport in Nepal?",
]

print(f"\nTotal test queries: {len(test_queries)}")
print("\n" + "=" * 60)
print("RUNNING TEST QUERIES")
print("=" * 60)

passed = 0
failed = 0
low_relevance = 0

for query in test_queries:
    print(f"\n🔍 {query}")
    print("-" * 60)

    results = loader.search(query, n_results=3)

    if not results['documents']:
        print("   NO RESULTS FOUND")
        failed += 1
        continue

    top_relevance = 1 - results['distances'][0]

    if top_relevance < 0.35:
        print(f"   LOW RELEVANCE ({top_relevance:.3f})")
        low_relevance += 1
    else:
        passed += 1

    for i in range(len(results['documents'])):
        relevance = 1 - results['distances'][i]
        title = results['metadatas'][i].get('title', 'N/A')
        category = results['metadatas'][i].get('category', 'N/A')
        preview = results['documents'][i][:150]
        print(f"  [{i+1}] {relevance:.3f} | {category} | {title}")
        print(f"       {preview}...")

print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"  Total queries    : {len(test_queries)}")
print(f"  Good results  : {passed}")
print(f"   Low relevance : {low_relevance}")
print(f"   No results    : {failed}")
print(f"  DB chunk count   : {loader.collection.count()}")
print("=" * 60)

if failed > 0:
    print("\n    Some queries returned no results.")
    print("  Check that ChromaDB was reloaded after adding new files.")
if low_relevance > 3:
    print("\n   Several low-relevance results detected.")
    print("  Consider increasing chunk_size in load_knowledge_base.py")