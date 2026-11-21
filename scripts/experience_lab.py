#!/usr/bin/env python3
"""Read-only, evidence-labelled UX and simulated child-profile review."""
import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts" / "experience-lab"
PROFILES = {
 "explorer-pre-reader": {"age": 6, "band": "Explorer", "focus": "audio prompts, image-led instructions, single clear next action"},
 "explorer-independent": {"age": 8, "band": "Explorer", "focus": "feedback, variety, clear progress"},
 "builder": {"age": 10, "band": "Builder", "focus": "choice, challenge, meaningful consequences"},
 "strategist": {"age": 13, "band": "Strategist", "focus": "realistic decisions, autonomy, non-childish presentation"},
 "aac-access": {"age": None, "band": "cross-band", "focus": "nonverbal participation, accessible input and audio/visual alternatives"},
 "low-persistence": {"age": None, "band": "cross-band", "focus": "short tasks, recovery, low repetition, no pressure"}
}
def inventory(root=ROOT):
    paths = sorted((root / "src").rglob("*.tsx")) if (root / "src").exists() else []
    paths = [p for p in paths if not any(x in p.parts for x in ("node_modules", ".next"))]
    findings = []
    for p in paths:
        s = p.read_text(encoding="utf-8", errors="replace")
        relative = p.relative_to(root).as_posix()
        if re.search(r"<button\b", s) and not re.search(r"aria-label|aria-labelledby", s) and re.search(r"<button[^>]*>\s*<(?:[A-Z][\w]*Icon|svg)\b", s):
            findings.append({"source": relative, "signal": "possible-icon-only-button", "suggestion": "Check rendered accessible name and keyboard operation", "confidence": "low"})
        if "draggable=" in s or "onDragStart" in s:
            findings.append({"source": relative, "signal": "drag-interaction", "suggestion": "Verify tap and keyboard alternatives, especially Explorer and AAC", "confidence": "medium"})
        if re.search(r"setInterval\(|autoPlay|autoplay", s):
            findings.append({"source": relative, "signal": "timed-or-automatic-content", "suggestion": "Check pause/reduced-motion behavior and sensory accessibility", "confidence": "low"})
    return findings[:80], len(paths)

def report(root=ROOT):
    signals, inspected = inventory(root)
    date = datetime.now(timezone.utc).isoformat()
    shared = {"generated_at": date, "mode": "read_only", "source_files_inspected": inspected,
      "evidence_level": "source_code_heuristics_only", "not_a_real_child_test": True,
      "browser_interaction_verified": False, "personal_data_collected": False,
      "automatic_changes_allowed": False}
    child = dict(shared, agent="child-experience-lab",
      profiles=[dict(id=k, **v) for k,v in PROFILES.items()],
      candidate_findings=signals,
      test_protocol=[
        "First 30 seconds: can the child identify the next action?",
        "Complete a lesson and game without adult explanation",
        "Check audio, touch, keyboard and AAC-compatible alternatives",
        "Look for repetitive tasks, unclear rewards and age-inappropriate visuals",
        "Try returning after interruption and changing age band"
      ],
      limitations=["Profiles are design hypotheses, not evidence of real children's preferences.",
                   "Actual completion, enjoyment and learning require consent-based human testing.",
                   "No browser journey or live site is exercised by this script."])
    innovation = dict(shared, agent="innovation-ux-designer",
      candidate_findings=[{"source": f["source"], "opportunity": f["suggestion"],
                           "basis": f["signal"], "confidence": f["confidence"]} for f in signals],
      review_dimensions=["age-specific visual language", "clear navigation", "educational novelty",
                         "accessibility", "learning transfer", "reward ethics", "implementation effort"],
      decision_rubric={"educational_value": "1-5", "accessibility_benefit": "1-5",
                       "implementation_effort": "1-5", "evidence_confidence": "low/medium/high"},
      limitations=["No claims about competitors or child engagement without approved evidence.",
                   "Recommendations need human validation and owner approval."])
    return {"child": child, "innovation": innovation}

def generate(root=ROOT, output=None):
    output = output or root / "artifacts" / "experience-lab"
    output.mkdir(parents=True, exist_ok=True)
    reports = report(root)
    for key, value in reports.items():
        (output / (key + ".json")).write_text(json.dumps(value, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({"reports": list(reports), "signals": len(reports["child"]["candidate_findings"])}))
    return reports

if __name__ == "__main__":
    generate()
