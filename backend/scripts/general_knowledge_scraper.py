"""
Nepal Tourism Knowledge Base Scraper
Scrapes Nepal-specific tourism sources for the RAG knowledge base.

All URLs verified sources: ntb.gov.np, nepalhikingteam.com, himalayanglacier.com,
         wikipedia.org, nepalhikingteam.com
"""

import requests
from bs4 import BeautifulSoup
import time
from pathlib import Path
import re
from datetime import datetime
import pandas as pd


class NepalScraper:

    def __init__(self, output_dir='knowledge_base'):
        BACKEND_DIR = Path(__file__).resolve().parent.parent
        self.output_dir = BACKEND_DIR / output_dir
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.session = requests.Session()

        for folder in ['treks', 'destinations', 'hidden_gems', 'practical']:
            (self.output_dir / folder).mkdir(parents=True, exist_ok=True)

        print(f"  Backend dir : {BACKEND_DIR}")
        print(f"  Output dir  : {self.output_dir.absolute()}")

    # ── Text Cleaning ─────────────────────────────────────────────────────────

    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s\-.,!?():/\'\"#\$\%\£\₹]', '', text)
        return text.strip()

    # ── Core HTML Fetcher ─────────────────────────────────────────────────────

    def _fetch(self, url):
        for attempt in range(2):   # try twice
            try:
                response = self.session.get(url, headers=self.headers, timeout=30)

                if response.status_code == 429:
                    wait = 15 if attempt == 0 else 30
                    print(f"    Rate limited (429) — waiting {wait}s before retry...")
                    time.sleep(wait)
                    continue

                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                raw_text = soup.get_text(separator=' ', strip=True)

                if len(raw_text) < 500:
                    print(f"    WARNING: Only {len(raw_text)} chars — likely JS-rendered. Skipping.")
                    return None, None

                return soup, raw_text

            except Exception as e:
                print(f"    ERROR fetching {url}: {e}")
                return None, None

        print(f"    ERROR: Failed after retries — {url}")
        return None, None

    # ── Section Extractor ─────────────────────────────────────────────────────

    def _extract_sections(self, soup, url, name):
        main_content = (
            soup.find('article') or
            soup.find('div', class_=re.compile(r'post|content|entry|main|article|blog|single', re.I)) or
            soup.find('main') or
            soup.body
        )

        if not main_content:
            return []

        for unwanted in main_content.find_all([
            'script', 'style', 'nav', 'footer',
            'header', 'aside', 'form', 'button'
        ]):
            unwanted.decompose()

        sections = []
        current = {'title': name, 'content': '', 'source': url}

        SKIP_HEADINGS = [
            'footer', 'menu', 'navigation', 'comment', 'sidebar',
            'related', 'share', 'subscribe', 'newsletter', 'cookie',
            'follow us', 'social', 'advertisement', 'sponsored'
        ]

        for el in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'table']):

            if el.name in ['h1', 'h2', 'h3', 'h4']:
                title = self.clean_text(el.get_text())
                if len(title) < 3:
                    continue
                if any(skip in title.lower() for skip in SKIP_HEADINGS):
                    continue
                if current['content'].strip():
                    sections.append(current)
                current = {'title': title, 'content': '', 'source': url}

            elif el.name == 'p':
                text = self.clean_text(el.get_text())
                if len(text) > 40:
                    current['content'] += f"\n\n{text}"

            elif el.name in ['ul', 'ol']:
                for li in el.find_all('li', recursive=False):
                    text = self.clean_text(li.get_text())
                    if len(text) > 10:
                        current['content'] += f"\n- {text}"
                current['content'] += "\n"

            elif el.name == 'table':
                try:
                    df = pd.read_html(str(el))[0]
                    current['content'] += f"\n\n{df.to_markdown(index=False)}\n"
                except Exception:
                    current['content'] += self._table_fallback(el)

        if current['content'].strip():
            sections.append(current)

        return sections

    def _table_fallback(self, table_el):
        text = "\n\n"
        for row in table_el.find_all('tr'):
            cells = [self.clean_text(cell.get_text()) for cell in row.find_all(['td', 'th'])]
            if any(cells):
                text += " | ".join(cells) + "\n"
        return text

    # ── Table Page Scraper ────────────────────────────────────────────────────

    def scrape_table_page(self, name, url, category='practical'):
        print(f"\n  Processing (table): {name}")

        soup, _ = self._fetch(url)
        if soup is None:
            return False

        try:
            intro = soup.find('p')
            intro_text = self.clean_text(intro.get_text()) if intro else ''

            markdown = f"# {name}\n\n"
            markdown += f"Source: {url}\n"
            markdown += f"Last updated: {datetime.now().strftime('%B %d, %Y')}\n\n"

            if intro_text:
                markdown += f"## Overview\n\n{intro_text}\n\n"

            try:
                tables = pd.read_html(str(soup))
                for table in tables:
                    markdown += "\n### Table\n\n"
                    markdown += table.to_markdown(index=False)
                    markdown += "\n\n"
            except Exception:
                markdown += self._extract_all_tables_fallback(soup)

            return self._save_file(name, category, markdown)

        except Exception as e:
            print(f"  ERROR: {e}")
            return False

    def _extract_all_tables_fallback(self, soup):
        markdown = ""
        for table in soup.find_all('table'):
            markdown += "\n### Table\n\n"
            for row in table.find_all('tr'):
                cells = [self.clean_text(cell.get_text()) for cell in row.find_all(['td', 'th'])]
                if any(cells):
                    markdown += " | ".join(cells) + "\n"
        return markdown

    # ── Single URL Scraper ────────────────────────────────────────────────────

    def scrape_list_page(self, name, url, category='destinations'):
        print(f"\n  Processing (single): {name}")

        soup, _ = self._fetch(url)
        if soup is None:
            return False

        sections = self._extract_sections(soup, url, name)

        if not sections:
            print(f"  WARNING: 0 sections extracted — skipping.")
            return False

        total_content = sum(len(s['content']) for s in sections)
        if total_content < 300:
            print(f"  WARNING: Only {total_content} chars — too thin, skipping.")
            return False

        markdown = self._build_markdown_single(name, url, sections)
        print(f"  Content: {len(sections)} sections, {total_content} chars")
        return self._save_file(name, category, markdown)

    # ── Multi-URL Scraper ─────────────────────────────────────────────────────

    def scrape_multi_url(self, name, urls, category='destinations'):
        print(f"\n  Processing (multi-source): {name}")
        print(f"  Sources: {len(urls)} URLs")

        all_sections = []

        for idx, url in enumerate(urls, 1):
            print(f"    [{idx}/{len(urls)}] {url[:70]}...")
            soup, _ = self._fetch(url)
            if soup is None:
                continue

            sections = self._extract_sections(soup, url, name)
            all_sections.extend(sections)
            print(f"    Extracted {len(sections)} sections")

            if idx < len(urls):
                time.sleep(2)

        if not all_sections:
            print(f"  WARNING: 0 sections from all sources — skipping.")
            return False

        unique_sections = []
        seen_titles = set()
        for section in all_sections:
            fingerprint = section['title'].lower()[:40]
            if fingerprint not in seen_titles:
                seen_titles.add(fingerprint)
                unique_sections.append(section)

        total_content = sum(len(s['content']) for s in unique_sections)
        if total_content < 300:
            print(f"  WARNING: Only {total_content} chars after dedup — too thin, skipping.")
            return False

        markdown = self._build_markdown_multi(name, urls, unique_sections)
        print(f"  Content: {len(unique_sections)} unique sections, {total_content} chars")
        return self._save_file(name, category, markdown)

    # ── Markdown Builders ─────────────────────────────────────────────────────

    def _build_markdown_single(self, title, source, sections):
        markdown = f"# {title}\n\n"
        markdown += f"**Source:** {source}\n"
        markdown += f"**Last updated:** {datetime.now().strftime('%B %d, %Y')}\n\n"
        markdown += "---\n\n"
        for section in sections:
            if section['content'].strip():
                markdown += f"## {section['title']}\n\n"
                markdown += section['content'].strip()
                markdown += "\n\n---\n\n"
        markdown += "\n*Verify current information with official sources before travel.*\n"
        return markdown

    def _build_markdown_multi(self, title, urls, sections):
        markdown = f"# {title}\n\n"
        markdown += f"**Sources:**\n"
        for url in urls:
            markdown += f"- {url}\n"
        markdown += f"\n**Last updated:** {datetime.now().strftime('%B %d, %Y')}\n\n"
        markdown += "---\n\n"
        for section in sections:
            if section['content'].strip():
                markdown += f"## {section['title']}\n\n"
                markdown += section['content'].strip()
                markdown += "\n\n---\n\n"
        markdown += "\n**Travel Tips:**\n"
        markdown += "- Verify current information with local tourism offices\n"
        markdown += "- Check seasonal weather before planning\n"
        markdown += "- Book accommodations in advance during peak season\n"
        markdown += f"\n*Last updated: {datetime.now().strftime('%B %d, %Y')}*\n"
        return markdown

    # ── File Saver ────────────────────────────────────────────────────────────

    def _save_file(self, name, category, markdown):
        safe_name = re.sub(r'[^\w\s-]', '_', name.lower()).replace(' ', '_')
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')
        output_file = self.output_dir / category / f"{safe_name}.md"
        output_file.write_text(markdown, encoding='utf-8')
        size_kb = output_file.stat().st_size / 1024
        print(f"  SAVED: {output_file.name} ({size_kb:.1f} KB)")
        return True

    # ── Master Runner ─────────────────────────────────────────────────────────

    def run_all(self):
        print("=" * 60)
        print("NEPAL TOURISM KNOWLEDGE BASE SCRAPER")
        print("=" * 60)

        targets = [

            # ── PRACTICAL ─────────────────────────────────────────────────
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
                'name': 'Nepal Tourist Visa',
                'urls': [
                    'https://ntb.gov.np/plan-your-trip/before-you-come/tourist-visa',
                    'https://www.nepalhikingteam.com/nepal-visa-information',
                ],
                'type': 'multi',
                'category': 'practical'
            },
            {
                'name': 'Nepal Trekking Permits',
                'urls': [
                    'https://www.nepalhikingteam.com/trekking-permit',
                    'https://www.himalayanglacier.com/trekking-permits-in-nepal/',
                ],
                'type': 'multi',
                'category': 'practical'
            },
            {
                'name': 'Best Time to Visit Nepal',
                'url': 'https://www.nepalhikingteam.com/best-time-to-visit-nepal',
                'type': 'single',
                'category': 'practical'
            },
            {
                'name': 'Nepal Travel Tips',
                'urls': [
                    'https://www.nepalhikingteam.com/nepal-travel-guide',
                    'https://www.himalayanglacier.com/nepal-travel-tips/',
                ],
                'type': 'multi',
                'category': 'practical'
            },
            {
                'name': 'Nepal Travel Cost',
                'urls': [
                    'https://www.himalayanglacier.com/nepal-trip-cost/',
                    'https://www.nepalhikingteam.com/nepal-budget-travel',
                ],
                'type': 'multi',
                'category': 'practical'
            },
            {
                'name': 'Altitude Sickness Nepal',
                'url': 'https://www.nepalhikingteam.com/altitude-sickness',
                'type': 'single',
                'category': 'practical'
            },

            # ── DESTINATIONS ──────────────────────────────────────────────
            {
                'name': 'Kathmandu Valley',
                'urls': [
                    'https://www.nepalhikingteam.com/kathmandu-valley',
                    'https://www.himalayanglacier.com/places-to-visit-in-kathmandu/',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Pokhara',
                'urls': [
                    'https://www.laidbacktrip.com/posts/things-to-do-in-pokhara',
                    'https://www.himalayanglacier.com/things-to-do-in-pokhara/',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Chitwan National Park',
                'urls': [
                    'https://wanderingwithadromomaniac.com/ultimate-guide-to-visiting-chitwan-national-park/',
                    'https://www.himalayanglacier.com/chitwan-national-park/',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Lumbini',
                'urls': [
                    'https://www.nepalhikingteam.com/lumbini',
                    'https://www.himalayanglacier.com/lumbini-the-birthplace-of-buddha/',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Bhaktapur',
                'urls': [
                    'https://www.himalayanglacier.com/bhaktapur-durbar-square/',
                    'https://www.nepalhikingteam.com/bhaktapur-durbar-square',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Bardiya National Park',
                'urls': [
                    'https://www.himalayanglacier.com/bardia-national-park/',
                    'https://www.nepalhikingteam.com/bardia-national-park',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Nagarkot',
                'url': 'https://www.nepalhikingteam.com/nagarkot',
                'type': 'single',
                'category': 'destinations'
            },
            {
                'name': 'Bandipur',
                'urls': [
                    'https://www.himalayanglacier.com/bandipur-nepal/',
                    'https://www.nepalhikingteam.com/bandipur-village',
                ],
                'type': 'multi',
                'category': 'destinations'
            },
            {
                'name': 'Major Tourist Attractions Nepal',
                'url': 'https://www.himalayanglacier.com/major-tourist-attractions-in-nepal/',
                'type': 'single',
                'category': 'destinations'
            },

            # ── TREKS ─────────────────────────────────────────────────────
            {
                'name': 'Best Treks Nepal',
                'url': 'https://www.nepalhikingteam.com/best-treks-in-nepal',
                'type': 'single',
                'category': 'treks'
            },
            {
                'name': 'Everest Base Camp Trek',
                'urls': [
                    'https://www.himalayanglacier.com/everest-base-camp-trek/',
                    'https://www.nepalhikingteam.com/everest-base-camp-trekking-14-days',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Annapurna Base Camp Trek',
                'urls': [
                    'https://www.himalayanglacier.com/annapurna-base-camp-trek/',
                    'https://www.nepalhikingteam.com/annapurna-base-camp-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Annapurna Circuit Trek',
                'urls': [
                    'https://www.himalayanglacier.com/annapurna-circuit-trek/',
                    'https://www.nepalhikingteam.com/annapurna-circuit-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Langtang Valley Trek',
                'urls': [
                    'https://www.himalayanglacier.com/langtang-valley-trek/',
                    'https://www.nepalhikingteam.com/langtang-valley-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Manaslu Circuit Trek',
                'urls': [
                    'https://www.himalayanglacier.com/manaslu-circuit-trek/',
                    'https://www.nepalhikingteam.com/manaslu-circuit-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Gokyo Lakes Trek',
                'urls': [
                    'https://www.himalayanglacier.com/gokyo-lakes-trek/',
                    'https://www.nepalhikingteam.com/gokyo-lake-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },
            {
                'name': 'Poon Hill Trek',
                'urls': [
                    'https://www.himalayanglacier.com/poon-hill-trek/',
                    'https://www.nepalhikingteam.com/poon-hill-trekking',
                ],
                'type': 'multi',
                'category': 'treks'
            },

            # ── HIDDEN GEMS ───────────────────────────────────────────────
            {
                'name': '7 Hidden Places Nepal',
                'url': 'https://www.nepalhikingteam.com/7-hidden-best-places-to-visit-in-nepal',
                'type': 'single',
                'category': 'hidden_gems'
            },
            {
                'name': 'Upper Mustang',
                'urls': [
                    'https://www.himalayanglacier.com/upper-mustang-trek/',
                    'https://www.nepalhikingteam.com/upper-mustang-trek',
                ],
                'type': 'multi',
                'category': 'hidden_gems'
            },
            {
                'name': 'Rara Lake Trek',
                'urls': [
                    'https://www.himalayanglacier.com/rara-lake-trek/',
                    'https://www.nepalhikingteam.com/rara-lake-trekking',
                ],
                'type': 'multi',
                'category': 'hidden_gems'
            },
        ]
        results = {}
        skipped = []

        print(f"\nTotal targets : {len(targets)}")
        print(f"Output dir    : {self.output_dir.absolute()}\n")

        for i, target in enumerate(targets, 1):
            print(f"\n[{i}/{len(targets)}] {target['name']}")
            print("-" * 60)

            t = target['type']

            if t == 'table':
                success = self.scrape_table_page(
                    target['name'], target['url'], target['category']
                )
            elif t == 'multi':
                success = self.scrape_multi_url(
                    target['name'], target['urls'], target['category']
                )
            else:
                success = self.scrape_list_page(
                    target['name'], target['url'], target['category']
                )

            results[target['name']] = success
            if not success:
                skipped.append(target['name'])

            if i < len(targets):
                print("  Waiting 3 seconds...")
                time.sleep(3)

        success_count = sum(1 for v in results.values() if v)

        print("\n" + "=" * 60)
        print("SCRAPE COMPLETE")
        print("=" * 60)
        print(f"\n  Successful : {success_count}/{len(targets)}")
        print(f"  Failed     : {len(targets) - success_count}/{len(targets)}")
        print("\n  Results:")
        for name, success in results.items():
            print(f"  {'✅' if success else '❌'} {name}")

        if skipped:
            print(f"\n  ⚠️  Need manual attention:")
            for name in skipped:
                print(f"     - {name}")

        print(f"\n  Knowledge base: {self.output_dir.absolute()}")
        print("\n  Next step: python load_knowledge_base.py")
        return results


if __name__ == '__main__':
    scraper = NepalScraper()
    scraper.run_all()