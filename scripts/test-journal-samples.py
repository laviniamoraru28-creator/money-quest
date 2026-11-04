import json
import re
import unicodedata
from pathlib import Path
import fitz

manifest=json.loads(Path('content/printables/journal-original.json').read_text())
normal=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFC',s))
for locale,item in manifest['samples'].items():
    doc=fitz.open('public'+item['file'])
    assert len(doc)==3
    assert doc.xref_get_key(doc.pdf_catalog(),'Lang')[1]==locale
    for i,heading in enumerate(item['headings']):
        assert normal(heading) in normal(doc[i].get_text()),(locale,i,heading)
    for page in doc:
        assert '\ufffd' not in page.get_text()
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    assert fitz.Rect(span['bbox']) in page.rect+(-1,-1,1,1)
print('PASS: all nine actual public sample PDFs have their own language, translated headings, valid Unicode and in-page text.')
