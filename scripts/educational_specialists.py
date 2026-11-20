#!/usr/bin/env python3
"""Evidence-gated educational review, never clinical diagnosis or autonomous approval."""
import argparse
import datetime as dt
import json
from pathlib import Path

BANDS = {"explorer": "6-8", "builder": "9-11", "strategist": "12-14"}
DOMAINS = {"money": "Financial Education Specialist", "entrepreneurship": "Entrepreneurship Education Specialist",
           "leadership": "Leadership Education Specialist", "ai": "AI Literacy Specialist"}
PSYCH = "Educational Psychology Specialist"
RUBRIC = {
    "cognitive_load": "Is instruction complexity and memory demand appropriate for the age band?",
    "motivation": "Do rewards support understanding and autonomy rather than repeated tapping?",
    "emotional_safety": "Are feedback, failure and competition free of shame or coercion?",
    "accessibility": "Are non-reading, audio/visual and SEND alternatives considered?",
    "transfer": "Can the learner apply the concept to a new real-life situation?",
    "progression": "Are prerequisites and age-specific challenge levels documented?",
}
DOMAIN_CHECKS = {
    "money": ["concept_accuracy", "financial_risk", "real_life_decisions"],
    "entrepreneurship": ["problem_validation", "costs_and_value", "ethical_decisions"],
    "leadership": ["collaboration", "conflict_resolution", "inclusive_participation"],
    "ai": ["ai_limitations", "privacy_and_safety", "critical_evaluation"],
}

def review(record):
    required = ("id", "title", "domain", "age_band", "objective", "activity",
                "assessment", "evidence_sources", "reviewer_notes")
    missing = [key for key in required if not record.get(key)]
    domain, band = record.get("domain"), record.get("age_band")
    if domain not in DOMAINS:
        missing.append("valid domain: money/entrepreneurship/leadership/ai")
    if band not in BANDS:
        missing.append("valid age_band: explorer/builder/strategist")
    sources = record.get("evidence_sources", [])
    if not isinstance(sources, list) or not sources or any(not isinstance(s, dict) or not s.get("url", "").startswith("https://") or not s.get("claim") or not s.get("limitation") for s in sources):
        missing.append("evidence_sources must include HTTPS url, claim, limitation")
    answers = record.get("rubric", {})
    if not isinstance(answers, dict):
        answers = {}
    unchecked = [key for key in RUBRIC if answers.get(key) not in ("pass", "concern", "not_applicable")]
    concerns = [key for key in RUBRIC if answers.get(key) == "concern"]
    domain_answers = record.get("domain_checks", {})
    if not isinstance(domain_answers, dict):
        domain_answers = {}
    domain_unchecked = [key for key in DOMAIN_CHECKS.get(domain, []) if domain_answers.get(key) not in ("pass", "concern", "not_applicable")]
    domain_concerns = [key for key in DOMAIN_CHECKS.get(domain, []) if domain_answers.get(key) == "concern"]
    return {
        "id": record.get("id"), "domain_specialist": DOMAINS.get(domain),
        "psychology_specialist": PSYCH, "instructional_design_owner": "Learning Architect",
        "age_band": band, "missing_evidence": sorted(set(missing)),
        "unchecked_psychology_criteria": unchecked, "unchecked_domain_criteria": domain_unchecked,
        "concerns": concerns + domain_concerns,
        "decision": "needs_evidence" if missing or unchecked or domain_unchecked else "human_review_required",
        "safe_to_auto_publish": False, "clinical_assessment": False,
        "note": "Rubric responses are reviewer inputs, not validated learning outcomes or proof of suitability."
    }

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True, help="JSON array of proposed activities with human rubric answers")
    p.add_argument("--output", type=Path, default=Path("artifacts/education-specialists/review.json"))
    args = p.parse_args()
    records = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        p.error("Input must be a JSON array")
    results = [review(record) for record in records]
    report = {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "mode": "read_only",
              "rubric": RUBRIC, "domain_checks": DOMAIN_CHECKS, "reviews": results,
              "limits": ["No clinical diagnosis or profiling of children.",
                         "No child personal data or automated educational certification.",
                         "Requires human educator/psychologist review and real testing."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Reviewed {len(results)} proposed activities; output {args.output}; no content modified.")

if __name__ == "__main__":
    main()
