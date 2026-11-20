#!/usr/bin/env python3
"""Inspect registry implementation paths without asserting operational capability."""
import argparse
import json
from pathlib import Path
from scripts.agent_registry import REGISTRY, ROOT

def inventory(registry, root):
    records=[]
    for agent in registry["agents"]:
        impl=agent.get("implementation") or {}
        path=impl.get("path")
        reasons=[]
        if not isinstance(path,str) or not path.strip():
            reasons.append("missing implementation path")
            exists=False
        else:
            relative=Path(path)
            if relative.is_absolute() or ".." in relative.parts:
                reasons.append("unsafe path outside repository")
                exists=False
            else:
                exists=(root/relative).is_file()
                if not exists:
                    reasons.append("implementation path not present on checked revision")
        records.append({"id":agent.get("id"),"implementation_path":path,
            "path_exists":exists,"execution_verified":False,
            "domain_competence_verified":False,"issues":reasons})
    return {"total":len(records),"existing_paths":sum(x["path_exists"] for x in records),
            "missing_or_invalid_paths":sum(not x["path_exists"] for x in records),
            "records":records,
            "limitations":"File existence is not proof of agent autonomy, execution, correctness or expertise."}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--registry",type=Path,default=REGISTRY)
    parser.add_argument("--root",type=Path,default=ROOT)
    parser.add_argument("--output",type=Path,default=ROOT/"artifacts/agents/implementation-inventory.json")
    args=parser.parse_args()
    report=inventory(json.loads(args.registry.read_text(encoding="utf-8")),args.root)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Checked {report['total']} paths: {report['existing_paths']} present, {report['missing_or_invalid_paths']} missing or invalid.")
if __name__=="__main__":
    main()
