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

def tag_end(content, start, limit_chars=4000):
    """Index one past the '>' that actually ends a JSX opening tag starting
    at `start`. A naive [^>]*> regex stops at the FIRST '>', which commonly
    appears inside a brace-delimited JS expression attribute long before
    the real tag end - e.g. onClick={() => doThing()} - truncating the
    captured tag and silently dropping any attribute (such as aria-label)
    that comes after it. Confirmed in the wild: src/components/ui/NavMenu.tsx
    has exactly this shape and was wrongly flagged as missing aria-label
    before this fix, because the old regex cut the tag off at the '>' in
    '=>' and never saw the real aria-label a few attributes later.
    Tracks only brace depth (not quotes/JSX-in-expression nesting) - good
    enough for this codebase's style, not a full JSX parser."""
    depth = 0
    i = start
    n = min(len(content), start + limit_chars)
    while i < n:
        ch = content[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth = max(0, depth - 1)
        elif ch == ">" and depth == 0:
            return i + 1
        i += 1
    return None

def inclusive(files):
    results = []
    for path, content in files:
        rel = path.relative_to(ROOT).as_posix()
        if "/app/" not in rel and "/components/" not in rel:
            continue
        for match in list(re.finditer(r"<img\b", content))[:40]:
            end = tag_end(content, match.start())
            if end is None:
                continue
            tag = content[match.start():end]
            if not re.search(r"\balt\s*=", tag):
                line = content.count("\n", 0, match.start()) + 1
                results.append(finding("inclusive", "review", "Image missing alt attribute",
                    f"{rel}:{line}", "Check whether this image needs descriptive alt text or alt='' if decorative."))
        for match in list(re.finditer(r"<button\b", content))[:40]:
            end = tag_end(content, match.start())
            if end is None:
                continue
            tag = content[match.start():end]
            if re.search(r"aria-label\s*=|aria-labelledby\s*=", tag):
                continue
            close = content.find("</button>", end)
            window = content[end:close if close != -1 else end + 400]
            if not re.search(r"<(?:svg|[A-Z][A-Za-z]+Icon)\b", window):
                continue
            # A visible text node near the icon (a translated {label}/{t.x}
            # expression, or plain text) already gives the button an
            # accessible name - flagging it anyway would be a false
            # positive. Confirmed against VisualExplorer.tsx and
            # VisualChoiceButton.tsx, both of which render exactly this
            # pattern and were wrongly flagged before this check existed.
            # Any brace expression right after a tag close is a potential
            # visible text node - a plain {label}/{t.key}, or a translation
            # function call like {t(section.labelKey)} (confirmed in the
            # wild in NavMenu.tsx - the earlier identifier-only pattern
            # missed this because of the parentheses). Not nesting-aware,
            # but attribute-value braces were already consumed by tag_end.
            if re.search(r">\s*\{(?:[^{}]|\{[^{}]*\})+\}", window) or re.search(r">[^<{}]*[A-Za-z]{2,}[^<{}]*(?:<|$)", window):
                continue
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

def write_json_report(findings, path="education-guardians-report.json"):
    data = {
        "schema_version": 1,
        "agent": "education-guardians",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "read_only",
        "findings": findings,
        "limitations": ["Static source review only. Accessibility, learning-progression and future-skills "
                        "findings are candidates requiring human/educator verification, not certification."],
        "claude_auto_activation_verified": False,
        "safe_to_auto_merge": False,
    }
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="education-guardians-report.md")
    parser.add_argument("--json-output", default="education-guardians-report.json")
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
    write_json_report(findings, args.json_output)
    print(f"Report: {args.output}; {len(findings)} review items")

if __name__ == "__main__":
    main()
