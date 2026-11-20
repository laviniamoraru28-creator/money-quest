#!/usr/bin/env python3
"""Build honest per-agent scorecards from registry and optional independently scored evidence."""
import argparse
import json
from pathlib import Path
from scripts.agent_registry import REGISTRY, ROOT
from scripts.agent_competency_framework import build

def scorecards(registry, evidence=None):
    audit=build(registry,evidence)
    result=[]
    for profile,assessment in zip(audit["profiles"],audit["assessments"]):
        item=(evidence or {}).get(profile["id"],{})
        tested=item.get("tested_cases",0)
        fp=item.get("false_positives")
        missed=item.get("missed_issues")
        if not isinstance(tested,int) or tested<0: tested=0
        if not isinstance(fp,int) or fp<0: fp=None
        if not isinstance(missed,int) or missed<0: missed=None
        result.append({
          "id":profile["id"],"department":profile["department"],
          "priority":profile["priority"],"declared_purpose":profile["purpose"],
          "competency_dimensions":profile["competency_checks"],
          "operational_status":next(a["operational_status"] for a in registry["agents"] if a["id"]==profile["id"]),
          "benchmark_cases":tested,"false_positives":fp,"missed_issues":missed,
          "precision":None,"recall":None,
          "expertise_validated":False,
          "review_status":assessment["competence_status"],
          "blockers":assessment["blockers"],
          "next_action":"Collect independently scored domain cases and reproducible output, then human-review findings",
        })
    return {"agent_count":len(result),"scorecards":result,
      "caution":"No actual agent output is benchmarked here. No precision/recall inferred without true positives and false negatives."}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--registry",type=Path,default=REGISTRY)
    parser.add_argument("--evidence",type=Path)
    parser.add_argument("--output",type=Path,default=ROOT/"artifacts/agents/scorecards.json")
    args=parser.parse_args()
    registry=json.loads(args.registry.read_text(encoding="utf-8"))
    evidence=json.loads(args.evidence.read_text(encoding="utf-8")) if args.evidence else {}
    report=scorecards(registry,evidence)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Created {report['agent_count']} scorecards; no expertise asserted.")

if __name__=="__main__":
    main()
