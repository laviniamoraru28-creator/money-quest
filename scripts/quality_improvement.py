#!/usr/bin/env python3
"""Read-only cross-department quality intake; never deploys or alters product data."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = {"education","accessibility","technology","privacy","localisation","content","research","growth","experience"}
SEVERITIES = {"critical":4,"high":3,"medium":2,"low":1}
STATUS = {"candidate","confirmed","in_progress","resolved","dismissed"}

def normalize(raw):
    if not isinstance(raw,dict):
        raise ValueError("finding must be an object")
    required=("source","source_pointer","code","domain","severity","summary")
    for field in required:
        if not isinstance(raw.get(field),str) or not raw[field].strip():
            raise ValueError("missing "+field)
    if raw["domain"] not in DOMAINS or raw["severity"] not in SEVERITIES:
        raise ValueError("invalid domain or severity")
    status=raw.get("status","candidate")
    if status not in STATUS:
        raise ValueError("invalid status")
    if status in {"confirmed","resolved"} and not raw.get("review_evidence"):
        raise ValueError("confirmed/resolved finding requires review evidence")
    if any(k in raw for k in ("child_name","child_email","child_address","child_id")):
        raise ValueError("child personal data must not enter quality intake")
    return {k:raw[k] for k in required}|{
        "status":status,
        "review_evidence":raw.get("review_evidence"),
        "owner":raw.get("owner"),
        "impact":raw.get("impact","unknown"),
        "effort":raw.get("effort","unknown"),
        "requires_human_approval":True,
        "auto_publish":False,
    }

def build_report(findings,registry):
    agents=registry.get("agents",[])
    departments=sorted({a["department"] for a in agents})
    merged={}
    for item in findings:
        f=normalize(item)
        key="|".join(str(f[k]).strip().lower() for k in ("source_pointer","code","domain"))
        if key in merged:
            prev=merged[key]
            if SEVERITIES[f["severity"]]>SEVERITIES[prev["severity"]]:
                f["severity"]=f["severity"]
            else:
                f["severity"]=prev["severity"]
            f["sources"]=sorted(set(prev["sources"]+[f["source"]]))
            if prev["status"]=="confirmed" and f["status"]=="candidate":
                f["status"]="confirmed"
                f["review_evidence"]=prev["review_evidence"]
        else:
            f["sources"]=[f["source"]]
        merged[key]=f
    items=list(merged.values())
    items.sort(key=lambda f:(-SEVERITIES[f["severity"]],f["domain"],f["source_pointer"],f["code"]))
    for f in items:
        f["priority"]="P0" if f["severity"]=="critical" else "P1" if f["severity"]=="high" else "P2" if f["severity"]=="medium" else "P3"
        f["release_blocker"]=f["status"]=="confirmed" and f["severity"]=="critical"
    return {"schema_version":1,"agent_count":len(agents),"departments":departments,
        "input_count":len(findings),"unique_count":len(items),
        "by_status":dict(Counter(f["status"] for f in items)),
        "confirmed_critical_blockers":sum(f["release_blocker"] for f in items),
        "findings":items,
        "limitations":["Unreviewed findings are candidates, not confirmed defects.",
                       "This report does not prove agent execution or child learning outcomes.",
                       "No personal child data, automatic merges, deployments or payments changes."]}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--registry",type=Path,default=ROOT/"governance/agent-registry.json")
    p.add_argument("--input",type=Path,default=ROOT/"governance/quality-findings.json")
    p.add_argument("--output",type=Path,default=ROOT/"artifacts/quality/quality-improvement-report.json")
    a=p.parse_args()
    data=json.loads(a.input.read_text(encoding="utf-8"))
    if not isinstance(data,list):
        raise ValueError("findings input must be an array")
    report=build_report(data,json.loads(a.registry.read_text(encoding="utf-8")))
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Quality intake: {report['input_count']} records, {report['unique_count']} unique, {report['confirmed_critical_blockers']} confirmed critical blockers")
if __name__=="__main__":
    main()
