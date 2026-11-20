#!/usr/bin/env python3
"""Check curriculum record coverage in all supported locales; no translation-quality claims."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LOCALES=("en","ro","es","fr","de","it","pt","nl","pl")
SECTIONS=(("curriculum",),("entrepreneurQuest","stages"),("leadershipQuest","missions"))
def section(data, path):
    value=data
    for key in path:
        if not isinstance(value,dict):
            return None
        value=value.get(key)
    return value if isinstance(value,dict) else None

def compare(payloads):
    base=payloads.get("en")
    if not isinstance(base,dict):
        raise ValueError("English reference locale is required")
    results=[]
    for locale in LOCALES:
        current=payloads.get(locale)
        if not isinstance(current,dict):
            results.append({"locale":locale,"status":"missing_locale","sections":[]})
            continue
        sections=[]
        for path in SECTIONS:
            en=section(base,path)
            local=section(current,path)
            label=".".join(path)
            if en is None or local is None:
                sections.append({"section":label,"status":"missing_section","missing_records":[],"extra_records":[]})
                continue
            missing=sorted(set(en)-set(local))
            extra=sorted(set(local)-set(en))
            empty_titles=sorted(k for k in set(en)&set(local)
                                if not isinstance(local[k],dict) or not isinstance(local[k].get("title"),str) or not local[k]["title"].strip())
            sections.append({"section":label,"status":"review" if missing or extra or empty_titles else "record_keys_match",
                             "reference_count":len(en),"locale_count":len(local),
                             "missing_records":missing,"extra_records":extra,"missing_or_empty_titles":empty_titles})
        results.append({"locale":locale,"status":"review" if any(s["status"]!="record_keys_match" for s in sections) else "record_keys_match","sections":sections})
    return results

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--messages",type=Path,default=ROOT/"messages")
    p.add_argument("--output",type=Path,default=Path("artifacts/education-specialists/multilingual-curriculum-coverage.json"))
    args=p.parse_args()
    payloads={}
    for locale in LOCALES:
        path=args.messages/(locale+".json")
        if path.is_file():
            payloads[locale]=json.loads(path.read_text(encoding="utf-8"))
    report={"generated_at":dt.datetime.now(dt.timezone.utc).isoformat(),
            "reference_locale":"en","results":compare(payloads),
            "limitations":["Record-key and title-presence checks only; not proof of translation accuracy, age suitability or UX.",
                           "Content may be defined outside translation JSON; rendered pages were not tested.",
                           "No child data, no automatic edits."]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Compared curriculum record keys across",len(LOCALES),"locales.")

if __name__=="__main__":
    main()
