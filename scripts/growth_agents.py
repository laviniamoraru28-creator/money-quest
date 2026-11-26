#!/usr/bin/env python3
"""Read-only Money Quest growth-agent MVP. No visitor tracking or paid APIs.

Consumes real, already-authorized aggregate data where it's connected
(Google Search Console query exports via tools/learning-intelligence/
search_console.py, GA4 aggregate page reports via
tools/learning-intelligence/ga4.py) - the exact same read-only connectors
Learning Intelligence already uses, reusing their secrets at zero extra
cost. When a connector isn't configured in this environment, the matching
agent reports that honestly (no fabricated search demand, rankings,
traffic or engagement) rather than guessing.
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "growth-agents"
LEARNING_INTELLIGENCE = ROOT / "tools" / "learning-intelligence"


def files(glob, root=ROOT):
    return [p for p in root.glob(glob) if p.is_file() and not any(x in p.parts for x in ("node_modules", ".next", ".git"))]


def read(p):
    try:
        return p.read_text(encoding="utf-8")
    except (UnicodeError, OSError):
        return ""


def finding(fid, title, description, source, evidence, recommendation, priority="medium", confidence="medium"):
    """The 9 fields a human reviewer needs to triage a finding without
    opening the generating script: a stable id (for dedup across runs),
    title, full description, where the information came from, the actual
    evidence observed, what to do about it, priority and confidence.
    verification_status/last_verified/first_seen are NOT set here - those
    are run-over-run tracking fields added by
    agent_issue_reporting.merge_findings() when the finding is reconciled
    against the previous run's state, not static facts about the finding
    itself."""
    return dict(id=fid, title=title, description=description, source=source,
                evidence=evidence, recommendation=recommendation,
                priority=priority, confidence=confidence)


def seo_technical_guardian(root=ROOT):
    pages = files("src/app/**/page.tsx", root) + files("src/app/**/page.ts", root)
    layout = files("src/app/**/layout.tsx", root)
    findings = []
    if not any("sitemap" in p.name for p in files("src/app/**/sitemap.*", root)) and not files("public/sitemap.xml", root):
        findings.append(finding(
            "seo-sitemap-review", "Check sitemap availability",
            "No sitemap.ts/sitemap.xml was found in the conventional Next.js app-router or public/ paths during a "
            "static scan of this checkout.",
            "Static source scan of src/app/**/sitemap.* and public/sitemap.xml",
            f"Scanned {len(files('src/app/**/sitemap.*', root)) + len(files('public/sitemap.xml', root))} matching files; 0 found.",
            "Verify the actual deployed sitemap route (it may be generated dynamically elsewhere) and the production "
            "sitemap response before concluding it's missing.", "medium", "medium"))
    if not any("robots" in p.name for p in files("src/app/**/robots.*", root)) and not files("public/robots.txt", root):
        findings.append(finding(
            "seo-robots-review", "Check robots configuration",
            "No robots.ts or robots.txt was found in the conventional app-router or public/ paths during a static scan.",
            "Static source scan of src/app/**/robots.* and public/robots.txt",
            f"Scanned {len(files('src/app/**/robots.*', root)) + len(files('public/robots.txt', root))} matching files; 0 found.",
            "Verify the deployed robots.txt response and route generation before concluding it's missing.",
            "medium", "medium"))
    if not any("metadata" in read(p) or "generateMetadata" in read(p) for p in layout + pages):
        findings.append(finding(
            "seo-metadata-review", "Review page metadata",
            "No `metadata` export or `generateMetadata` function was found in any scanned app-router layout or page file.",
            "Static source scan of src/app/**/layout.tsx and src/app/**/page.tsx for the literal strings "
            "'metadata'/'generateMetadata'",
            f"Scanned {len(layout) + len(pages)} layout/page files; no metadata declarations matched.",
            "Check other metadata sources (e.g. a shared helper re-exported under a different name) and per-locale "
            "SEO before concluding metadata is missing.", "medium", "medium"))
    return findings


def _load_connector(module_name):
    """Imports a tools/learning-intelligence/*.py connector as a library
    (not a subprocess) so growth_agents.py can call its fetch function
    directly and reuse the exact same secrets the Learning Intelligence
    workflow already has configured - no new credentials, no new cost."""
    import importlib.util
    path = LEARNING_INTELLIGENCE / f"{module_name}.py"
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fetch_search_console_rows(env=None):
    """Returns (rows, source_note) using the exact same connector and
    secrets as Learning Intelligence's Search Console export. rows is None
    when not configured; [] is a real, successfully-fetched empty result
    (distinct from "not connected" - both are reported honestly, never
    collapsed into the same "no data" message)."""
    env = env or os.environ
    credentials = env.get("GSC_SERVICE_ACCOUNT_JSON")
    site = env.get("GSC_SITE_URL")
    if not credentials or not site:
        return None, "Google Search Console not configured (GSC_SERVICE_ACCOUNT_JSON/GSC_SITE_URL unset)"
    try:
        search_console = _load_connector("search_console")
        start, end = search_console.date_window()
        rows = search_console.fetch_rows(credentials, site, start, end)
        return rows, f"Google Search Console aggregate query export, {start} to {end}"
    except Exception as exc:  # network/auth/API errors: report, don't crash the whole run
        return None, f"Google Search Console configured but the fetch failed: {exc.__class__.__name__}: {exc}"


def fetch_ga4_rows(env=None):
    env = env or os.environ
    credentials = env.get("GA4_SERVICE_ACCOUNT_JSON")
    property_id = env.get("GA4_PROPERTY_ID")
    if not credentials or not property_id:
        return None, "GA4 not configured (GA4_SERVICE_ACCOUNT_JSON/GA4_PROPERTY_ID unset)"
    try:
        ga4 = _load_connector("ga4")
        report = ga4.fetch_report(credentials, property_id)
        return report["rows"], f"Google Analytics Data API, aggregate page rows, last {report['days']} days"
    except Exception as exc:
        return None, f"GA4 configured but the fetch failed: {exc.__class__.__name__}: {exc}"


def search_opportunity_hunter(gsc_rows=None, source_note=""):
    """Only ever reports what a real, authorized GSC export actually
    contains. No rows fetched (not connected, or the fetch failed) -> empty,
    same as before. Rows fetched but genuinely zero -> one honest finding
    saying so (a real, verified-zero observation, not silence). Rows with
    real signal -> one finding per genuinely low-CTR-at-meaningful-volume
    query, using the exact real numbers, never an inferred ranking or
    demand estimate beyond what GSC itself reported."""
    if gsc_rows is None:
        return []
    if not gsc_rows:
        return [finding(
            "search-gsc-zero-rows", "Search Console connected but returned no query rows",
            "The Search Console export succeeded (real API call, real response) but returned zero aggregate query "
            "rows for the requested window.",
            source_note, "0 rows in the API response.",
            "Confirm the service account still has access to the verified property and that the site is actually "
            "receiving organic search impressions; this is not itself evidence of a technical problem.",
            "low", "high")]
    findings = []
    # A query with real, meaningful impression volume but a very low
    # click-through rate is a legitimate, long-standing SEO review signal
    # (the page may be ranking but the title/meta isn't earning the click)
    # - distinct from inferring demand GSC never reported.
    low_ctr = [r for r in gsc_rows if r["impressions"] >= 50 and r["clicks"] / max(r["impressions"], 1) < 0.02]
    low_ctr.sort(key=lambda r: -r["impressions"])
    for row in low_ctr[:5]:
        ctr_pct = round(100 * row["clicks"] / row["impressions"], 1)
        findings.append(finding(
            f"search-low-ctr-{row['query'].lower().replace(' ', '-')[:40]}",
            f"Low click-through for a real, meaningfully-seen query",
            f"The query \"{row['query']}\" received {row['impressions']} real impressions and {row['clicks']} "
            f"real clicks ({ctr_pct}% CTR) in the reported window - impressions this high with a CTR this low "
            "usually means the page ranks but the title/description isn't earning the click.",
            source_note, f"query=\"{row['query']}\", impressions={row['impressions']}, clicks={row['clicks']}, "
            f"ctr={ctr_pct}%", "Review the title and meta description of whichever page actually ranks for this "
            "query against what a parent/teacher searching that phrase is likely looking for.",
            "medium", "high"))
    if not findings:
        findings.append(finding(
            "search-no-low-ctr-signal", "No low-click-through queries at meaningful volume this window",
            f"Of {len(gsc_rows)} real aggregate query rows fetched, none had >=50 impressions with <2% CTR.",
            source_note, f"{len(gsc_rows)} total query rows reviewed; 0 matched the low-CTR-at-volume pattern.",
            "No action needed from this signal this run.", "low", "high"))
    return findings


def first_visit_experience_agent(root=ROOT):
    pages = files("src/app/**/page.tsx", root) + files("src/app/**/page.ts", root)
    if not pages:
        return [finding(
            "first-visit-routes", "Inspect initial visitor journey",
            "No Next.js app-router page files were found in the conventional path during a static scan.",
            "Static source scan of src/app/**/page.tsx and src/app/**/page.ts",
            "0 app-router page files matched.",
            "Locate the actual router (it may not follow the conventional app-router layout) and add Playwright "
            "journey coverage for the real new-visitor path.", "medium", "medium")]
    return [finding(
        "first-visit-manual-review", "Validate new visitor path",
        f"A static scan found {len(pages)} app-router page files; static code review alone cannot establish "
        "whether the real new-visitor experience is usable, only that routes exist.",
        "Static source scan of src/app/**/page.tsx and src/app/**/page.ts",
        f"{len(pages)} app-router page files found.",
        "Run accessible first-visit journey tests (Playwright) and a moderated parent/teacher review; see "
        "docs/new-visitor-ux-evaluation-plan.md for a differentiated children/parents/teachers evaluation plan.",
        "low", "medium")]


