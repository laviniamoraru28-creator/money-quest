#!/usr/bin/env python3
"""Delivers the five growth_agents.py JSON reports to one stable GitHub
issue, updating it in place (see agent_issue_reporting.py) instead of the
old behavior of creating a brand-new issue on every run.

Run from the repo root inside the growth-agents.yml workflow, after
growth_agents.py has written artifacts/growth-agents/*.json. Requires
GH_TOKEN/GH_REPO in the environment (same as the old inline `gh` calls).
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agent_issue_reporting as air  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = ROOT / "artifacts" / "growth-agents"
REPORT_KEY = "growth-agents"
TITLE = "Growth Agents report"

FINDING_GENERATING_AGENTS = (
    "seo-technical-guardian",
    "search-opportunity-hunter",
    "first-visit-experience-agent",
    "growth-intelligence-director",
)


def load_all_findings(reports_dir=REPORTS_DIR):
    findings = []
    for agent in FINDING_GENERATING_AGENTS:
        path = reports_dir / f"{agent}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        findings.extend(data.get("findings", []))
    return findings


def main():
    run_url = os.environ.get("RUN_URL", "")
    findings = load_all_findings()
    intro = (
        "# Money Quest Growth Agents report\n\n"
        "Four read-only finding agents (SEO Technical Guardian, Search Opportunity Hunter, "
        "First Visit Experience Agent, Growth Intelligence Director) plus Opportunity Prioritizer, "
        "which ranks their findings and generates none of its own - see each finding's "
        "`priority`/`priority_rank` rather than a separate duplicated list.\n\n"
        "Findings are review candidates, not confirmed defects, until `verification_status` says "
        "`confirmed`. Search/growth findings only ever report real numbers from an authorized, "
        "already-connected aggregate data source (Google Search Console, GA4) - never an inferred "
        "ranking, demand estimate or traffic claim beyond what that source actually returned."
    )
    ref, action, merged = air.upsert_rich_findings_issue(REPORT_KEY, TITLE, findings, intro, run_url)
    if action == "created":
        import subprocess
        subprocess.run(["gh", "issue", "comment", ref, "--body",
                         "@claude Please review the findings against the actual code. Propose fixes only through "
                         "separate draft PRs. Do not merge, deploy, or invent search/traffic data."],
                        check=True)
    print(json.dumps({"issue": ref, "action": action, "finding_count": len(merged)}))


if __name__ == "__main__":
    main()
