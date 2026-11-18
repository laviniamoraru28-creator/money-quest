#!/usr/bin/env python3
"""Read-only Money Quest growth-agent MVP. No visitor tracking or paid APIs."""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "growth-agents"


def files(glob, root=ROOT):
    return [p for p in root.glob(glob) if p.is_file() and not any(x in p.parts for x in ("node_modules", ".next", ".git"))]


def read(p):
    try:
        return p.read_text(encoding="utf-8")
    except (UnicodeError, OSError):
        return ""


def finding(key, title, evidence, action, priority="medium"):
    return dict(id=key, title=title, evidence=evidence, recommended_action=action,
                priority=priority, status="candidate_requires_validation")


def report(agent, findings, limitations, now=None, out=OUT):
    data = dict(schema_version=1, agent=agent, generated_at=(now or datetime.now(timezone.utc).isoformat()),
                mode="read_only", findings=findings, limitations=limitations,
                claude_auto_activation_verified=False, safe_to_auto_merge=False)
    out.mkdir(parents=True, exist_ok=True)
    (out / (agent + ".json")).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data


def seo_technical_guardian(root=ROOT):
    pages = files("src/app/**/page.tsx", root) + files("src/app/**/page.ts", root)
    layout = files("src/app/**/layout.tsx", root)
    findings = []
    if not any("sitemap" in p.name for p in files("src/app/**/sitemap.*", root)) and not files("public/sitemap.xml", root):
        findings.append(finding("seo-sitemap-review", "Check sitemap availability",
            "No sitemap file found in scanned conventional paths",
            "Verify dynamic sitemap routes and production sitemap before proposing a fix"))
    if not any("robots" in p.name for p in files("src/app/**/robots.*", root)) and not files("public/robots.txt", root):
        findings.append(finding("seo-robots-review", "Check robots configuration",
            "No robots file found in scanned conventional paths",
            "Verify deployed robots.txt and route generation"))
    if not any("metadata" in read(p) or "generateMetadata" in read(p) for p in layout + pages):
        findings.append(finding("seo-metadata-review", "Review page metadata",
            "No metadata declarations found in scanned app layouts/pages",
            "Check other metadata sources and per-locale SEO"))
    return findings


def search_opportunity_hunter():
    # Deliberately always empty: no authorized Google Search Console or
    # keyword dataset is connected, so this agent must never claim search
    # demand, rankings or visibility - only report that the data is missing.
    return []


def first_visit_experience_agent(root=ROOT):
    pages = files("src/app/**/page.tsx", root) + files("src/app/**/page.ts", root)
    if not pages:
        return [finding("first-visit-routes", "Inspect initial visitor journey",
            "No Next.js app router pages found in conventional path",
            "Locate actual router and add Playwright journey coverage")]
    return [finding("first-visit-manual-review", "Validate new visitor path",
        f"Found {len(pages)} app-router pages; static code cannot establish real usability",
        "Run accessible first-visit journey tests and moderated parent/teacher review", "low")]


def growth_intelligence_director():
    # Deliberately always empty: no consent-appropriate aggregate traffic or
    # campaign dataset is connected, so this agent must never infer
    # visitors, conversion or retention.
    return []


def opportunity_prioritizer(combined_findings):
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return sorted(combined_findings, key=lambda x: (rank.get(x["priority"], 4), x["id"]))


def main(root=ROOT, out=OUT):
    now = datetime.now(timezone.utc).isoformat()
    seo = seo_technical_guardian(root)
    search = search_opportunity_hunter()
    first = first_visit_experience_agent(root)
    director = growth_intelligence_director()
    combined = seo + first
    ordered = opportunity_prioritizer(combined)
    report("seo-technical-guardian", seo,
        ["Static source scan only; no live crawl, Search Console, indexing or Core Web Vitals data."], now, out)
    report("search-opportunity-hunter", search,
        ["No verified Google Search Console or keyword dataset connected. Agent cannot claim search demand or "
         "rankings. Connect authorized aggregated GSC export when Work integration is ready."], now, out)
    report("first-visit-experience-agent", first,
        ["No simulated child behaviour or real user analytics. Findings are test candidates, not usability "
         "conclusions."], now, out)
    report("growth-intelligence-director", director,
        ["No consent-appropriate aggregate traffic or campaign dataset connected. Do not infer visitors, "
         "conversion or retention."], now, out)
    report("opportunity-prioritizer", ordered,
        ["Only ranks locally evidenced candidate checks; does not approve implementation, merge or deployment."],
        now, out)
    return {"agents": 5, "candidate_findings": len(combined), "output": str(out.relative_to(root))}


if __name__ == "__main__":
    print(json.dumps(main()))
