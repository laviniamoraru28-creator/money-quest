#!/usr/bin/env python3
"""Offline, privacy-preserving Learning Intelligence MVP. Standard library only."""
import argparse
import csv
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOPICS = {
 "financial-literacy": ("money", "saving", "budget", "finance", "invest", "bank", "debt", "bani", "econom"),
 "entrepreneurship": ("entrepreneur", "business", "startup", "afaceri", "antrepren"),
 "leadership": ("leader", "teamwork", "leadership", "echip"),
 "emotional-learning": ("emotion", "mind", "calm", "wellbeing", "emot", "anxiet"),
 "digital-future-skills": ("digital", "future", "technology", "ai ", "artificial intelligence", "tehnolog"),
 "inclusive-learning": ("inclusive", "accessibility", "send", "autism", "incluz"),
}
def classify(query):
    q = " " + query.casefold() + " "
    return [topic for topic, words in TOPICS.items() if any(word in q for word in words)]

def load_search_console(path):
    """Accept manually exported GSC Performance Queries CSV; no personal data."""
    if not path:
        return [], "Search Console export not supplied; search demand unavailable."
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = {h.casefold().strip(): h for h in (reader.fieldnames or [])}
        if "top queries" in headers:
            query_col = headers["top queries"]
        elif "query" in headers:
            query_col = headers["query"]
        else:
            raise ValueError("Expected a Query or Top queries column")
        clicks_col = headers.get("clicks")
        impressions_col = headers.get("impressions")
        if not impressions_col:
            raise ValueError("Expected an Impressions column")
        rows = []
        for row in reader:
            query = (row.get(query_col) or "").strip()
            if not query:
                continue
            try:
                impressions = int((row.get(impressions_col) or "0").replace(",", ""))
                clicks = int((row.get(clicks_col) or "0").replace(",", "")) if clicks_col else 0
            except ValueError:
                continue
            if impressions < 0 or clicks < 0:
                continue
            rows.append({"query": query, "impressions": impressions, "clicks": clicks, "topics": classify(query)})
    return rows, "Search Console queries are site-specific, not total Google search volume."

def curriculum_inventory():
    path = ROOT / "src/content/nav-menu-structure.ts"
    content = path.read_text(encoding="utf-8")
    items = re.findall(r'labelKey: "([^"]+)", href: "([^"]+)"', content)
    return [{"key": key, "route": route, "source": str(path.relative_to(ROOT))} for key, route in items]

def generate(csv_path=None, output=None):
    rows, limitation = load_search_console(csv_path)
    inventory = curriculum_inventory()
    totals = {}
    for row in rows:
        for topic in row["topics"]:
            t = totals.setdefault(topic, {"impressions": 0, "clicks": 0, "queries": 0})
            t["impressions"] += row["impressions"]
            t["clicks"] += row["clicks"]
            t["queries"] += 1
    ranked = sorted(totals.items(), key=lambda kv: (-kv[1]["impressions"], kv[0]))
    report = {
        "generated_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "data_sources": [{"name": "Repository curriculum navigation", "file": "src/content/nav-menu-structure.ts", "status": "verified"}],
        "search_console": {"status": "provided" if csv_path else "not_connected", "limitation": limitation, "input": Path(csv_path).name if csv_path else None},
        "curriculum": {"count": len(inventory), "items": inventory},
        "search_topics": [{"topic": name, **values} for name, values in ranked],
        "recommendations": [{"topic": name, "evidence": "Search Console impressions to this site only", "next_step": "Review existing curriculum and validate educational need before developing a course"} for name, _ in ranked[:5]],
        "warnings": ["No Google Trends or global search-volume data collected.", "No demographic or age inference from search queries.", "Query themes are heuristic and require human review."]
    }
    dest = Path(output or "test-results/learning-intelligence")
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = ["# Money Quest Learning Intelligence | First evidence report", "", f"Generated UTC: {report['generated_utc']}", "",
             "## Verified curriculum inventory", f"{len(inventory)} navigation entries in `src/content/nav-menu-structure.ts`.", ""]
    lines += [f"- {item['key']}: `{item['route']}`" for item in inventory]
    lines += ["", "## Google search evidence", limitation, ""]
    if ranked:
        lines += ["| Topic | Impressions | Clicks | Matching queries |", "|---|---:|---:|---:|"]
        lines += [f"| {name} | {v['impressions']} | {v['clicks']} | {v['queries']} |" for name, v in ranked]
    else:
        lines += ["No Google Search Console export was supplied. No search-demand ranking or new-course recommendation can be supported yet."]
    lines += ["", "## Method and limitations", *["- " + warning for warning in report["warnings"]], "",
              "Source: repository navigation file; optional manually supplied Search Console Performance > Queries CSV.", ""]
    (dest / "report.md").write_text("\n".join(lines), encoding="utf-8")
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--search-console-csv")
    parser.add_argument("--output", default="test-results/learning-intelligence")
    args = parser.parse_args()
    print(json.dumps({"curriculum_count": generate(args.search_console_csv, args.output)["curriculum"]["count"]}))
