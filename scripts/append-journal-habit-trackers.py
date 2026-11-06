#!/usr/bin/env python3
"""Add one localized A4 habit tracker without rewriting approved journal pages.

Input and output PDFs stay outside the repository. Source hashes are pinned in
the existing manifest; this authoring command does not enable sales or update it.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path

import fitz
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
COPY = {
 'en': ['MY 30-DAY HABIT TRACKER', 'Choose up to four habits you want to practise. Mark a box on the days you try.', 'My month', 'Day', 'Habit', 'You can mark, draw or ask for help. You can start again at any time.', 'My next small step'],
 'ro': ['OBICEIURILE MELE PENTRU 30 DE ZILE', 'Alege până la patru obiceiuri pe care vrei să le exersezi. Marchează o casetă în zilele în care încerci.', 'Luna mea', 'Ziua', 'Obiceiul', 'Poți bifa, desena sau cere ajutor. Poți începe din nou oricând.', 'Următorul meu pas mic'],
 'es': ['MI REGISTRO DE HÁBITOS DE 30 DÍAS', 'Elige hasta cuatro hábitos que quieras practicar. Marca una casilla los días que lo intentes.', 'Mi mes', 'Día', 'Hábito', 'Puedes marcar, dibujar o pedir ayuda. Puedes volver a empezar cuando quieras.', 'Mi próximo pequeño paso'],
 'fr': ['MON SUIVI DES HABITUDES SUR 30 JOURS', 'Choisis jusqu’à quatre habitudes à pratiquer. Coche une case les jours où tu essaies.', 'Mon mois', 'Jour', 'Habitude', 'Tu peux cocher, dessiner ou demander de l’aide. Tu peux recommencer quand tu veux.', 'Mon prochain petit pas'],
 'de': ['MEIN GEWOHNHEITENPLAN FÜR 30 TAGE', 'Wähle bis zu vier Gewohnheiten, die du üben möchtest. Markiere ein Kästchen an den Tagen, an denen du es versuchst.', 'Mein Monat', 'Tag', 'Gewohnheit', 'Du kannst ankreuzen, zeichnen oder um Hilfe bitten. Du kannst jederzeit neu anfangen.', 'Mein nächster kleiner Schritt'],
 'it': ['LE MIE ABITUDINI PER 30 GIORNI', 'Scegli fino a quattro abitudini da esercitare. Segna una casella nei giorni in cui ci provi.', 'Il mio mese', 'Giorno', 'Abitudine', 'Puoi segnare, disegnare o chiedere aiuto. Puoi ricominciare quando vuoi.', 'Il mio prossimo piccolo passo'],
 'pt': ['O MEU REGISTO DE HÁBITOS DE 30 DIAS', 'Escolhe até quatro hábitos que queiras praticar. Marca uma caixa nos dias em que tentares.', 'O meu mês', 'Dia', 'Hábito', 'Podes marcar, desenhar ou pedir ajuda. Podes recomeçar quando quiseres.', 'O meu próximo pequeno passo'],
 'nl': ['MIJN GEWOONTETRACKER VOOR 30 DAGEN', 'Kies maximaal vier gewoonten die je wilt oefenen. Zet een kruisje op de dagen dat je het probeert.', 'Mijn maand', 'Dag', 'Gewoonte', 'Je kunt aankruisen, tekenen of hulp vragen. Je mag altijd opnieuw beginnen.', 'Mijn volgende kleine stap'],
 'pl': ['MÓJ PLAN NAWYKÓW NA 30 DNI', 'Wybierz do czterech nawyków, które chcesz ćwiczyć. Zaznacz pole w dniach, w których próbujesz.', 'Mój miesiąc', 'Dzień', 'Nawyk', 'Możesz zaznaczać, rysować lub prosić o pomoc. W każdej chwili możesz zacząć od nowa.', 'Mój następny mały krok'],
}

def tracker(locale):
    pdfmetrics.registerFont(TTFont('MQSans', str(ROOT/'public/certificates/fonts/DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('MQHeading', str(ROOT/'public/certificates/fonts/DejaVuSerif.ttf')))
    width, height = A4
    stream = io.BytesIO()
    page = canvas.Canvas(stream, pagesize=A4, invariant=1)
    page.setTitle(COPY[locale][0]); page.setAuthor('Money Quest Education')
    navy, gold = Color(.08,.20,.30), Color(.66,.53,.28)
    cream, blue = Color(.985,.978,.953), Color(.89,.94,.95)
    page.setFillColor(cream); page.rect(0,0,width,height,fill=1,stroke=0)
    page.setStrokeColor(gold); page.setLineWidth(.8); page.roundRect(20,20,width-40,height-40,12)
    page.setLineWidth(.35); page.roundRect(25,25,width-50,height-50,10)
    page.setFillColor(navy); page.setFont('MQSans',11); page.drawCentredString(width/2,792,'MONEY QUEST')
    size=18
    while pdfmetrics.stringWidth(COPY[locale][0],'MQHeading',size)>width-90: size-=.5
    page.setFont('MQHeading',size); page.drawCentredString(width/2,762,COPY[locale][0])
    def paragraph(text,x,y,max_width,size=10.5):
        page.setFont('MQSans',size)
        lines=simpleSplit(text,'MQSans',size,max_width)
        for line in lines: page.drawString(x,y,line); y-=14
        return y
    paragraph(COPY[locale][1],50,727,width-100)
    page.setFont('MQSans',10.5); page.drawString(50,684,COPY[locale][2]+':')
    start=50+pdfmetrics.stringWidth(COPY[locale][2]+':','MQSans',10.5)+9
    page.setStrokeColor(gold); page.line(start,682,width-50,682)
    left, top, total, day_width, header, row = 50,650,width-100,35,44,16
    habit_width=(total-day_width)/4
    bottom=top-header-30*row
    page.setFillColor(blue); page.rect(left,top-header,total,header,fill=1,stroke=0)
    for day in range(1,31):
        y=top-header-day*row
        if day%2==0:
            page.setFillColor(Color(.94,.955,.925)); page.rect(left,y,total,row,fill=1,stroke=0)
        page.setFillColor(navy); page.setFont('MQSans',10)
        page.drawCentredString(left+day_width/2,y+4,str(day))
        for habit in range(4):
            x=left+day_width+(habit+.5)*habit_width
            page.setStrokeColor(Color(.39,.49,.43));page.setLineWidth(.65)
            page.rect(x-4.5,y+3.5,9,9,stroke=1,fill=0)
    page.setFillColor(navy);page.setFont('MQSans',9)
    page.drawCentredString(left+day_width/2,top-19,COPY[locale][3])
    for habit in range(4):
        x=left+day_width+habit*habit_width
        page.setFont('MQSans',10);page.drawCentredString(x+habit_width/2,top-17,f'{COPY[locale][4]} {habit+1}')
        page.setStrokeColor(gold);page.line(x+8,top-34,x+habit_width-8,top-34)
    page.setLineWidth(.45);page.setStrokeColor(Color(.62,.68,.63))
    for x in [left,left+day_width]+[left+day_width+i*habit_width for i in range(1,5)]:page.line(x,bottom,x,top)
    page.line(left,top,left+total,top)
    for i in range(31):
        y=top-header-i*row;page.line(left,y,left+total,y)
    page.setFillColor(navy);paragraph(COPY[locale][5],50,105,width-100,8.5)
    page.setFont('MQSans',10);page.drawString(50,65,COPY[locale][6]+':')
    page.setStrokeColor(gold);page.line(50,50,width-50,50)
    page.setFont('MQSans',7.5);page.drawCentredString(width/2,32,'Money Quest Education')
    page.showPage();page.save()
    return stream.getvalue()

def prepare(source_dir, output_dir):
    source_dir, output_dir=Path(source_dir).resolve(),Path(output_dir).resolve()
    if output_dir==ROOT or ROOT in output_dir.parents:raise ValueError('Paid journal PDFs must stay outside the repository')
    document_root=os.environ.get('MONEYQUEST_DOCUMENT_ROOT')
    if document_root and (output_dir==Path(document_root).resolve() or Path(document_root).resolve() in output_dir.parents):raise ValueError('Paid journal PDFs must stay outside the public document root')
    if output_dir.exists():raise FileExistsError('Use a new output directory')
    manifest=json.loads((ROOT/'content/printables/journal-original.json').read_text())
    sources=manifest.get('habitTrackerSourceEditions',manifest['editions'])
    checked=[]
    for locale in manifest['targetLocales']:
        entry=sources[locale];path=(source_dir/entry['file']).resolve()
        if source_dir not in path.parents:raise ValueError('Journal source escapes private source directory')
        data=path.read_bytes()
        if len(data)!=entry['bytes'] or hashlib.sha256(data).hexdigest()!=entry['sha256']:raise ValueError('Unapproved journal source: '+locale)
        doc=fitz.open(stream=data,filetype='pdf')
        if len(doc)!=44:raise ValueError('Expected the approved 44-page journal source')
        checked.append((locale,doc))
    output_dir.mkdir(mode=0o700)
    editions={}
    for locale,doc in checked:
        extra=fitz.open(stream=tracker(locale),filetype='pdf')
        doc.insert_pdf(extra,start_at=43)
        doc.xref_set_key(doc.pdf_catalog(),'Lang',f'({locale})')
        path=output_dir/locale/f'Money_Quest_Future_Ready_Journal_45_pages_{locale}.pdf';path.parent.mkdir(mode=0o700)
        doc.save(path,garbage=4,deflate=True,no_new_id=True);path.chmod(0o600)
        editions[locale]={'file':str(path.relative_to(output_dir)),'pages':45,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size}
    (output_dir/'editions.json').write_text(json.dumps(editions,indent=2)+'\n')
    return editions

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir',type=Path,required=True);parser.add_argument('--output-dir',type=Path,required=True)
    args=parser.parse_args();editions=prepare(args.source_dir,args.output_dir)
    print(json.dumps({'editions':len(editions),'pagesPerEdition':45,'originalPagesPreserved':44,'salesActivationChanged':False}))
