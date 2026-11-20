#!/usr/bin/env python3
"""Evidence-preserving inventory of Builder/Strategist authored prompts and catalog game links."""
import argparse
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BANDS=("builder","strategist")

def game_links(source):
    """Parse static GameStructure entries for topic/age-band matches; not runtime validation."""
    links=[]
    for chunk in re.split(r'\n  \{\s*\n\s*key: ',source)[1:]:
        key=re.match(r'"([^"]+)"',chunk)
        topic=re.search(r'topicId:\s*"([^"]+)"',chunk)
        if not key or not topic:
            continue
        for band in BANDS:
            if re.search(r'ageBand:\s*"'+band+r'"',chunk):
                links.append({"game_key":key.group(1),"topic":topic.group(1),"age_band":band})
    return links

def inventory(messages,structures):
    curriculum=messages.get("curriculum",{})
    links=game_links(structures)
    rows=[]
    for lesson_id,entry in sorted(curriculum.items()):
        band=lesson_id.split("-",1)[0]
        if band not in BANDS or not isinstance(entry,dict):
            continue
        topic=lesson_id[len(band)+1:]
        if topic.endswith("-l1"):
            topic=topic[:-3]
        prompt=entry.get("interactiveActivity")
        linked=[link["game_key"] for link in links if link["topic"]==topic and link["age_band"]==band]
        rows.append({
            "lesson_id":lesson_id,"age_band":band,"topic":topic,
            "source_pointer":"/curriculum/"+lesson_id+"/interactiveActivity",
            "prompt":prompt if isinstance(prompt,str) else None,
            "rendering_in_LessonPlayer":"text_disclosure_when_present",
            "same_topic_game_keys":linked,
            "relationship_to_games":"unverified",
            "activity_category":"requires_human_classification",
            "is_executable_in_lesson_disclosure":False,
            "proposed_followup":"Check whether a same-topic game actually exercises the prompt; otherwise classify as guided offline reflection or candidate digital interaction."
        })
    return rows

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--messages",type=Path,default=ROOT/"messages/en.json")
    p.add_argument("--games",type=Path,default=ROOT/"src/game-engine/structures.ts")
    p.add_argument("--output",type=Path,default=Path("artifacts/education-specialists/builder-strategist-activity-inventory.json"))
    args=p.parse_args()
    rows=inventory(json.loads(args.messages.read_text(encoding="utf-8")),args.games.read_text(encoding="utf-8"))
    report={"scope":"Builder and Strategist English lesson interactiveActivity prompts",
            "count":len(rows),"with_same_topic_catalog_game":sum(bool(r["same_topic_game_keys"]) for r in rows),
            "rows":rows,
            "limitations":["Same-topic game is not proof that it implements the prompt.",
                           "Games elsewhere in the app may cover similar skills; no semantic cross-feature audit was performed.",
                           "Text disclosure is not an executable exercise. All human categories remain unassigned.",
                           "No browser execution, user study or curriculum edit performed."]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Inventory: {len(rows)} lesson prompts, {report['with_same_topic_catalog_game']} with same-topic catalog games.")

if __name__=="__main__":
    main()
