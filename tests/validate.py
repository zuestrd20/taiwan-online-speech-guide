"""Offline public-content and download integrity checks."""
import json, pathlib, re, zipfile
from urllib.parse import urlparse
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'data/content.json').read_text())
assert (root/'data/content.js').read_text()=='window.GUIDE_DATA = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n'
assert len(d['cases'])>=8 and len(d['templates'])==3 and len(d['faqs'])>=20
ids=[s['id'] for s in d['sources']];assert len(ids)==len(set(ids))
for s in d['sources']:
 u=urlparse(s['url']);assert u.scheme=='https' and u.netloc,(s['id'],s['url'])
for group in ['firstSteps','steps','cases','templates','faqs']:
 for x in d[group]:
  assert x['sources'] and all(i in ids for i in x['sources']),x
for c in d['cases']:
 assert re.fullmatch('[a-z0-9-]+',c['id'])
 assert all(c.get(k) for k in ['court','date','docket','finality','outcome','context','reason','caution'])
for t in d['templates']:
 pdf=root/t['pdf'];docx=root/t['docx']
 assert pdf.read_bytes().startswith(b'%PDF-')
 assert docx.read_bytes().startswith(b'PK')
 with zipfile.ZipFile(docx) as z:
  assert 'word/document.xml' in z.namelist() and '[Content_Types].xml' in z.namelist()
  txt=z.read('word/document.xml').decode();assert '請填' in txt
for p in root.rglob('*'):
 if p.is_file() and p.suffix in {'.json','.js','.html','.css','.md','.txt','.py','.cjs'}:
  text=p.read_text();assert '/'+'workspace/' not in text and '/'+'root/' not in text,p
html=(root/'index.html').read_text()
for path in re.findall(r'(?:src|href)="([^"#?]+)(?:\?[^\"]*)?"',html):
 if not path.startswith(('https:','http:')): assert (root/path).exists(),path
print(f"PASS: {len(d['cases'])} cases, {len(d['faqs'])} FAQs, {len(d['sources'])} sources, 6 valid template binaries; source references and public paths checked.")
