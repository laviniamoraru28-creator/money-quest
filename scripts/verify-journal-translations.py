import json
import argparse
import re
import unicodedata
from pathlib import Path
import fitz
from PIL import Image,ImageChops,ImageDraw

parser=argparse.ArgumentParser()
for name in ['source','editions','samples','reports','output']:parser.add_argument('--'+name,required=True,type=Path)
args=parser.parse_args()
SOURCE=args.source
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFC',s))
source=fitz.open(SOURCE)
results=[]
for locale in ['ro','es','fr','de','it','pt','nl','pl']:
    path=args.editions/f'Money_Quest_Future_Ready_Journal_44_pages_{locale}.pdf'
    doc=fitz.open(path)
    assert len(doc)==44
    assert doc.xref_get_key(doc.pdf_catalog(),'Lang')[1]==locale
    report=json.loads((args.reports/f'layout-{locale}.json').read_text())
    assert len(report)==583
    for i,p in enumerate(doc):
        assert abs(p.rect.width-595.28)<1 and abs(p.rect.height-841.89)<1
        text=p.get_text()
        assert '\ufffd' not in text
        for entry in [r for r in report if r['page']==i+1]:
            assert norm(entry['text']) in norm(text),(locale,i+1,entry['key'],entry['text'])
        for block in p.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    assert fitz.Rect(span['bbox']) in (p.rect+(-1,-1,1,1)),(locale,i+1,span['text'],span['bbox'])
    # Every repeated daily template has exactly the same translated prompts.
    daily=norm(doc[13].get_text())
    assert all(norm(doc[i].get_text())==daily for i in range(13,43))
    sample=fitz.open(args.samples/f'free-journal-30-days-{locale}.pdf');assert len(sample)==3
    for i,page in enumerate([0,5,13]):assert sample[i].get_pixmap().samples==doc[page].get_pixmap().samples
    # Check all unique templates, masking only the translated label regions.
    outside=[]
    for i in list(range(14))+[43]:
        a,b=source[i].get_pixmap(),doc[i].get_pixmap()
        before=Image.frombytes('RGB',[a.width,a.height],a.samples);after=Image.frombytes('RGB',[b.width,b.height],b.samples)
        diff=ImageChops.difference(before,after);draw=ImageDraw.Draw(diff)
        for r in [r for r in report if r['page']==i+1]:
            x0,y0,x1,y1=r['rect'];draw.rectangle([int(x0)-2,int(y0)-2,int(x1)+3,int(y1)+3],fill=0)
        if diff.getbbox():outside.append(i+1)
    results.append({'locale':locale,'pages':len(doc),'translatedRegions':len(report),'textAndUnicode':'pass','samplePages':[1,6,14],'outsideLabelDifferences':outside})
(args.reports/'validation.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False))
