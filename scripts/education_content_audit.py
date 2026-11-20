#!/usr/bin/env python3
"""Conservative, source-grounded review candidates for actual Money Quest curriculum records."""
import argparse
import datetime as dt
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def words(value):
    return len(re.findall(r"\b[\w'-]+\b", value or ""))

def finding(code, domain, pointer, evidence, recommendation, band=None):
    return {"code": code, "domain": domain, "source_pointer": pointer, "age_band": band,
            "evidence": evidence, "recommendation": recommendation,
            "status": "human_review_candidate", "confirmed_defect": False}

def audit(data):
    findings = []
    lessons = data.get("curriculum", {})
    if not isinstance(lessons, dict):
        return [finding("invalid_curriculum", "money", "/curriculum", "Expected object", "Inspect translation data structure")]
    groups = defaultdict(dict)
    for key, lesson in sorted(lessons.items()):
        if not isinstance(lesson, dict):
            continue
        band, _, topic = key.partition("-")
        if band not in ("explorer", "builder", "strategist") or not topic:
            continue
        pointer = "/curriculum/" + key
        groups[topic][band] = lesson
        objective = lesson.get("learningObjective")
        if not isinstance(objective, str) or not objective.strip():
            findings.append(finding("missing_explicit_objective", "money", pointer + "/learningObjective",
                                    "learningObjective is missing or empty", "Document an observable learning objective", band))
        intro = lesson.get("shortIntroduction")
        if isinstance(intro, str) and words(intro) > 65:
            findings.append(finding("long_intro_review", "money", pointer + "/shortIntroduction",
                                    f"English introduction has {words(intro)} words (screen presentation not inspected)",
                                    "Check reading/audio support, chunking and on-screen presentation", band))
        quiz = lesson.get("quiz")
        if not isinstance(quiz, dict) or not quiz.get("question"):
            findings.append(finding("quiz_metadata_missing", "money", pointer + "/quiz",
                                    "No explicit quiz question in this English lesson record",
                                    "Check assessment elsewhere in the app before adding a quiz", band))
    for topic, band_map in sorted(groups.items()):
        if len(band_map) < 3:
            findings.append(finding("age_band_record_gap", "money", "/curriculum",
                                    f"{topic}: records exist for {', '.join(sorted(band_map))}",
                                    "Verify intended Explorer/Builder/Strategist coverage"))
        for field in ("learningObjective", "interactiveActivity"):
            normalized = defaultdict(list)
            for band, lesson in band_map.items():
                value = lesson.get(field)
                if isinstance(value, str) and value.strip():
                    normalized[" ".join(value.lower().split())].append(band)
            for bands in normalized.values():
                if len(bands) > 1:
                    findings.append(finding("identical_age_band_text", "money",
                                            "/curriculum/" + topic + "/" + field,
                                            f"Exactly identical English {field} text for {', '.join(sorted(bands))}",
                                            "Check whether the age bands need genuinely different learning demands"))
    eq = data.get("entrepreneurQuest", {})
    stages = eq.get("stages", {}) if isinstance(eq, dict) else {}
    if isinstance(stages, dict):
        for key, stage in sorted(stages.items()):
            if not isinstance(stage, dict):
                continue
            ptr = "/entrepreneurQuest/stages/" + key
            if not stage.get("learningObjective"):
                findings.append(finding("no_explicit_objective_in_translation_record", "entrepreneurship", ptr,
                                        "Stage has no learningObjective field in English translation data",
                                        "Check objectives in stage model before concluding they are missing"))
    lq = data.get("leadershipQuest", {})
    missions = lq.get("missions", {}) if isinstance(lq, dict) else {}
    if isinstance(missions, dict):
        for key, mission in sorted(missions.items()):
            if not isinstance(mission, dict):
                continue
            ptr = "/leadershipQuest/missions/" + key
            if not mission.get("learningObjective"):
                findings.append(finding("no_explicit_objective_in_translation_record", "leadership", ptr,
                                        "Mission has no learningObjective field in English translation data",
                                        "Check objectives in mission model before concluding they are missing"))
            if not mission.get("ageBand"):
                findings.append(finding("no_explicit_age_band_in_translation_record", "leadership", ptr,
                                        "Mission has no ageBand field in English translation data",
                                        "Check level routing in application code before concluding it is not differentiated"))
    return findings

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, default=ROOT / "messages/en.json")
    p.add_argument("--output", type=Path, default=Path("artifacts/education-specialists/initial-content-audit.json"))
    args = p.parse_args()
    data = json.loads(args.source.read_text(encoding="utf-8"))
    findings = audit(data)
    report = {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "source": args.source.as_posix(),
              "language": "en", "findings": findings,
              "counts_by_code": {code: sum(f["code"] == code for f in findings) for code in sorted({f["code"] for f in findings})},
              "limitations": ["Static English translation content only, not runtime behavior or visual accessibility.",
                              "Missing metadata in translations does not prove missing pedagogy elsewhere.",
                              "No validated psychological judgement, no measured child outcomes, no research citations.",
                              "Findings require qualified human review and verification against application code."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(findings)} source-grounded review candidates; no lesson changes.")

if __name__ == "__main__":
    main()
