#!/usr/bin/env python3
"""Read-only role pilot: evidence-gated business, engineering and visual reviews."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEVELS = ("explorer", "builder", "strategist")
REQUIRED = ("id", "problem", "evidence", "benefit", "effort", "risk", "success_metric")

def business_analysis(proposal):
    missing = [key for key in REQUIRED if not str(proposal.get(key, "")).strip()]
    recommendation = "needs_evidence" if missing or proposal.get("evidence") == "unknown" else "human_review"
    return {"agent": "business-analyst", "proposal_id": proposal.get("id"),
            "recommendation": recommendation, "missing_fields": missing,
            "evidence": proposal.get("evidence", "not supplied"),
            "decision_owner": "Money Quest owner",
            "limitations": ["No fabricated ROI or traffic forecasts", "No automatic approvals"]}

def engineering_review(root):
    pkg = root / "package.json"
    if not pkg.exists():
        return {"agent": "full-stack-engineer", "status": "blocked", "reason": "package.json absent"}
    data = json.loads(pkg.read_text(encoding="utf-8"))
    scripts = data.get("scripts", {})
    checks = {key: key in scripts for key in ("lint", "typecheck", "test:unit", "test:e2e", "build")}
    return {"agent": "full-stack-engineer", "mode": "read_only",
            "checks": checks, "ready_for_implementation": all(checks.values()),
            "requirements": ["Owner-approved issue", "Isolated branch", "Passing relevant tests",
                             "Draft PR", "Independent security review", "No automatic merge or deploy"],
            "limitations": ["Script presence is not proof that tests pass"]}

def visual_review(root):
    locale_dir = root / "messages"
    locales = sorted(p.stem for p in locale_dir.glob("*.json")) if locale_dir.exists() else []
    css = list((root / "src").rglob("*.css")) if (root / "src").exists() else []
    candidate_issues = []
    for path in css:
        raw = path.read_text(encoding="utf-8", errors="replace")
        if re.search(r"font-size\s*:\s*(?:[0-9]|1[01])px", raw):
            candidate_issues.append({"path": str(path.relative_to(root)), "type": "small_font_candidate"})
    return {"agent": "visual-design-specialist", "mode": "read_only",
            "age_bands": list(LEVELS), "locales_found": locales,
            "candidate_issues": candidate_issues[:30],
            "review_checklist": ["Explorer: visual and audio-first, readable controls",
                                 "Builder: age-appropriate interactions",
                                 "Strategist: clear data visualizations",
                                 "Check mobile 320px, tablet, desktop",
                                 "Check all supported locales for overflow",
                                 "Check reduced motion and keyboard focus"],
            "limitations": ["CSS heuristic is not a visual screenshot test",
                            "No images generated or changed", "Human review required"]}

def run(root, proposal=None):
    result = {"schema_version": 1, "safe_to_auto_merge": False,
              "engineering": engineering_review(root), "visual": visual_review(root)}
    if proposal is not None:
        result["business"] = business_analysis(proposal)
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--proposal", type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    proposal = json.loads(args.proposal.read_text(encoding="utf-8")) if args.proposal else None
    result = run(args.root, proposal)
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(output, encoding="utf-8")
    else:
        print(output, end="")

if __name__ == "__main__":
    main()
