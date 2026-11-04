#!/usr/bin/env python3
"""Private build: translate supplied journal text while retaining its illustrations."""
import argparse
import hashlib
import json
import math
import re
import unicodedata
from pathlib import Path
from statistics import median
import fitz

NAVY=(.06,.19,.32)

def layout():
    pages={n:[] for n in list(range(1,15))+[44]}
    def add(p,g,i,r,size=12,align='left',lines=1,fill=None,white=False,minimum=7):
        pages[p].append(dict(group=g,index=i,rect=r,size=size,align=align,lines=lines,fill=fill,white=white,minimum=minimum))
    def title(p,g):add(p,g,0,[78,96,522,130],24,'center')
    add(1,'cover',0,[160,249,440,268],16,'center')
    add(1,'cover',1,[161,281,440,305],11,'center',2)
    add(1,'cover',2,[423,379,493,394],6,'center',minimum=5)
    add(1,'cover',3,[302,560,327,572],5.5,'center',minimum=4.5)
    add(1,'cover',4,[273,604,327,622],5.5,'center',fill=[.08,.13,.19],white=True,minimum=4.5)
    title(2,'owner');add(2,'owner',1,[115,254,201,274],14)
    title(3,'welcome');add(3,'welcome',1,[109,194,485,264],14,'center',4)
    for i,x in enumerate([91,198,300,405,507]):add(3,'welcome',i+2,[x-45,502,x+45,525],11,'center',2)
    add(3,'welcome',7,[155,596,443,618],9,'center',2)
    title(4,'skills');add(4,'skills',1,[434,166,491,177],8,'center',minimum=7)
    for i in range(10):add(4,'skills',i+2,[132,194+55.4*i,382,218+55.4*i],15)
    title(5,'goals')
    for i,dy in enumerate([0,193,385]):
        add(5,'goals',i+1,[131,188+dy,368,216+dy],15)
        for j,top in enumerate([232,272,310]):add(5,'goals',j+4,[72,top+dy,361,top+17+dy],10)
        add(5,'goals',7,[429,198+dy,509,215+dy],8,'center',2)
    title(6,'money')
    for i,rect in enumerate([[132,188,281,232],[382,186,523,233],[125,384,205,423],[284,384,370,423],[438,384,533,423]]):add(6,'money',i+1,rect,13,'left',3)
    for i,rect in enumerate([[105,580,223,603],[244,580,365,603],[385,580,500,603]]):add(6,'money',i+6,rect,11,'center',2)
    title(7,'spending')
    for i,rect in enumerate([[109,191,205,215],[235,188,365,208],[391,188,521,208]]):add(7,'spending',i+1,rect,11,'center',1,fill=[.065,.19,.31],white=True)
    for i in range(5):
        add(7,'spending',4+i*2,[126,255+i*84,216,276+i*84],13)
        add(7,'spending',5+i*2,[126,279+i*84,216,310+i*84],8,'left',3)
    add(7,'spending',14,[105,662,206,685],13)
    add(7,'spending',15,[165,708,435,729],8,'center',2)
    title(8,'savings')
    for i,rect in enumerate([[98,192,283,218],[350,192,518,218],[98,302,283,328],[350,302,518,328]]):add(8,'savings',i+1,rect,13)
    add(8,'savings',5,[243,421,358,442],10,'center')
    add(8,'savings',6,[228,448,370,469],8,'center',2)
    title(9,'tracker')
    for i,rect in enumerate([[78,228,110,249],[136,228,201,249],[227,228,294,249],[349,228,430,249],[461,228,526,249]]):add(9,'tracker',i+1,rect,8,'center',1,fill=[.065,.19,.31],white=True,minimum=6)
    add(9,'tracker',6,[155,714,455,735],8,'center',2)
    title(10,'shopping')
    for i,rect in enumerate([[114,237,282,259],[363,237,526,259],[114,403,282,425],[363,403,526,425],[114,566,282,589],[363,566,486,589]]):add(10,'shopping',i+1,rect,11,'left',2)
    add(10,'shopping',7,[317,263,337,274],4.5,'center',fill=[.1,.21,.34],white=True,minimum=3.5)
    add(10,'shopping',8,[337,264,355,277],4.5,'center',fill=[.94,.59,.43],minimum=3.5)
    title(11,'idea')
    for i,rect in enumerate([[114,191,332,211],[401,191,529,211],[114,331,282,351],[363,331,526,351],[158,462,482,484],[73,580,140,600]]):add(11,'idea',i+1,rect,12,'left',2)
    title(12,'project')
    for i,rect in enumerate([[114,191,332,211],[401,191,529,211],[114,331,526,351],[259,443,340,461],[120,480,204,502],[281,480,363,502],[440,480,522,502],[114,647,282,668],[354,647,528,669]]):add(12,'project',i+1,rect,12,'left',2,fill=[.065,.19,.31] if i==3 else None,white=i==3)
    title(13,'weekly')
    for row,dy in enumerate([0,147,294,440]):
        for i,rect in enumerate([[130,211+dy,230,234+dy],[250,211+dy,381,234+dy],[422,211+dy,525,234+dy]]):add(13,'weekly',i+1,rect,11,'center',2)
        # Vertical week labels are repainted and rotated by the renderer.
        pages[13].append(dict(group='weekly',index=row+4,rect=[64,218+dy,85,280+dy],size=11,align='center',lines=1,fill=[.065,.19,.31],white=True,minimum=7,rotate=90))
    add(14,'daily',0,[91,80,509,130],32,'center')
    add(14,'daily',1,[172,154,251,172],11)
    add(14,'daily',2,[69,184,311,207],13)
    for i,x in enumerate([105,202,299,395,490]):add(14,'daily',i+3,[x-36,277,x+36,295],9,'center',2)
    for i,top in enumerate([325,416,503,590,674]):add(14,'daily',i+8,[107,top,517,top+24],13)
    add(14,'daily',13,[125,774,278,790],7.5,'left',2,minimum=6.5)
    add(14,'daily',14,[306,774,513,790],7.5,'left',2,minimum=6.5)
    add(44,'cover',0,[94,164,502,189],15,'center')
    for i,rect in enumerate([[94,267,502,308],[94,321,502,345],[94,376,502,399],[94,407,502,430],[94,438,502,461],[94,522,502,549],[94,704,502,731]]):add(44,'back',i,rect,30 if i==0 else 17 if i>=5 else 14,'center',2,fill=[250/255,247/255,239/255])
    return pages

