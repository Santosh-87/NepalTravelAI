"""
Nepal Tourism Web Scraper
Scrapes Nepal-specific tourism sources for knowledge base
"""

import requests
from bs4 import BeautifulSoup
import time
from pathlib import Path
import re
from datetime import datetime

try:
    import pandas as pd
    import tabulate
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas/tabulate not installed. Table extraction limited.")

class NepalScraper:
    
    def __init__(self, output_dir='knowledge_base'):
        self.output_dir = Path(output_dir)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        
        # Ensure directories exist
        (self.output_dir / 'treks').mkdir(exist_ok=True)
        (self.output_dir / 'destinations').mkdir(exist_ok=True)
        (self.output_dir / 'hidden_gems').mkdir(exist_ok=True)
        (self.output_dir / 'practical').mkdir(exist_ok=True)
    
    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s\-.,!?():/]', '', text)
        return text.strip()
    
    def scrape_table_page(self, name, url, category='practical'):
        print(f"\nProcessing: {name}")
        
        try:
            response = self.session.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            intro = soup.find('p')
            intro_text = self.clean_text(intro.get_text()) if intro else ''
            
            markdown = f"# {name}\n\n"
            markdown += f"Source: {url}\n"
            markdown += f"Last updated: {datetime.now().strftime('%B %d, %Y')}\n\n"
            
            if intro_text:
                markdown += f"## Overview\n\n{intro_text}\n\n"
            
            if PANDAS_AVAILABLE:
                try:
                    tables = pd.read_html(str(soup))
                    for i, table in enumerate(tables):
                        markdown += f"## Fee Table {i+1}\n\n"
                        markdown += table.to_markdown(index=False)
                        markdown += "\n\n"
                except:
                    for table in soup.find_all('table'):
                        markdown += "\n### Table\n\n"
                        for row in table.find_all('tr'):
                            cells = [self.clean_text(cell.get_text()) for cell in row.find_all(['td', 'th'])]
                            markdown += " | ".join(cells) + "\n"
            else:
                for table in soup.find_all('table'):
                    markdown += "\n### Table\n\n"
                    for row in table.find_all('tr'):
                        cells = [self.clean_text(cell.get_text()) for cell in row.find_all(['td', 'th'])]
                        markdown += " | ".join(cells) + "\n"
            
            safe_name = re.sub(r'[^\w\s-]', '_', name.lower()).replace(' ', '_')
            output_file = self.output_dir / category / f"{safe_name}.md"
            output_file.write_text(markdown, encoding='utf-8')
            
            print(f"  SUCCESS: Saved to {output_file}")
            return True
            
        except Exception as e:
            print(f"  ERROR: {e}")
            return False
    
    def scrape_list_page(self, name, url, category='destinations'):
        print(f"\nProcessing: {name}")
        
        try:
            response = self.session.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            main_content = (
                soup.find('article') or
                soup.find('div', class_=re.compile(r'post|content|entry|main', re.I)) or
                soup.find('main') or
                soup.body
            )
            
            if not main_content:
                print("  ERROR: No content found")
                return False
            
            for unwanted in main_content.find_all(['script', 'style', 'nav', 'footer', 'header']):
                unwanted.decompose()
            
            sections = []
            current_section = {'title': name, 'content': ''}
            
            for element in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol']):
                if element.name in ['h1', 'h2', 'h3', 'h4']:
                    title = self.clean_text(element.get_text())
                    
                    if len(title) < 3:
                        continue
                    if any(skip in title.lower() for skip in ['footer', 'menu', 'navigation', 'comment']):
                        continue
                    
                    if current_section['content'].strip():
                        sections.append(current_section)
                    current_section = {'title': title, 'content': ''}
                    
                elif element.name == 'p':
                    text = self.clean_text(element.get_text())
                    if len(text) > 30:
                        current_section['content'] += f"\n\n{text}"
                        
                elif element.name in ['ul', 'ol']:
                    for li in element.find_all('li', recursive=False):
                        text = self.clean_text(li.get_text())
                        if len(text) > 10:
                            current_section['content'] += f"\n- {text}"
            
            if current_section['content'].strip():
                sections.append(current_section)
            
            markdown = self._create_markdown(name, sections, url)
            
            safe_name = re.sub(r'[^\w\s-]', '_', name.lower()).replace(' ', '_')
            output_file = self.output_dir / category / f"{safe_name}.md"
            output_file.write_text(markdown, encoding='utf-8')
            
            print(f"  SUCCESS: Saved {len(sections)} sections to {output_file.name}")
            return True
            
        except Exception as e:
            print(f"  ERROR: {e}")
            return False
    
    def _create_markdown(self, title, sections, source):
        markdown = f"# {title}\n\n"
        markdown += f"Last updated: {datetime.now().strftime('%B %d, %Y')}\n"
        markdown += f"Source: {source}\n\n"
        markdown += "---\n\n"
        
        for section in sections:
            if section['title'] and section['content'].strip():
                markdown += f"## {section['title']}\n"
                markdown += section['content'].strip()
                markdown += "\n\n---\n\n"
        
        markdown += "\nImportant: Verify current fees and conditions with official sources before travel.\n"
        return markdown
    
    def run_all(self):
        print("="*60)
        print("NEPAL TOURISM SCRAPER")
        print("="*60)
        
        targets = [
            {
                'name': 'NTB Park Entry Fees',
                'url': 'https://ntb.gov.np/plan-your-trip/before-you-come/park-entry-fees',
                'type': 'table',
                'category': 'practical'
            },
            {
                'name': 'NTB Heritage Site Fees',
                'url': 'https://ntb.gov.np/plan-your-trip/before-you-come/heritage-site-entry-fees',
                'type': 'table',
                'category': 'practical'
            },
            {
                'name': 'Nepal Hidden Gems',
                'url': 'https://luxuryholidaynepal.com/blog/nepals-hidden-gems-off-the-beaten-path',
                'type': 'list',
                'category': 'hidden_gems'
            },
            {
                'name': '7 Hidden Places Nepal',
                'url': 'https://www.nepalhikingteam.com/7-hidden-best-places-to-visit-in-nepal',
                'type': 'list',
                'category': 'hidden_gems'
            },
            {
                'name': 'Best Treks Nepal',
                'url': 'https://www.nepalhikingteam.com/best-treks-in-nepal',
                'type': 'list',
                'category': 'treks'
            },
            {
                'name': 'Major Tourist Attractions',
                'url': 'https://www.himalayanglacier.com/major-tourist-attractions-in-nepal/',
                'type': 'list',
                'category': 'destinations'
            },
        ]
        
        results = {}
        
        print(f"\nTargets: {len(targets)} websites\n")
        
        for i, target in enumerate(targets, 1):
            print(f"\n[{i}/{len(targets)}] {target['name']}")
            print("-" * 60)
            
            if target['type'] == 'table':
                success = self.scrape_table_page(target['name'], target['url'], target['category'])
            else:
                success = self.scrape_list_page(target['name'], target['url'], target['category'])
            
            results[target['name']] = success
            
            if i < len(targets):
                print("  Waiting 3 seconds...")
                time.sleep(3)
        
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        
        success_count = sum(1 for v in results.values() if v)
        print(f"\nSuccessful: {success_count}/{len(targets)}\n")
        
        for name, success in results.items():
            status = "SUCCESS" if success else "FAILED"
            print(f"  {status}: {name}")
        
        print(f"\nOutput: {self.output_dir.absolute()}")
        return results

if __name__ == '__main__':
    scraper = NepalScraper()
    scraper.run_all()