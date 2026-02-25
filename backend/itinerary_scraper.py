"""
Nepal Itinerary & Destination Scraper
Scrapes detailed destination guides for RAG knowledge base
"""

import requests
from bs4 import BeautifulSoup
import time
from pathlib import Path
import re
from datetime import datetime

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas not available for table extraction")

class NepalItineraryScraper:
    
    def __init__(self, output_dir='knowledge_base'):
        self.output_dir = Path(output_dir)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        
        # Create directories
        (self.output_dir / 'destinations').mkdir(parents=True, exist_ok=True)
        (self.output_dir / 'treks').mkdir(parents=True, exist_ok=True)
    
    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        # Preserve currency symbols (NPR, $, £, ₹, %) useful for fee data
        text = re.sub(r'[^\w\s\-.,!?():/\$\%\£\₹]', '', text)
        return text.strip()
    
    def scrape_destination(self, name, urls, category='destinations'):
        print(f"\nProcessing: {name}")
        print(f"URLs: {len(urls)} sources")
        
        all_sections = []
        
        try:
            for idx, url in enumerate(urls, 1):
                print(f"  Source {idx}/{len(urls)}: {url[:60]}...")
                
                try:
                    response = self.session.get(url, headers=self.headers, timeout=30)
                    response.raise_for_status()
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find main content
                    main = (
                        soup.find('article') or
                        soup.find('div', class_=re.compile(r'post|content|entry', re.I)) or
                        soup.find('main') or
                        soup.body
                    )
                    
                    if not main:
                        print(f"    No content found")
                        continue
                    
                    # Remove unwanted elements
                    for unwanted in main.find_all(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                        unwanted.decompose()
                    
                    # Extract sections
                    current = {'title': name, 'content': '', 'source': url}
                    
                    for el in main.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'table']):
                        
                        if el.name in ['h1', 'h2', 'h3', 'h4']:
                            title = self.clean_text(el.get_text())
                            if len(title) > 2 and not any(
                                skip in title.lower()
                                for skip in ['menu', 'footer', 'comment', 'share', 'related', 'navigation', 'subscribe']
                            ):
                                if current['content'].strip():
                                    all_sections.append(current)
                                current = {'title': title, 'content': '', 'source': url}
                        
                        elif el.name == 'p':
                            text = self.clean_text(el.get_text())
                            if len(text) > 50:
                                current['content'] += f"\n\n{text}"
                        
                        elif el.name in ['ul', 'ol']:
                            for li in el.find_all('li', recursive=False):
                                text = self.clean_text(li.get_text())
                                if len(text) > 15:
                                    current['content'] += f"\n- {text}"
                            current['content'] += "\n"
                        
                        elif el.name == 'table' and PANDAS_AVAILABLE:
                            try:
                                df = pd.read_html(str(el))[0]
                                current['content'] += f"\n\n{df.to_markdown(index=False)}\n"
                            except Exception:
                                # Fallback: manual table extraction
                                current['content'] += "\n\n"
                                for row in el.find_all('tr'):
                                    cells = [self.clean_text(cell.get_text()) for cell in row.find_all(['td', 'th'])]
                                    current['content'] += " | ".join(cells) + "\n"
                    
                    if current['content'].strip():
                        all_sections.append(current)
                    
                    print(f"    Extracted {len(all_sections)} sections so far")
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"    ERROR scraping {url}: {e}")
                    continue
            
            # Build markdown
            markdown = f"# {name}\n\n"
            markdown += f"**Sources:**\n"
            for url in urls:
                markdown += f"- {url}\n"
            markdown += f"\n**Last updated:** {datetime.now().strftime('%B %d, %Y')}\n\n"
            markdown += "---\n\n"
            
            # Deduplicate similar sections by title fingerprint
            unique_sections = []
            seen_titles = set()
            
            for section in all_sections:
                fingerprint = section['title'].lower()[:30]
                if fingerprint not in seen_titles:
                    seen_titles.add(fingerprint)
                    unique_sections.append(section)
            
            # Write sections
            for section in unique_sections:
                if section['content'].strip():
                    markdown += f"## {section['title']}\n\n"
                    markdown += section['content'].strip()
                    markdown += "\n\n---\n\n"
            
            # Footer
            markdown += "\n**Travel Tips:**\n"
            markdown += "- Verify current information with local tourism offices\n"
            markdown += "- Check seasonal weather before planning\n"
            markdown += "- Book accommodations in advance during peak season\n"
            markdown += "\n*Information compiled from publicly available sources. "
            markdown += f"Always verify with official sources before traveling.*\n"
            markdown += f"\n*Last updated: {datetime.now().strftime('%B %d, %Y')}*\n"
            
            # Save
            safe_name = re.sub(r'[^\w\s-]', '', name.lower()).replace(' ', '_')
            output_file = self.output_dir / category / f"{safe_name}.md"
            output_file.write_text(markdown, encoding='utf-8')
            
            word_count = len(markdown.split())
            print(f"  SUCCESS: {word_count} words, {len(unique_sections)} sections")
            print(f"  Saved to: {output_file.name}")
            
            return word_count > 1000
            
        except Exception as e:
            print(f"  FAILED: {e}")
            return False
    
    def run_all(self):
        print("="*60)
        print("NEPAL ITINERARY & DESTINATION SCRAPER")
        print("="*60)
        
        targets = [
            # ── DESTINATIONS ──────────────────────────────────────────
            {
                'name': 'Kathmandu Valley',
                'urls': [
                    'https://ntb.gov.np/places-to-go',
                    'https://en.wikipedia.org/wiki/Kathmandu_Valley',
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Pokhara',
                'urls': [
                    'https://www.laidbacktrip.com/posts/things-to-do-in-pokhara',
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Chitwan National Park',
                'urls': [
                    'https://wanderingwithadromomaniac.com/ultimate-guide-to-visiting-chitwan-national-park/',
                    'https://ntb.gov.np/places-to-go',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Lumbini',
                'urls': [
                    'https://en.wikipedia.org/wiki/Lumbini',
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Bhaktapur',
                'urls': [
                    'https://en.wikipedia.org/wiki/Bhaktapur',
                    'https://www.lonelyplanet.com/nepal/kathmandu-valley/bhaktapur',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Upper Mustang',
                'urls': [
                    'https://nepalnirvanatrails.com/overland-mustang-tour',
                    'https://en.wikipedia.org/wiki/Upper_Mustang',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Nagarkot',
                'urls': [
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                    'https://en.wikipedia.org/wiki/Nagarkot,_Bhaktapur',
                ],
                'category': 'destinations'
            },
            {
                'name': 'Bandipur',
                'urls': [
                    'https://en.wikipedia.org/wiki/Bandipur,_Tanahun',
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                ],
                'category': 'destinations'
            },

            # ── TREKS ─────────────────────────────────────────────────
            {
                'name': 'Annapurna Region',
                'urls': [
                    'https://www.trekking-in-nepal.net/en/blog/583/the-12-best-places-to-visit-in-annapurna-region',
                    'https://www.lonelyplanet.com/articles/best-places-to-visit-in-nepal',
                ],
                'category': 'treks'
            },
            {
                'name': 'Everest Khumbu Region',
                'urls': [
                    'https://en.wikipedia.org/wiki/Sagarmatha_National_Park',
                    'https://ntb.gov.np/places-to-go',
                ],
                'category': 'treks'
            },
        ]
        
        results = {}
        total = len(targets)
        
        print(f"\nTargets: {total} destinations/treks\n")
        
        for i, target in enumerate(targets, 1):
            print(f"\n[{i}/{total}]")
            print("-" * 60)
            
            success = self.scrape_destination(
                target['name'],
                target['urls'],
                target['category']
            )
            
            results[target['name']] = success
            
            if i < total:
                print("  Waiting 3 seconds...")
                time.sleep(3)
        
        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        success_count = sum(1 for v in results.values() if v)
        print(f"\nSuccessful: {success_count}/{total}")
        
        for name, success in results.items():
            status = "SUCCESS" if success else "FAILED"
            print(f"  {status}: {name}")
        
        print(f"\nOutput: {self.output_dir.absolute()}")
        print("\nNext: Run knowledge_loader.py to add to RAG database")
        
        return results


if __name__ == '__main__':
    scraper = NepalItineraryScraper()
    scraper.run_all()