def wrapped(text,font,size,width):
    result=[]
    for paragraph in text.split('\n'):
        line=''
        for word in paragraph.split(' '):
            candidate=(line+' '+word).strip()
            if font.text_length(candidate,fontsize=size)>width and line:
                result.append(line);line=word
            else:line=candidate
        if line:result.append(line)
    return result

def draw(page,region,text,fonts,report,locale,pnum):
    rect=fitz.Rect(region['rect']);pix=page.get_pixmap(matrix=fitz.Matrix(1,1),alpha=False)
    if region['fill'] is None:
        pixels=[]
        for k in range(15):
            for y in [rect.y0-.5,rect.y1+.5]:
                x=rect.x0+rect.width*k/14
                rgb=pix.pixel(min(pix.width-1,max(0,int(x))),min(pix.height-1,max(0,int(y))))[:3]
                if min(rgb)>150:pixels.append(rgb)
        fill=tuple(median([p[i] for p in pixels])/255 for i in range(3)) if pixels else (.977,.965,.938)
    else:fill=tuple(region['fill'])
    page.draw_rect(rect,color=None,fill=fill)
    upper=region['index']==0 and region['group'] not in ['back']
    if upper:text=text.upper()
    font,name=fonts['bold' if region['size']>=10 or region['index']==0 else 'regular']
    page.insert_font(fontname=name,fontfile=font.name)
    if region.get('rotate'):
        w,h=rect.height,rect.width
    else:w,h=rect.width,rect.height
    for step in range(int((region['size']-region['minimum'])*4)+1):
        size=region['size']-step*.25
        lines=wrapped(text,font,size,w-2)
        height=(font.ascender-font.descender)*size+(len(lines)-1)*size*1.18
        if len(lines)<=region['lines'] and height<=h-1 and all(font.text_length(line,fontsize=size)<=w-2 for line in lines):break
    else:raise ValueError(f'Cannot fit {locale}/{pnum}/{region["group"]}/{region["index"]}: {text}')
    if region.get('rotate'):
        # fitz rotates text around its origin; centre the string along the strip.
        length=font.text_length(lines[0],fontsize=size)
        point=fitz.Point(rect.x0+(rect.width+size*.7)/2,rect.y0+(rect.height+length)/2)
        page.insert_text(point,lines[0],fontname=name,fontsize=size,color=(1,1,1),rotate=90)
    else:
        baseline=rect.y0+(rect.height-height)/2+font.ascender*size
        for line in lines:
            width=font.text_length(line,fontsize=size)
            x=rect.x0+1 if region['align']=='left' else rect.x0+(rect.width-width)/2
            page.insert_text((x,baseline),line,fontname=name,fontsize=size,color=(1,1,1) if region['white'] else NAVY)
            baseline+=size*1.18
    report.append(dict(page=pnum,key=f'{region["group"]}.{region["index"]}',text=text,size=size,rect=list(rect)))

