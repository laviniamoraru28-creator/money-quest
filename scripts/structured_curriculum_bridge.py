#!/usr/bin/env python3
"""Extract actual English curriculum records into evidence-gated specialist review drafts."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def trimmed(value, limit=900):
    if isinstance(value, str):
        return value[:limit]
    if isinstance(value, list):
        return " ".join(str(x.get("text", x)) if isinstance(x, dict) else str(x) for x in value)[:limit]
    return ""

def draft(item_id, domain, band, source_pointer, data, objective="", activity=""):
    title = data.get("title", item_id) if isinstance(data, dict) else item_id
    return {
        "id": item_id, "title": str(title), "domain": domain, "age_band": band,
        "objective": objective, "activity": activity, "assessment": "",
        "evidence_sources": [], "reviewer_notes": "",
        "rubric": {}, "domain_checks": {},
        "source_pointer": source_pointer, "source_language": "en",
        "extraction_status": "structured_source_record",
        "review_status": "needs_human_evidence",
        "source_excerpt": trimmed(data.get("keyConcept") or data.get("learnText") or data.get("outro") or data.get("story"), 450) if isinstance(data, dict) else ""
    }

def extract(payload):
    drafts, warnings = [], []
    curriculum = payload.get("curriculum", {})
    if not isinstance(curriculum, dict):
        warnings.append("curriculum_not_object")
        curriculum = {}
    for key, lesson in sorted(curriculum.items()):
        if not isinstance(lesson, dict):
            warnings.append("invalid_lesson:" + key)
            continue
        band = key.split("-", 1)[0]
        if band not in ("explorer", "builder", "strategist"):
            warnings.append("unmapped_age_band:" + key)
            continue
        drafts.append(draft("mq:" + key, "money", band, "/curriculum/" + key,
                            lesson, trimmed(lesson.get("learningObjective")),
                            trimmed(lesson.get("shortIntroduction") or lesson.get("explanation"))))
    eq = payload.get("entrepreneurQuest", {})
    stages = eq.get("stages", {}) if isinstance(eq, dict) else {}
    if isinstance(stages, dict):
        for key, stage in sorted(stages.items()):
            if isinstance(stage, dict):
                drafts.append(draft("eq:" + key, "entrepreneurship", None,
                                    "/entrepreneurQuest/stages/" + key, stage,
                                    "", trimmed(stage.get("learnText"))))
    else:
        warnings.append("entrepreneur_stages_not_object")
    lq = payload.get("leadershipQuest", {})
    missions = lq.get("missions", {}) if isinstance(lq, dict) else {}
    if isinstance(missions, dict):
        for key, mission in sorted(missions.items()):
            if isinstance(mission, dict):
                drafts.append(draft("lq:" + key, "leadership", None,
                                    "/leadershipQuest/missions/" + key, mission,
                                    "", trimmed(mission.get("outro") or mission.get("dialogue"))))
    else:
        warnings.append("leadership_missions_not_object")
    return drafts, warnings

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=ROOT / "messages/en.json")
    parser.add_argument("--output", type=Path, default=Path("artifacts/education-specialists/structured-curriculum-drafts.json"))
    args = parser.parse_args()
    payload = json.loads(args.source.read_text(encoding="utf-8"))
    drafts, warnings = extract(payload)
    report = {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
              "source": args.source.as_posix(), "language": "en",
              "counts": {domain: sum(d["domain"] == domain for d in drafts)
                         for domain in ("money", "entrepreneurship", "leadership", "ai")},
              "warnings": warnings, "drafts": drafts,
              "limitations": ["These are actual English source records, not validated lessons or learning outcomes.",
                              "Entrepreneurship and leadership age band not assumed without evidence.",
                              "No independent research citations or psychology ratings are invented.",
                              "Human educator must supply evidence and rubric before approval.",
                              "No changes to website, no child data."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(drafts)} real source records for review: {report['counts']}")

if __name__ == "__main__":
    main()
