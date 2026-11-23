#!/usr/bin/env python3
"""Read-only private operations report from GitHub REST API. No child analytics."""
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GH_TOKEN", "")
API = "https://api.github.com"
TIMEOUT = 15
AGENTS = {
    "Learning Intelligence": "learning-intelligence",
    "Language Guardian": "language-guardian",
    "Education Guardians": "education-guardians",
    "Journey Improvement": "journey-improvement-agents",
    "Content Intelligence": "quarterly-content-intelligence",
}
def get(path):
    req = urllib.request.Request(API + path, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "money-quest-ops-report",
        **({"Authorization": "Bearer " + TOKEN} if TOKEN else {}),
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            return json.load(response), None
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError) as exc:
        return None, str(exc).splitlines()[0][:180]

def main():
    if not REPO or "/" not in REPO:
        print("GITHUB_REPOSITORY must be owner/repo", file=sys.stderr)
        return 2
    repo = "/repos/" + REPO
    info, error = get(repo)
    pulls, pull_error = get(repo + "/pulls?state=open&per_page=100")
    runs, runs_error = get(repo + "/actions/runs?per_page=100")
    issues, issue_error = get(repo + "/issues?state=open&per_page=100")
    checks = []
    for name, key in AGENTS.items():
        matched = [x for x in (runs or {}).get("workflow_runs", [])
                   if key in (x.get("path") or "").lower() or key in (x.get("name") or "").lower().replace(" ", "-")]
        latest = matched[0] if matched else None
        checks.append({"name": name, "last_run": latest.get("html_url") if latest else None,
                       "conclusion": latest.get("conclusion") if latest else "unknown",
                       "status": latest.get("status") if latest else "not-found",
                       "warning": "Latest run may be on a draft PR; not proof of scheduled production operation."})
    draft_prs = [{"number": p["number"], "title": p["title"], "url": p["html_url"],
                  "draft": p.get("draft", False)}
                 for p in (pulls or [])]
    handoffs = [{"number": i["number"], "title": i["title"], "url": i["html_url"]}
                for i in (issues or []) if "pull_request" not in i and
                any(t in i["title"].lower() for t in ("guardian", "intelligence", "journey", "claude", "agent"))]
    data = {"generated_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
            "repository": REPO, "main_sha": (info or {}).get("default_branch"),
            "agents": checks, "draft_prs": draft_prs, "handoffs": handoffs,
            "api_errors": {k: v for k, v in [("repo", error), ("pulls", pull_error),
                         ("runs", runs_error), ("issues", issue_error)] if v},
            "not_connected": ["Google Search Console statistics", "TikTok analytics",
                              "Stripe payment totals", "OpenAI API spending",
                              "Namecheap deployed commit"]}
    Path("money-quest-ops-report.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    lines = ["# Money Quest Private Operations Dashboard", "",
             "Generated UTC: " + data["generated_utc"], "",
             "GitHub-only report. No public web route, no child tracking, no secrets printed.", "",
             "## Agent workflows", ""]
    for x in checks:
        lines.append(f"- {x['name']}: {x['status']} / {x['conclusion']} | {x['last_run'] or 'no run found'}")
    lines += ["", "## Open pull requests", ""]
    lines += [f"- #{p['number']} {'[DRAFT]' if p['draft'] else '[OPEN]'} {p['title']} | {p['url']}" for p in draft_prs] or ["- None found"]
    lines += ["", "## Agent and Claude handoff issues", ""]
    lines += [f"- #{i['number']} {i['title']} | {i['url']}" for i in handoffs] or ["- None found"]
    lines += ["", "## Not yet connected (do not assume zero)", ""]
    lines += ["- " + v for v in data["not_connected"]]
    lines += ["", "## Data/API limitations", ""]
    lines += [f"- {k}: {v}" for k,v in data["api_errors"].items()] or ["- No GitHub API errors."]
    lines += ["", "## Release gate", "",
              "Before deployment: resolve critical findings, run CI and E2E/accessibility tests, verify child journeys and 9 languages, confirm payment/AI privacy and spending controls, take a Namecheap backup, record production commit, smoke-test, and document rollback.",
              "This report never authorizes merges, releases, payment activation or AI activation.", ""]
    Path("money-quest-ops-report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Report: {len(draft_prs)} open PRs, {len(handoffs)} handoff issues, {len(checks)} tracked workflows")
    return 0 if not data["api_errors"] else 1

if __name__ == "__main__":
    raise SystemExit(main())