def growth_intelligence_director(ga4_rows=None, source_note=""):
    """Same honesty rule as search_opportunity_hunter: not connected is
    silence (unchanged from before), connected-but-zero is a real reported
    finding, connected-with-data reports only the real aggregate numbers
    GA4 actually returned - no session/conversion/retention inference
    beyond what's directly in the response, and never anything
    page-identifiable to an individual visitor (GA4's own aggregate-only
    dimension set already guarantees that)."""
    if ga4_rows is None:
        return []
    if not ga4_rows:
        return [finding(
            "growth-ga4-zero-rows", "GA4 connected but returned no aggregate page rows",
            "The GA4 Data API call succeeded (real request, real response) but returned zero aggregate page rows "
            "for the requested window. This usually means GA4 tracking is not actually installed on the live "
            "site yet, not that the reporting connection is broken.",
            source_note, "0 rows in the API response.",
            "Before installing any client-side analytics tracking on a children's education site, get the "
            "owner's explicit review of consent/privacy handling - that decision is out of scope for this "
            "read-only reporting agent.", "medium", "high")]
    total_sessions = sum(r.get("sessions", 0) for r in ga4_rows)
    return [finding(
        "growth-ga4-aggregate-summary", "Real aggregate traffic summary available",
        f"GA4 returned {len(ga4_rows)} aggregate page rows totalling {total_sessions} sessions for the "
        "requested window.",
        source_note, f"{len(ga4_rows)} page rows, {total_sessions} total sessions (aggregate, no per-visitor data).",
        "Use this as a real baseline for prioritizing which pages' first-visit experience to review first; do not "
        "infer conversion, retention or demographic outcomes beyond these counts.", "medium", "high")]


