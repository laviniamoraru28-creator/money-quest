"""Inspect the 27 sample PDFs produced by CERTIFICATE_QA_OUTPUT.
Requires PyMuPDF. This checks final PDF content, embedding and printable bounds.
"""
import pathlib, sys, re, json
import fitz
root=pathlib.Path(sys.argv[1])
copy_source=pathlib.Path('src/content/certificate-copy.ts').read_text()
compact=lambda text: re.sub(r'\s+', '', text)
count=0
for file in sorted(root.glob('*.pdf')):
    band,locale=file.stem.split('-')
    block=copy_source.split('  "'+locale+'": {',1)[1].split('\n  }',1)[0]
    copy=json.loads('{'+block+'}')
    doc=fitz.open(file); assert len(doc)==1
    page=doc[0]; text=compact(page.get_text())
    assert compact(copy['title'].upper()) in text, file
    assert compact(copy[band]) in text, file
    assert compact(copy['message']) in text, file
    assert compact(copy['date']) in text, file
    assert compact(copy['signature']) in text, file
    assert compact('Money Quest') in text, file
    assert '2026' in text, file
    assert '\ufffd' not in text, file
    keys={
      'explorer':['moneyBasics','savingPlanning','smartChoices','problemSolving','teamworkKindness','responsibilityIndependence'],
      'builder':['financialLiteracy','budgetingSaving','entrepreneurship','creativityInnovation','criticalThinking','collaborationLeadership'],
      'strategist':['financialPlanning','investingRisk','entrepreneurshipInnovation','leadershipCommunication','strategicCriticalThinking','aiDigitalLiteracy']}[band]
    for key in keys: assert compact(copy[key]) in text,(file,key)
    for font in page.get_fonts():
        extracted=doc.extract_font(font[0]); assert len(extracted[3])>0,(file,font)
    scale=min((page.rect.width-28.346)/1536,(page.rect.height-28.346)/1087)
    left=(page.rect.width-1536*scale)/2; top=(page.rect.height-1087*scale)/2
    name=fitz.Rect(left+320*scale,top+550*scale,left+1210*scale,top+670*scale)
    assert not page.get_textbox(name).strip(),(file,'name field must stay empty')
    for word in page.get_text('words'):
        assert word[0]>=14 and word[1]>=14 and word[2]<=page.rect.width-14 and word[3]<=page.rect.height-14,(file,word)
    # Check that handwritten glyphs actually paint, not merely extract.
    clip=fitz.Rect(left+980*scale,top+940*scale,left+1180*scale,top+983*scale)
    pix=page.get_pixmap(matrix=fitz.Matrix(2,2),clip=clip)
    navy=sum(1 for r,g,b in zip(pix.samples[::3],pix.samples[1::3],pix.samples[2::3]) if r<70 and g<90 and b<115)
    assert navy>100,(file,'signature did not render')
    (root/(file.stem+'.png')).write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).tobytes('png'))
    count+=1
assert count==27,count
print('PASS: 27 PDFs, all translated text/competencies, embedded fonts, rendered signatures, empty names and print-safe bounds')
