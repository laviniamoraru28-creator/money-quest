#!/usr/bin/env python3
"""Conservative, offline evidence and competence gates for educational specialist review.
This does not call an LLM, verify web pages, or certify subject expertise.
"""
import json
from pathlib import Path
from urllib.parse import urlsplit
from scripts.educational_specialists import RUBRIC, DOMAIN_CHECKS, DOMAINS, review

PROFILES = {
 "educational_psychology": {"owner": "Educational Psychology Specialist", "checks": list(RUBRIC),
   "boundaries": ["No diagnosis", "No inferred learner traits", "No claims of proven learning outcomes"]},
 "money": {"owner": DOMAINS["money"], "checks": DOMAIN_CHECKS["money"],
   "boundaries": ["No personalised financial advice", "Check arithmetic and financial risks"]},
 "entrepreneurship": {"owner": DOMAINS["entrepreneurship"], "checks": DOMAIN_CHECKS["entrepreneurship"],
   "boundaries": ["Do not equate revenue with profit", "Assess ethics and user needs"]},
 "leadership": {"owner": DOMAINS["leadership"], "checks": DOMAIN_CHECKS["leadership"],
   "boundaries": ["Do not score eye contact or speaking volume", "Check inclusive participation"]},
 "ai": {"owner": DOMAINS["ai"], "checks": DOMAIN_CHECKS["ai"],
   "boundaries": ["No child personal data", "Do not treat model output as verified fact"]},
}

def assess(record):
    if not isinstance(record, dict):
        return {"decision": "blocked", "blockers": ["record must be an object"], "baseline": None, "safe_to_auto_publish": False}
    baseline = review(record)
    blockers = []
    if baseline["missing_evidence"] or baseline["unchecked_psychology_criteria"] or baseline["unchecked_domain_criteria"]:
        blockers.append("incomplete required fields or rubric answers")
    if baseline["concerns"]:
        blockers.append("unresolved reviewer concerns")
    sources = record.get("evidence_sources", [])
    if not isinstance(sources, list):
        sources = []
    for idx, source in enumerate(sources):
        if not isinstance(source, dict):
            blockers.append(f"source {idx}: invalid object")
            continue
        url = source.get("url", "")
        parsed = urlsplit(url) if isinstance(url, str) else urlsplit("")
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            blockers.append(f"source {idx}: invalid public HTTPS URL")
        if parsed.hostname in {"example.org", "example.com", "example.net", "localhost"}:
            blockers.append(f"source {idx}: placeholder or local source")
        for field in ("claim", "limitation"):
            if not isinstance(source.get(field), str) or len(source[field].strip()) < 12:
                blockers.append(f"source {idx}: missing meaningful {field}")
        if source.get("verified_by_human") is not True:
            blockers.append(f"source {idx}: independent source verification not recorded")
    if record.get("human_reviewer_approved") is not True:
        blockers.append("qualified human reviewer approval not recorded")
    if not isinstance(record.get("human_reviewer_role"), str) or len(record["human_reviewer_role"].strip()) < 5:
        blockers.append("human reviewer role missing")
    return {
        "id": record.get("id"), "domain": record.get("domain"),
        "decision": "human_approved_for_proposal" if not blockers else "blocked",
        "blockers": sorted(set(blockers)),
        "safe_to_auto_publish": False,
        "validated_learning_outcome": False,
        "source_verification": "human_attestation_only",
        "note": "No online source checking, child testing or professional credential verification is performed.",
        "baseline": baseline,
    }

def benchmark():
    valid = {
      "id":"sample","title":"Sample","domain":"money","age_band":"explorer",
      "objective":"Choose a fictional purchase","activity":"Compare two prices",
      "assessment":"Explain one choice","reviewer_notes":"Reviewed against objective",
      "rubric":{key:"pass" for key in RUBRIC},
      "domain_checks":{key:"pass" for key in DOMAIN_CHECKS["money"]},
      "evidence_sources":[{"url":"https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation",
         "claim":"Metacognitive instruction is relevant to explicit reflection tasks.",
         "limitation":"Not evidence that this particular Money Quest activity improves outcomes.",
         "verified_by_human":True}],
      "human_reviewer_approved":True,"human_reviewer_role":"Qualified educational reviewer",
    }
    import copy
    scenarios = [("complete_human_attestation",valid,True)]
    for name,change in [
      ("unverified_source",lambda x:x["evidence_sources"][0].update(verified_by_human=False)),
      ("placeholder_source",lambda x:x["evidence_sources"][0].update(url="https://example.org/study")),
      ("missing_human_approval",lambda x:x.update(human_reviewer_approved=False)),
      ("missing_reviewer_role",lambda x:x.update(human_reviewer_role="")),
      ("unresolved_concern",lambda x:x["rubric"].update(emotional_safety="concern")),
      ("missing_rubric",lambda x:x["rubric"].pop("accessibility")),
      ("missing_domain_check",lambda x:x["domain_checks"].pop("financial_risk")),
    ]:
        item=copy.deepcopy(valid);change(item);scenarios.append((name,item,False))
    results=[{"scenario":name,"expected_pass":expected,"actual_pass":assess(item)["decision"]=="human_approved_for_proposal"} for name,item,expected in scenarios]
    return {"total":len(results),"passed":sum(x["expected_pass"]==x["actual_pass"] for x in results),
            "scenarios":results,"note":"Synthetic gate regression tests, not measured subject expertise."}

def main():
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,default=Path("artifacts/education-specialists/competency-gates.json"))
    args=p.parse_args()
    report={"profiles":PROFILES,"benchmark":benchmark(),"status":"read_only_human_gated",
      "limits":["No automatic expert reasoning or credential validation",
                "No source retrieval or independent claim verification",
                "No production publication or curriculum modification"]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    if report["benchmark"]["passed"]!=report["benchmark"]["total"]:
        raise SystemExit("Competency gate benchmark failed")
    print(f"Gate regression: {report['benchmark']['passed']}/{report['benchmark']['total']} passed")

if __name__=="__main__":
    main()
