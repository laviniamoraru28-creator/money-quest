#!/usr/bin/env python3
"""Deterministic localization QA. This does not certify native-speaker quality."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ("en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl")
TOKEN = re.compile(r"\\{[a-zA-Z_][a-zA-Z_0-9]*\\}")

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
    print(report)
    sys.exit(1 if findings else 0)
