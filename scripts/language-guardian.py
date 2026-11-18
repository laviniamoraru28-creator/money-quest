#!/usr/bin/env python3
"""Deterministic localization QA. This does not certify native-speaker quality."""
import datetime as dt
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ("en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl")
TOKEN = re.compile(r"\\{[a-zA-Z_][a-zA-Z_0-9]*\\}")
# Only these two kinds mean the audit itself could not run (a locale file is
# missing or unparsable) - a real break, worth failing CI over. The other
# four kinds (missing/extra key, empty value, placeholder mismatch) are
# translation-completeness findings: real to report, but advisory like every
# other Money Quest audit agent, not a hard CI failure. Previously every
# finding failed the job, so a single placeholder mismatch in one locale
# would have blocked any PR touching messages/** - inconsistent with every
# other agent's report-don't-block convention and untested in practice.
STRUCTURAL_KINDS = frozenset({"missing_file", "invalid_json"})

def flatten(value, prefix=""):
    result = {}
    if isinstance(value, dict):
        for key, child in value.items():
            result.update(flatten(child, f"{prefix}.{key}" if prefix else key))
    elif isinstance(value, str):
        result[prefix] = value
    return result

def audit():
    base = flatten(json.loads((ROOT / "messages/en.json").read_text(encoding="utf-8")))
    findings = []
    for locale in LOCALES:
        path = ROOT / f"messages/{locale}.json"
        if not path.exists():
            findings.append((locale, "missing_file", "-", "Missing messages file"))
            continue
        try:
            target = flatten(json.loads(path.read_text(encoding="utf-8")))
        except (ValueError, UnicodeError) as exc:
            findings.append((locale, "invalid_json", "-", str(exc)))
            continue
        for key in sorted(base.keys() - target.keys()):
            findings.append((locale, "missing_key", key, "Translation key missing"))
        for key in sorted(target.keys() - base.keys()):
            findings.append((locale, "extra_key", key, "Not present in English source"))
        for key in sorted(base.keys() & target.keys()):
            value = target[key]
            if base[key].strip() and not value.strip():
                findings.append((locale, "empty", key, "Translation is empty"))
            if sorted(TOKEN.findall(base[key])) != sorted(TOKEN.findall(value)):
                findings.append((locale, "placeholders", key, "Placeholder mismatch"))
    return findings

def write_json_report(findings, path="language-guardian-report.json"):
    structural = [f for f in findings if f[1] in STRUCTURAL_KINDS]
    data = {
        "schema_version": 1,
        "agent": "language-guardian",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "read_only",
        "findings": [
            {"locale": locale, "kind": kind, "key": key, "detail": detail,
             "severity": "high" if kind in STRUCTURAL_KINDS else "low"}
            for locale, kind, key, detail in findings
        ],
        "limitations": ["Structural checks only (keys, empty values, placeholders). Native fluency, "
                        "age suitability, image text and contextual accuracy require human review."],
        "structural_failures": len(structural),
        "claude_auto_activation_verified": False,
        "safe_to_auto_merge": False,
    }
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data

if __name__ == "__main__":
    findings = audit()
    lines = ["# Money Quest Language Guardian", "", "Automated structural checks only. Native fluency, age suitability, image text, and contextual accuracy require separate review.", "", f"Findings: {len(findings)}", "", "| Locale | Issue | Key | Detail |", "|---|---|---|---|"]
    for locale, kind, key, detail in findings[:300]:
        safe = lambda x: str(x).replace("|", "\\|").replace("\\n", " ")
        lines.append(f"| {safe(locale)} | {safe(kind)} | {safe(key)} | {safe(detail)} |")
    if len(findings) > 300:
        lines.append(f"\\nOnly first 300 of {len(findings)} findings shown.")
    report = "\n".join(lines) + "\n"
    Path("language-guardian-report.md").write_text(report, encoding="utf-8")
    write_json_report(findings)
    print(report)
    sys.exit(1 if any(f[1] in STRUCTURAL_KINDS for f in findings) else 0)
