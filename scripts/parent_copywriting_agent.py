#!/usr/bin/env python3
"""Create editorial briefs for parents; never auto-publish or invent evidence."""
import json
from datetime import date
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TOPICS=[
 ("financial-literacy","Why everyday money conversations matter","Explain needs, wants, saving and age-appropriate family examples."),
 ("saving","A child's first savings goal","Offer a simple visual savings activity without promises of outcomes."),
 ("home-activities","Five money activities families can try","Provide inclusive, low-cost options and adaptations for non-readers."),
 ("decision-making","Helping children make thoughtful choices","Discuss practical decision-making and autonomy without clinical claims."),
 ("entrepreneurship","Small entrepreneurial projects at home","Give safe, supervised examples without earnings promises."),
 ("leadership","Teaching cooperation and leadership","Offer collaborative activities without pressuring children."),
 ("inclusive-learning","Accessible money learning for different needs","Use respectful SEND language and concrete visual/audio supports."),
 ("family-budgeting","How to explain a family budget to children","Use fictional examples, avoid asking families to disclose finances."),
]
def create_briefs(today=None):
 today=today or date.today()
 out=ROOT/"artifacts"/"parent-copywriting"/today.strftime("%Y-%m")
 out.mkdir(parents=True,exist_ok=True)
 index=(today.year*12+today.month)%len(TOPICS)
 briefs=[]
 for week in range(4):
  slug,title,angle=TOPICS[(index+week)%len(TOPICS)]
  brief={
   "agent":"parent-communication-copywriting-strategist",
   "period":today.strftime("%Y-%m"),
   "slot":week+1,"topic":slug,"working_title":title,"editorial_angle":angle,
   "audience":"Parents and carers of children aged 6–14",
   "formats":["600–900 word article","80–120 word social caption","one practical at-home activity"],
   "languages":["en"],"translation_plan":"Localize into nine supported languages only after source review",
   "requirements":["Plain, empathetic, non-judgmental language","Specific, accessible examples","Link only to verified live Money Quest pages","Distinguish evidence from editorial advice","Cite verified primary sources for factual research claims","Do not invent testimonials, statistics or user results","No pressure to purchase or donate","No collection of child or family personal data","Include gentle optional CTA to free Money Quest content"],
   "status":"brief_awaiting_human_or_editorial_authoring",
   "publication_approved":False,
   "note":"This offline generator creates structured briefs, not AI-written articles. A separate approved writer/model must author and fact-check drafts."
  }
  briefs.append(brief)
  (out/f"week-{week+1}-{slug}.json").write_text(json.dumps(brief,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 (out/"index.json").write_text(json.dumps({"period":today.strftime("%Y-%m"),"briefs":len(briefs),"auto_publish":False},indent=2)+"\n",encoding="utf-8")
 print(f"Prepared {len(briefs)} parent editorial briefs in {out.relative_to(ROOT)}")
 return briefs
if __name__=="__main__": create_briefs()
