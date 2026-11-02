"""Generate 20 existing worksheet editions per language from the exact lesson text.
No translation service or private data is used. Requires ReportLab and DejaVu fonts.
"""
from pathlib import Path
import json,re,hashlib
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Image,HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfdoc import PDFString
root=Path(__file__).resolve().parents[1]
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
rows={
'en':'Read the story. Point, circle or mark one answer. Then try the challenge.|Story|Choose an answer|Try it your way|Draw, write, point or use your communication tool.|A4, print at 100%. Leave the left margin clear for binding. All amounts are learning examples.',
'ro':'Citește povestea. Arată, încercuiește sau marchează un răspuns. Apoi încearcă provocarea.|Poveste|Alege un răspuns|Încearcă în felul tău|Desenează, scrie, arată sau folosește instrumentul tău de comunicare.|A4, tipărește la 100%. Lasă liberă marginea stângă pentru îndosariere. Sumele sunt exemple de învățare.',
'es':'Lee la historia. Señala, rodea o marca una respuesta. Después prueba el reto.|Historia|Elige una respuesta|Pruébalo a tu manera|Dibuja, escribe, señala o usa tu herramienta de comunicación.|A4, imprime al 100%. Deja libre el margen izquierdo para encuadernar. Las cantidades son ejemplos educativos.',
'fr':'Lis l’histoire. Montre, entoure ou coche une réponse. Puis essaie le défi.|Histoire|Choisis une réponse|Essaie à ta façon|Dessine, écris, montre ou utilise ton outil de communication.|A4, imprime à 100 %. Laisse la marge gauche libre pour la reliure. Les montants sont des exemples éducatifs.',
'de':'Lies die Geschichte. Zeige, umkreise oder markiere eine Antwort. Probiere dann die Aufgabe.|Geschichte|Wähle eine Antwort|Probiere es auf deine Weise|Zeige, zeichne, schreibe oder nutze dein Kommunikationsmittel.|A4, bei 100 % drucken. Linken Rand zum Abheften freilassen. Alle Beträge sind Lernbeispiele.',
'it':'Leggi la storia. Indica, cerchia o segna una risposta. Poi prova la sfida.|Storia|Scegli una risposta|Prova a modo tuo|Disegna, scrivi, indica o usa il tuo strumento di comunicazione.|A4, stampa al 100%. Lascia libero il margine sinistro per la rilegatura. Gli importi sono esempi educativi.',
'pt':'Lê a história. Aponta, rodeia ou marca uma resposta. Depois experimenta o desafio.|História|Escolhe uma resposta|Experimenta à tua maneira|Desenha, escreve, aponta ou usa o teu instrumento de comunicação.|A4, imprime a 100%. Deixa a margem esquerda livre para encadernar. Os valores são exemplos educativos.',
'nl':'Lees het verhaal. Wijs één antwoord aan, omcirkel het of kruis het aan. Probeer daarna de opdracht.|Verhaal|Kies een antwoord|Probeer het op jouw manier|Teken, schrijf, wijs aan of gebruik je communicatiehulpmiddel.|A4, print op 100%. Houd de linkermarge vrij om in te binden. De bedragen zijn leervoorbeelden.',
'pl':'Przeczytaj historię. Wskaż, zakreśl lub zaznacz jedną odpowiedź. Potem spróbuj zadania.|Historia|Wybierz odpowiedź|Spróbuj po swojemu|Narysuj, napisz, wskaż lub użyj narzędzia komunikacji.|A4, drukuj w skali 100%. Zostaw lewy margines do oprawy. Kwoty są przykładami do nauki.'}
registry=dict(re.findall(r'"([^"]+)": "([^"]+\.pdf)"',(root/'src/content/worksheets.ts').read_text()))
world={'money_basics':'coin-cove','saving':'golden-vault','currencies':'sky-exchange','scams':'guardian-gate','giving':'kindness-grove','digital_money':'coin-cove','investing_basics':'horizon-peaks','junior_isa':'horizon-peaks','needs_wants':'market-town'}
styles={k:ParagraphStyle(k,fontName=font,fontSize=size,leading=leading,textColor=colors.HexColor('#193c37'),spaceAfter=after) for k,font,size,leading,after in [('body','Body',11,17,8),('title','Bold',21,27,12),('heading','Bold',12,18,8),('small','Body',8,12,8)]}
def p(text,style='body'):return Paragraph(escape(text),styles[style])
manifest=[]
for locale,row in rows.items():
 intro,story,question,challenge,draw,note=row.split('|');messages=json.loads((root/f'messages/{locale}.json').read_text());ui=messages['worksheet'];folder=root/f'public/worksheets/{locale}';folder.mkdir(parents=True,exist_ok=True)
 def footer(canvas,doc):
  canvas._doc.Catalog.Lang=PDFString(locale);canvas.setTitle('Money Quest | '+ui['pageTitle']);canvas.setFont('Body',8);canvas.setFillColor(colors.HexColor('#345b51'));canvas.drawString(25*mm,12*mm,'moneyquesteducation.com');canvas.drawRightString(194*mm,12*mm,str(doc.page))
 def build(path,parts):SimpleDocTemplate(str(path),pagesize=(210*mm,297*mm),leftMargin=25*mm,rightMargin=16*mm,topMargin=15*mm,bottomMargin=20*mm).build(parts,onFirstPage=footer,onLaterPages=footer)
 answers=[p(ui['answerKeyLink'],'title')]
 for lesson_id,filename in registry.items():
  lesson=messages['curriculum'][lesson_id];topic=lesson_id.split('-')[1];band=lesson_id.split('-')[0].title();quiz=lesson['quiz']
  parts=[p('MONEY QUEST | '+ui['pageTitle'],'small'),p(lesson['title'],'title'),p(band+' | '+note,'small')]
  art=root/f'public/images/money-quest/worlds/{world[topic]}-thumb.webp'
  if art.exists():parts.append(Image(str(art),width=32*mm,height=32*mm,hAlign='LEFT'))
  parts += [p(intro),p(story,'heading'),p(lesson['story']),p(question,'heading'),p(quiz['question'])]+[p('□  '+answer) for answer in quiz['options']]+[p(challenge,'heading'),p(lesson['challenge']),p(draw,'small'),Spacer(1,6*mm),HRFlowable(width='100%',color=colors.HexColor('#aabfb2')),Spacer(1,12*mm),HRFlowable(width='100%',color=colors.HexColor('#aabfb2'))]
  target=folder/filename;build(target,parts);answers += [p(lesson['title'],'heading'),p(quiz['correctAnswer']),p(quiz['explanation']),Spacer(1,4*mm)]
  manifest.append({'file':str(target.relative_to(root)),'locale':locale,'lessonId':lesson_id,'source':f'messages/{locale}.json#curriculum.{lesson_id}'})
 build(folder/'money-quest-worksheets-answer-key.pdf',answers)
(root/'docs/localized-printables-manifest.json').write_text(json.dumps({'worksheets':manifest,'locales':list(rows),'note':'Each edition uses the exact translated story, quiz and practical challenge of its linked website lesson. Legacy English PDFs remain at their original URLs for old links.'},ensure_ascii=False,indent=2)+'\n')
print('Generated 180 lesson-linked worksheets and 9 localized answer guides.')