def opportunity_prioritizer(combined_findings):
    """Ranks the OTHER agents' findings - it does not generate its own
    findings and must never be reported as a sixth source of findings
    alongside them (that duplicated every finding verbatim under its own
    heading). Returns the same finding objects, each tagged with its rank,
    for the report to order by - not a parallel list."""
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    ordered = sorted(combined_findings, key=lambda x: (rank.get(x["priority"], 4), x["id"]))
    for position, item in enumerate(ordered):
        item["priority_rank"] = position
    return ordered


def gather_all_findings(root=ROOT, env=None):
    env = env or os.environ
    gsc_rows, gsc_source = fetch_search_console_rows(env)
    ga4_rows, ga4_source = fetch_ga4_rows(env)
    seo = seo_technical_guardian(root)
    search = search_opportunity_hunter(gsc_rows, gsc_source)
    first = first_visit_experience_agent(root)
    director = growth_intelligence_director(ga4_rows, ga4_source)
    combined = seo + search + first + director
    ordered = opportunity_prioritizer(combined)
    return ordered, {
        "seo-technical-guardian": seo,
        "search-opportunity-hunter": search,
        "first-visit-experience-agent": first,
        "growth-intelligence-director": director,
    }, {"gsc_connected": gsc_rows is not None, "gsc_source": gsc_source,
        "ga4_connected": ga4_rows is not None, "ga4_source": ga4_source}


def report(agent, findings, limitations, now=None, out=OUT):
    data = dict(schema_version=2, agent=agent, generated_at=(now or datetime.now(timezone.utc).isoformat()),
                mode="read_only", findings=findings, limitations=limitations,
                claude_auto_activation_verified=False, safe_to_auto_merge=False)
    out.mkdir(parents=True, exist_ok=True)
    (out / (agent + ".json")).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data


def main(root=ROOT, out=OUT, env=None):
    now = datetime.now(timezone.utc).isoformat()
    ordered, by_agent, connection_status = gather_all_findings(root, env)
    report("seo-technical-guardian", by_agent["seo-technical-guardian"],
        ["Static source scan only; no live crawl, Search Console indexing or Core Web Vitals data."], now, out)
    report("search-opportunity-hunter", by_agent["search-opportunity-hunter"],
        [connection_status["gsc_source"]] if not connection_status["gsc_connected"] else
        ["Real, authorized Google Search Console aggregate query export. Site-specific visibility only, not "
         "total Google search demand."], now, out)
    report("first-visit-experience-agent", by_agent["first-visit-experience-agent"],
        ["No simulated child behaviour or real user analytics. Findings are test candidates, not usability "
         "conclusions."], now, out)
    report("growth-intelligence-director", by_agent["growth-intelligence-director"],
        [connection_status["ga4_source"]] if not connection_status["ga4_connected"] else
        ["Real, authorized GA4 aggregate page report (sessions/pageviews/users by path only, no user-level "
         "dimensions). Do not infer individual child outcomes."], now, out)
    report("opportunity-prioritizer", [],
        ["This agent ranks the other four agents' findings by priority; it generates none of its own. See each "
         "agent's own report for its findings with their assigned priority_rank."], now, out)
    return {"agents": 5, "candidate_findings": len(ordered), "output": str(out.relative_to(root)),
            "connection_status": connection_status}


if __name__ == "__main__":
    print(json.dumps(main(), default=str))