def build(source,copy,locale,output,qa):
    expected="17d5db8b99aba4553794c940860ec8693d0d5d386474bc0233e0ac335fdee381"
    if hashlib.sha256(source.read_bytes()).hexdigest()!=expected:raise ValueError("Expected the exact corrected owner-supplied journal")
    repo=Path(__file__).resolve().parents[1] if Path(__file__).parent.name=="scripts" else None
    if repo and any(folder.resolve()==repo or repo in folder.resolve().parents for folder in [output,qa]):raise ValueError("Keep complete paid PDFs and full-page QA images outside the public repository")
    doc=fitz.open(source);assert len(doc)==44
    # Remove original selectable back-cover text before adding its translation.
    page=doc[43]
    for region in layout()[44]:page.add_redact_annot(fitz.Rect(region['rect']),fill=None)
    page.apply_redactions(images=0,graphics=0)
    normal='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    class Font:
        def __init__(self,path):self.name=path;self.font=fitz.Font(fontfile=path)
        @property
        def ascender(self):return self.font.ascender
        @property
        def descender(self):return self.font.descender
        def text_length(self,*args,**kwargs):return self.font.text_length(*args,**kwargs)
    fonts={'regular':(Font(normal),'MQRegular'),'bold':(Font(bold),'MQBold')}
    report=[];blueprint=layout()
    for i,page in enumerate(doc):
        template=14 if 13<=i<=42 else i+1
        for r in blueprint[template]:draw(page,r,copy[r['group']][r['index']],fonts,report,locale,i+1)
    doc.set_metadata({'title':copy['cover'][0],'author':'Money Quest Education','subject':f'Money Quest, 30 days, {locale}','creator':'Money Quest journal localisation'})
    doc.set_language(locale)
    doc.subset_fonts()
    output.mkdir(parents=True,exist_ok=True);path=output/f'Money_Quest_Future_Ready_Journal_44_pages_{locale}.pdf'
    doc.save(path,garbage=4,deflate=True,no_new_id=True)
    qa.mkdir(parents=True,exist_ok=True);(qa/f'layout-{locale}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    sample=fitz.open()
    for i in [0,5,13]:sample.insert_pdf(doc,from_page=i,to_page=i)
    sample.set_language(locale)
    sample.set_metadata({'title':copy['cover'][0],'author':'Money Quest Education'})
    sample.save(output.parent/'samples'/f'free-journal-30-days-{locale}.pdf',garbage=4,deflate=True,no_new_id=True)
    for i in list(range(14))+[43]:doc[i].get_pixmap(matrix=fitz.Matrix(.8,.8)).save(qa/f'{locale}-{i+1:02}.png')
    return {'locale':locale,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'pages':44,'regions':len(report),'minFont':min(r['size'] for r in report)}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True,type=Path);p.add_argument('--copy',required=True,type=Path);p.add_argument('--locale',required=True);p.add_argument('--output',required=True,type=Path);p.add_argument('--qa',required=True,type=Path);a=p.parse_args()
    data=json.loads(a.copy.read_text());source=data['en'];target=data[a.locale]
    assert source.keys()==target.keys()
    for key in source:
        assert len(source[key])==len(target[key])
        for left,right in zip(source[key],target[key]):
            assert isinstance(right,str) and right.strip() and right==unicodedata.normalize('NFC',right)
            assert re.findall(r'\d+',left)==re.findall(r'\d+',right),(key,left,right)
            assert left.count('£')==right.count('£'),(key,left,right)
    print(json.dumps(build(a.source,target,a.locale,a.output,a.qa)))
