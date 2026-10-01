#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'presentation' / 'index.html'
LOGIC = ROOT / 'presentation' / 'logic.js'

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.title = []
        self._in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'title':
            self._in_title = True
    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False
    def handle_data(self, data):
        if self._in_title:
            self.title.append(data)

html = PAGE.read_text(encoding='utf-8')
logic = LOGIC.read_text(encoding='utf-8')
parser = AuditParser()
parser.feed(html)
assert len(parser.ids) == len(set(parser.ids)), 'duplicate HTML id found'
assert '上台簡報抽籤計時台' in ''.join(parser.title)
for required in ('roster-input', 'shuffle-order', 'start-session', 'timer-toggle', 'timer-reset', 'next-student-button'):
    assert required in parser.ids, required
assert './logic.js' in html
assert '../' in parser.links
assert 'PRESENTATION_SECONDS = 180' in logic
assert '3分鐘時間到' in html
assert 'sessionStorage' in html
assert 'fetch(' not in html and 'XMLHttpRequest' not in html
# 抽籤完成不得完全依賴背景分頁可能暫停的 animation frame。
assert 'requestAnimationFrame(spin)' not in html
assert 'setTimeout(resolve, ms)' in html
# 手機版依DOM順序先顯示目前講者，再顯示計時器。
assert '.timer-zone { grid-row: auto; }' in html
print('presentation_page_audit=PASS')
print(f'unique_ids={len(parser.ids)}')
print(f'local_links={parser.links}')
