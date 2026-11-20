#!/usr/bin/env python3
"""Read-only source inventory for educational specialist reviews, no inferred learning outcomes."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = {
    "money": ("money quest", "moneyquest", "money_basics", "coin cove", "saving", "budget"),
    "entrepreneurship": ("entrepreneur quest", "entrepreneurship", "entrepreneur-quest", "business builder"),
    "leadership": ("leadership quest", "leadership-quest", "leadership", "teamwork"),
    "ai": ("ai quest", "ai-quest", "ai literacy"),
}
AGE_MARKERS = {
    "explorer": ("explorer", "6–8", "6-8"),
    "builder": ("builder", "9–11", "9-11"),
    "strategist": ("strategist", "12–14", "12-14"),
}
ALLOWED = {".ts", ".tsx", ".json", ".md", ".mdx"}
MAX_BYTES = 300000

def classify(path, content):
    """Path evidence is stronger than incidental text; both are review candidates only."""
    path_l = path.lower().replace("_", "-")
    sample = content.lower()
    domain_hits = {}
    for domain, markers in DOMAINS.items():
        hits = [marker for marker in markers if marker in path_l or marker in sample]
        if hits:
            domain_hits[domain] = hits[:6]
    bands = {band: [marker for marker in markers if marker in path_l or marker in sample]
             for band, markers in AGE_MARKERS.items()}
    return domain_hits, {k: v for k, v in bands.items() if v}

def inventory(root, max_files=2500):
    source = root / "src"
    if not source.is_dir():
        return {"status": "missing_source", "files_scanned": 0, "candidates": [], "warnings": ["src directory missing"]}
    candidates, scanned, warnings = [], 0, []
    for path in sorted(source.rglob("*")):
        if not path.is_file() or path.suffix not in ALLOWED or any(part in ("node_modules", ".next") for part in path.parts):
            continue
        if scanned >= max_files:
            warnings.append("file_scan_limit_reached")
            break
        if path.stat().st_size > MAX_BYTES:
            warnings.append("oversized_skipped:" + path.relative_to(root).as_posix())
            continue
        scanned += 1
        content = path.read_text(encoding="utf-8", errors="replace")
        domains, bands = classify(path.relative_to(root).as_posix(), content)
        if not domains:
            continue
        rel = path.relative_to(root).as_posix()
        candidates.append({
            "source_path": rel, "domains": sorted(domains), "domain_markers": domains,
            "age_band_markers": bands, "age_band_verified": False,
            "content_type": "source_file_candidate",
            "objective_verified": False, "assessment_verified": False,
            "psychology_review": "not_reviewed",
            "specialist_review": "not_reviewed",
            "recommended_action": "Human maps this source to actual lesson/activity, age band, objectives and evidence."
        })
    return {"status": "inventory_only", "files_scanned": scanned, "candidates": candidates, "warnings": warnings}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", type=Path, default=ROOT)
    p.add_argument("--output", type=Path, default=Path("artifacts/education-specialists/curriculum-source-inventory.json"))
    args = p.parse_args()
    report = inventory(args.root)
    report.update({"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                   "mode": "read_only", "child_data_collected": False,
                   "limitations": ["Text matches are discovery hints, not proof of a lesson or its age band.",
                                   "Source code may contain shared UI, translations and unused material.",
                                   "Human curriculum mapping and educational review remain necessary."]})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Scanned {report['files_scanned']} files, found {len(report['candidates'])} review candidates.")

if __name__ == "__main__":
    main()
