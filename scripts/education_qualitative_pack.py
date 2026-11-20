#!/usr/bin/env python3
"""Deterministic, traceable comparative samples; never automated pedagogical certification."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BANDS=("explorer","builder","strategist")
FIELDS=("learningObjective","shortIntroduction","interactiveActivity","challenge","quiz")
def token_count(text):
    return len(re.findall(r"\b[\w']+\b",text or ""))
def compare(data, topics=None):
    lessons=data.get("curriculum",{})
    if not isinstance(lessons,dict):
        raise ValueError("curriculum must be an object")
    topics=topics or sorted({key.split("-",1)[1] for key in lessons if "-" in key and key.split("-",1)[0] in BANDS})
    results=[]
    for topic in topics:
        entries={band:lessons.get(f"{band}-{topic}") for band in BANDS}
        if not any(isinstance(v,dict) for v in entries.values()):
            continue
        records=[]
        for band in BANDS:
            item=entries[band]
            if not isinstance(item,dict):
                records.append({"age_band":band,"present":False})
                continue
            quiz=item.get("quiz",{})
            record={"age_band":band,"present":True,"source_pointer":f"/curriculum/{band}-{topic}",
                    "title":item.get("title",""),
                    "objective":item.get("learningObjective",""),
                    "activity":item.get("interactiveActivity",""),
                    "challenge":item.get("challenge",""),
                    "quiz_question":quiz.get("question","") if isinstance(quiz,dict) else "",
                    "introduction_word_count":token_count(item.get("shortIntroduction","")),
                    "story_word_count":token_count(item.get("story","")),
                    "explanation_word_count":token_count(item.get("explanation","")),
                    "review_status":"human_review_required"}
            records.append(record)
        objectives=[r.get("objective","").strip().lower() for r in records if r.get("present")]
        activities=[r.get("activity","").strip().lower() for r in records if r.get("present")]
        flags=[]
        if len(objectives)==3 and len(set(objectives))==1:
            flags.append("identical_objectives_review")
        if len(activities)==3 and len(set(activities))==1:
            flags.append("identical_activities_review")
        if any(not r.get("present") for r in records):
            flags.append("missing_age_band_record")
        results.append({"topic":topic,"bands":records,"flags":flags,
                        "review_questions":[
                            "Does each age band demand a meaningfully different decision or reasoning step?",
                            "Can a non-reader complete Explorer using available visual/audio support?",
                            "Do feedback and rewards support understanding rather than rapid guessing?",
                            "Is a new situation used to assess transfer beyond recall?",
                            "Are financial claims accurate and appropriately qualified?"
                        ],"verdict":"not_assessed"})
    return results

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source",type=Path,default=ROOT/"messages/en.json")
    p.add_argument("--output",type=Path,default=Path("artifacts/education-specialists/qualitative-review-pack.json"))
    args=p.parse_args()
    data=json.loads(args.source.read_text(encoding="utf-8"))
    results=compare(data)
    report={"generated_at":dt.datetime.now(dt.timezone.utc).isoformat(),
            "source":args.source.as_posix(),"language":"en",
            "topic_count":len(results),"topics":results,
            "limitations":["This is a comparison pack, not an automated psychological evaluation.",
                           "Text lengths do not measure cognitive load or accessibility.",
                           "Rendered UI, narration, interaction and outcomes were not tested.",
                           "No children or personal data analyzed; no independent citations generated."]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Created {len(results)} topic comparison packs; all verdicts not_assessed.")

if __name__=="__main__":
    main()
