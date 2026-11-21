#!/usr/bin/env python3
"""Analyze a manually exported Google Trends interest-over-time CSV.

No network calls, scraping, user data or claims of absolute search volume.
"""
import argparse
import csv
import json
import statistics
from pathlib import Path

def parse_csv(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as stream:
        lines = [line for line in stream if line.strip() and not line.startswith("#")]
    if not lines:
        raise ValueError("Empty Google Trends CSV")
    reader = csv.reader(lines)
    rows = list(reader)
    header_index = next((i for i, row in enumerate(rows) if row and row[0].strip().lower() in ("week", "month", "day", "date")), None)
    if header_index is None:
        raise ValueError("Expected an interest-over-time CSV with Week, Month, Day or Date header")
    header = rows[header_index]
    if len(header) < 2:
        raise ValueError("Missing trend series")
    names = [name.strip() for name in header[1:]]
    series = {name: [] for name in names}
    suppressed = {name: 0 for name in names}
    for row in rows[header_index + 1:]:
        if len(row) != len(header):
            continue
        for name, raw in zip(names, row[1:]):
            value = raw.strip()
            if value == "<1":
                suppressed[name] += 1
                continue
            try:
                number = float(value)
            except ValueError:
                continue
            if 0 <= number <= 100:
                series[name].append(number)
    return {"source": "Google Trends manual CSV export", "measurement": "relative search interest, not search volume",
            "series": [{"term": name, "points": len(values),
                        "mean_index": round(statistics.mean(values), 2) if values else None,
                        "suppressed_values": suppressed[name]} for name, values in series.items()],
            "limitations": ["Values are normalized within the export and cannot be compared across separate exports.",
                            "Export geography and date window must be recorded separately.",
                            "Values <1 are omitted from averages, not treated as zero.",
                            "No search demand or demographic inference is supported."]}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    result = parse_csv(args.csv)
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Parsed {len(result['series'])} relative-interest series; manual Google Trends CSV.")

if __name__ == "__main__":
    main()
