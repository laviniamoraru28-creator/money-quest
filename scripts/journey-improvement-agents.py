#!/usr/bin/env python3
"""Privacy-first static journey, experiment and improvement review. No telemetry."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1}

def item(agent, title, evidence, action, impact=2, confidence=1, effort=2, kind="review"):
    return dict(agent=agent, title=title, evidence=evidence, action=action,
                impact=impact, confidence=confidence, effort=effort, kind=kind)

def files():
    return [(p, p.read_text(encoding="utf-8", errors="replace"))
            for p in sorted((ROOT / "src").rglob("*.tsx")) if p.is_file()]

def journey(entries):
    findings = []
    for p, source in entries:
        name = p.relative_to(ROOT).as_posix()
        if "/app/" not in name and "/components/" not in name:
            continue
        for match in re.finditer(r"<button\b[^>]*\bdisabled\s*=\s*\{[^}]+\}[^>]*>", source, re.S):
            line = source.count("\n", 0, match.start()) + 1
            findings.append(item("Child Journey Detective", "Review disabled action explanation",
                f"{name}:{line}", "Confirm the child receives a clear reason and a next step when the action is unavailable.",
                2, 1, 2))
        for match in re.finditer(r"\blocalStorage\.(?:setItem|getItem)\s*\(", source):
            line = source.count("\n", 0, match.start()) + 1
            findings.append(item("Child Journey Detective", "Review progress persistence",
                f"{name}:{line}", "Confirm progress survives refresh and that local storage contains no identifying child data.",
                2, 1, 2))
    if not findings:
        findings.append(item("Child Journey Detective", "Journey evidence unavailable",
            "Static source only; no anonymous aggregate funnel dataset provided",
            "Validate journeys with existing Playwright tests. Do not claim measured abandonment or collect child identifiers.",
            2, 1, 2, "evidence-gap"))
    return findings[:35]

def experiments(entries):
    findings = []
    paths = [p.relative_to(ROOT).as_posix() for p, _ in entries]
    for target, hypothesis in [
        ("/play/", "A clearer continue control may help children find the next lesson."),
        ("/entrepreneur-quest/", "A consistent completion summary may improve navigation."),
        ("/leadership-quest/", "A clear next-step action may reduce navigation uncertainty.")
    ]:
        matching = [p for p in paths if target in p]
        if matching:
            findings.append(item("Experiment Designer", "Usability experiment proposal",
                f"Existing route code: {matching[0]}; hypothesis, not a measured result",
                f"{hypothesis} Prototype and compare with a small consent-based usability study or deterministic Playwright tasks. Define a primary metric, guardrail and rollback before changing UI.",
                2, 1, 2, "hypothesis"))
    findings.append(item("Experiment Designer", "Experiment safeguards",
        "No controlled experiment outcomes available",
        "Do not assign children to live A/B tests or add analytics without privacy review, appropriate consent and an approved measurement plan.",
        3, 2, 2, "guardrail"))
    return findings

def prioritize(findings):
    ranked = []
    for f in findings:
        score = round((f["impact"] * f["confidence"]) / max(1, f["effort"]), 2)
        ranked.append({**f, "priority_score": score})
    return sorted(ranked, key=lambda f: (-f["priority_score"], f["agent"], f["title"]))

def report(findings):
    lines = ["# Money Quest Journey and Improvement Agents", "",
        "Generated UTC: " + dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "",
        "Read-only code review. No visitors tracked. Findings are hypotheses or review candidates, not confirmed defects.", "",
        "## Improvement Engine priority queue", "",
        "Score = impact (1-3) x confidence (1-3) / effort (1-3). Subjective triage only; human review required.", ""]
    for n, f in enumerate(findings, 1):
        lines += [f"### {n}. {f['title']} | {f['agent']} | score {f['priority_score']}",
                  "", f"Type: {f['kind']}", "", f"Evidence: {f['evidence']}", "",
                  f"Proposed action: {f['action']}", ""]
    lines += ["## Claude handoff", "",
        "Claude: check each item against actual source code and tests. Distinguish hypothesis from defect. Propose validated changes on separate draft PRs. Do not deploy, merge, introduce child tracking, or spend paid API credits without approval.", ""]
    return "\n".join(lines)

def write_json_report(findings, path="journey-improvement-findings.json"):
    data = {
        "schema_version": 1,
        "agent": "journey-improvement-agents",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "read_only",
        "findings": findings,
        "limitations": ["Static source review only. No visitor telemetry, no measured abandonment or "
                        "engagement data. Impact/confidence/effort scores are subjective planning aids, "
                        "not measured business outcomes."],
        "claude_auto_activation_verified": False,
        "safe_to_auto_merge": False,
    }
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="journey-improvement-report.md")
    parser.add_argument("--json-output", default="journey-improvement-findings.json")
    args = parser.parse_args()
    entries = files()
    findings = prioritize(journey(entries) + experiments(entries))
    Path(args.output).write_text(report(findings), encoding="utf-8")
    write_json_report(findings, args.json_output)
    print(f"Generated {len(findings)} review items from {len(entries)} TSX files")

if __name__ == "__main__":
    main()
