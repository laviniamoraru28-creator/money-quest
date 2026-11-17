#!/usr/bin/env python3
"""Read-only evidence-based education agents. Standard library only."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = dt.datetime.now(dt.timezone.utc).date().isoformat()
AGENTS = ("inclusive", "architect", "radar")

def collect():
    files = list((ROOT / "src").rglob("*.tsx")) + list((ROOT / "src").rglob("*.ts"))
    return [(p, p.read_text(encoding="utf-8", errors="replace")) for p in files if p.is_file()]

def finding(agent, severity, title, evidence, suggestion, source=""):
    return dict(agent=agent, severity=severity, title=title, evidence=evidence,
                suggestion=suggestion, source=source)

def inclusive(files):
    results = []
    for path, content in files:
        rel = path.relative_to(ROOT).as_posix()
        if "/app/" not in rel and "/components/" not in rel:
            continue
        for match in list(re.finditer(r"<img\b[^>]*>", content, re.S))[:40]:
            tag = match.group()
            if not re.search(r"\balt\s*=", tag):
                line = content.count("\n", 0, match.start()) + 1
                results.append(finding("inclusive", "review", "Image missing alt attribute",
                    f"{rel}:{line}", "Check whether this image needs descriptive alt text or alt='' if decorative."))
        for match in list(re.finditer(r"<button\b[^>]*>", content, re.S))[:40]:
            tag = match.group()
            if not re.search(r"aria-label\s*=", tag) and re.search(r"<(?:svg|[A-Z][A-Za-z]+Icon)\b", content[match.end():match.end()+180]):
                line = content.count("\n", 0, match.start()) + 1
                results.append(finding("inclusive", "review", "Potential icon-only button",
                    f"{rel}:{line}", "Verify accessible name via visible text, aria-label or aria-labelledby."))
    return results[:100]

def architect(files):
    results = []
    for path, content in files:
        rel = path.relative_to(ROOT).as_posix()
        if "/content/" not in rel and "/app/" not in rel:
            continue
        if re.search(r"(?:Explorer|Builder|Strategist)", content, re.I) and re.search(r"(?:lesson|mission|activity)", content, re.I):
            if re.search(r"(?:Math\.random\(|shuffle\()", content):
                results.append(finding("architect", "review", "Randomized learning flow",
                    rel, "Review predictability, age-level scaffolding and reproducible activity tests."))
    results.append(finding("architect", "manual", "Curriculum progression review",
        "Three age bands: Explorer 6-8, Builder 9-11, Strategist 12-14",
        "Compare objectives, prerequisites, activity repetition and assessment evidence by age. Requires educator review."))
    return results

def radar():
    manifest = ROOT / "research" / "future-skills-evidence.json"
    if not manifest.exists():
        return [finding("radar", "needs-evidence", "No verified current research dataset",
            "research/future-skills-evidence.json not found",
            "Supply dated primary research URLs and excerpts. Do not invent trends, citations or demand data.")]
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("Expected list")
    except (ValueError, OSError) as exc:
        return [finding("radar", "needs-evidence", "Invalid research dataset", str(exc),
            "Use a JSON array of records with title, url, published, evidence, limitation.")]
    results = []
    for i, item in enumerate(data):
        if not isinstance(item, dict) or not all(str(item.get(k, "")).strip() for k in ("title","url","published","evidence","limitation")):
            results.append(finding("radar", "needs-evidence", "Incomplete evidence record",
                f"Record {i+1}", "Provide all required evidence fields."))
        elif not str(item["url"]).startswith("https://"):
            results.append(finding("radar", "needs-evidence", "Unverifiable source URL",
                f"Record {i+1}", "Use a direct HTTPS link to the source."))
        else:
            results.append(finding("radar", "research-to-review", str(item["title"]),
                str(item["evidence"]), "Evaluate relevance to financial education and age bands; no automatic curriculum change.",
                str(item["url"])))
    return results or [finding("radar","needs-evidence","Research dataset empty","No source records",
        "Add verifiable studies before proposing future skills priorities.")]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="education-guardians-report.md")
    args = parser.parse_args()
    files = collect()
    findings = inclusive(files) + architect(files) + radar()
    lines = ["# Money Quest Education Guardians", "", f"Generated (UTC): {TODAY}", "",
        "Read-only static evidence. Findings are review candidates, not confirmed defects. No child analytics or AI API calls.",
        "", "## Summary", ""]
    for agent in AGENTS:
        subset = [f for f in findings if f["agent"] == agent]
        lines += [f"- {agent}: {len(subset)} review items"]
    for agent in AGENTS:
        lines += ["", f"## {agent.title()}", ""]
        for f in [x for x in findings if x["agent"] == agent]:
            lines += [f"### {f['title']} ({f['severity']})", "",
                f"Evidence: {f['evidence']}", "", f"Suggested review: {f['suggestion']}", ""]
            if f["source"]:
                lines += [f"Source: {f['source']}", ""]
    lines += ["## Claude handoff", "",
        "Claude: review findings against actual code and primary sources. Fix confirmed issues only on a separate branch and draft PR. Run relevant tests. Do not merge or deploy. Do not invent research evidence.", ""]
    Path(args.output).write_text("\n".join(lines), encoding="utf-8")
    print(f"Report: {args.output}; {len(findings)} review items")

if __name__ == "__main__":
    main()
