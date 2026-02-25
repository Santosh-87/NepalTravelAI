"""
Check knowledge base quality
"""
from pathlib import Path

kb_path = Path('knowledge_base')

print("="*60)
print("KNOWLEDGE BASE QUALITY CHECK")
print("="*60)

total_words = 0
file_stats = []

for md_file in kb_path.rglob('*.md'):
    content = md_file.read_text(encoding='utf-8')
    word_count = len(content.split())
    
    file_stats.append({
        'name': md_file.name,
        'words': word_count,
        'folder': md_file.parent.name
    })
    
    total_words += word_count

print(f"\nTotal documents: {len(file_stats)}")
print(f"Total words: {total_words:,}")
print(f"Average words per document: {total_words // len(file_stats):,}")

print("\n" + "-"*60)
print("Document Details:")
print("-"*60)

for stat in sorted(file_stats, key=lambda x: x['words'], reverse=True):
    quality = "GOOD" if stat['words'] > 1000 else "SHORT"
    print(f"{stat['name'][:40]:40} | {stat['words']:6,} words | {quality}")

print("\n" + "="*60)

if total_words > 25000:
    print("STATUS: Knowledge base is sufficient for RAG")
else:
    print("STATUS: Consider adding more content")