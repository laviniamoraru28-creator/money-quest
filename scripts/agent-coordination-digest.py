#!/usr/bin/env python3
"""Money Quest Agent Coordination Hub.

Read-only coordination layer over the site's existing static-audit agents
(Language Guardian, Education Guardians, Learning Intelligence, Journey
Improvement Agents). It does not run analysis itself, does not call a paid
API, and does not touch any other agent's branch or workflow file.

What it does: lists open GitHub issues matching the four agents' known
report-title patterns, classifies each by agent/domain, and renders ONE
rolling digest (Markdown body) instead of letting one-off report issues
pile up with no shared index. The caller (the GitHub Actions workflow)
decides whether to create or update the digest issue; this module only
builds the content, which keeps it unit-testable without a GitHub token.
"""
import datetime as dt
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DIGEST_TITLE = "Money Quest Agent Coordination Digest"

# Each agent's responsibility is kept deliberately separate (see
# docs/agent-coordination.md for the full rationale); this table exists
# so a new agent's report is only ever filed once, under its own domain,
# rather than drifting into another agent's area.
AGENT_PATTERNS = [
    ("Language Guardian", re.compile(r"Language Guardian", re.I),
     "Multilingual structural consistency across the 9 messages/*.json files."),
    ("Education Guardians", re.compile(r"Education Guardians", re.I),
     "Accessibility review candidates, learning-progression review, future-skills research evidence."),
    ("Journey Improvement Agents", re.compile(r"Journey Improvement Agents|Journey Detective|Experiment Designer|Improvement Engine", re.I),
     "UX-flow review candidates, usability-experiment proposals, priority-ranked improvement queue."),
    ("Learning Intelligence", re.compile(r"Learning Intelligence", re.I),
     "Curriculum-navigation inventory and (optional) search-visibility topic signals."),
    ("Growth Agents", re.compile(r"Growth Agents|Search Opportunity Hunter|First Visit Experience|SEO Technical Guardian|Growth Intelligence Director|Opportunity Prioritizer", re.I),
     "Five read-only agents (Search Opportunity Hunter, First Visit Experience Agent, SEO Technical "
     "Guardian, Growth Intelligence Director, Opportunity Prioritizer). Search/growth findings explicitly "
     "require an authorized aggregated analytics source before claiming traffic, rankings or engagement."),
    ("Specialist Agents", re.compile(r"Specialist Agents|Social Growth Scientist|Parent.Teacher Community Scout|Partnership Discovery|Engagement Designer|Accessibility Personalization|Feedback Intelligence|Learning Gap Detector|Imagination.Innovation Scout|Cultural Learning Adapter|Research.to.Lesson|Performance Optimizer|Security Sentinel|Release Guardian|AI Cost Controller|Privacy Guardian|Weekly Executive Reporter", re.I),
     "Sixteen read-only agents (see docs/specialist-agents.md): social/community/partnership/feedback/"
     "research agents await approved external data; the rest (engagement, accessibility, curriculum, "
     "performance, security, release, AI cost, privacy, weekly summary) run entirely on repository source."),
    ("Parent Copywriting Strategist", re.compile(r"Parent Copywriting|Parent Communication.{0,5}Copywriting", re.I),
     "Monthly editorial briefs and lint-checked drafts for parent-facing /learn articles. Never writes "
     "to the live article catalog directly and never links to Facebook or TikTok; a draft reaches the "
     "site only through a separate, human-approved Draft PR."),
]
# Matching is deliberately "name appears anywhere in the title", not an
# exact prefix: the four workflows' own automated issues ("Education
# Guardians report: <run id>") and the owner's manually-opened handoff
# issues ("Claude handoff: Education Guardians MVP report and review")
# use different conventions today. Both must land under the same agent -
# see docs/agent-coordination.md for the recommended convention going
# forward (a shared "agent-report" label, once the other branches merge).

# Each agent's own workflow file and documented cadence (see each agent's
# PR for its schedule - Language Guardian Mon 09:00 UTC, Learning
# Intelligence Mon 07:17 UTC, Education Guardians Tue 08:00 UTC, Journey
# Improvement Agents Wed 09:00 UTC, Growth Agents Mon 08:23 UTC,
# Specialist Agents Tue 08:41 UTC), plus this hub's own workflow. As of
# 2026-11-18 none of the seven live on `main` - each exists only on its
# own open draft PR's branch - so the GitHub Actions `schedule:` trigger
# cannot fire any of them yet; this table lets the digest say that
# honestly instead of silently going quiet. A workflow only starts
# appearing in the Actions API once it has ever run (via `pull_request`
# or `workflow_dispatch`) from any branch, which is how health-checking
# it pre-merge is possible at all.
KNOWN_WORKFLOWS = [
    ("Language Guardian", "language-guardian.yml", 7),
    ("Education Guardians", "education-guardians.yml", 7),
    ("Journey Improvement Agents", "journey-improvement-agents.yml", 7),
    ("Learning Intelligence", "learning-intelligence.yml", 7),
    ("Growth Agents", "growth-agents.yml", 7),
    ("Specialist Agents", "specialist-agents.yml", 7),
    ("Parent Copywriting Strategist", "parent-copywriting.yml", 30),
    ("Agent Coordination Hub (this workflow)", "agent-coordination.yml", 1),
]
# A run is "stale" once this many cadence periods have passed with no
# completed run - loose enough to absorb a skipped day/week without
# false alarms, since none of these are merged to main yet and may only
# ever run via manual dispatch or a PR-triggered dry run in the meantime.
STALE_AFTER_CADENCES = 2


def classify_title(title):
    for agent, pattern, _domain in AGENT_PATTERNS:
        if pattern.search(title):
            return agent
    return None


def classify_workflow_health(runs, cadence_days, now):
    """runs: most-recent-first list of {status, conclusion, created_at,
    html_url} dicts for one workflow (as returned by the Actions API), or
    an empty list if the workflow has never run anywhere. Pure/offline so
    it's testable without mocking network calls. Returns one of:
    "never-run", "failed" (most recent *completed* run did not succeed),
    "stale" (last completed run older than STALE_AFTER_CADENCES *
    cadence_days), "pending" (a run is currently in progress and nothing
    completed one is stale yet), or "healthy"."""
    if not runs:
        return "never-run", None
    completed = [r for r in runs if r.get("status") == "completed"]
    if not completed:
        return "pending", runs[0]
    latest = completed[0]
    if latest.get("conclusion") not in ("success", "neutral", "skipped"):
        return "failed", latest
    age_days = (now - dt.datetime.fromisoformat(latest["created_at"].replace("Z", "+00:00"))).total_seconds() / 86400
    if age_days > cadence_days * STALE_AFTER_CADENCES:
        return "stale", latest
    return "healthy", latest


def find_duplicate_reports(by_agent):
    """Within each agent's own open-issue list, flag titles that repeat
    (normalized: case/whitespace-insensitive) - a sign the agent's own
    workflow opened a new issue instead of updating an existing one for
    the same finding. Cross-agent title collisions are not duplicates
    (classify_title already resolved those to one agent each)."""
    duplicates = {}
    for agent, issues in by_agent.items():
        seen = {}
        for issue in issues:
            key = " ".join(issue["title"].split()).casefold()
            seen.setdefault(key, []).append(issue)
        groups = [group for group in seen.values() if len(group) > 1]
        if groups:
            duplicates[agent] = groups
    return duplicates


def build_digest(issues, generated_at=None, workflow_health=None):
    """issues: list of {number, title, html_url, created_at, state} dicts
    for OPEN issues only (closed ones are out of scope for the digest -
    they've already been handled). Pure function, no network access, so
    it's testable without a GitHub token or live repository."""
    generated_at = generated_at or dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    by_agent = {agent: [] for agent, _p, _d in AGENT_PATTERNS}
    unmatched = []
    # The digest issue itself must never appear in its own "unrecognized"
    # section (confirmed in the wild: issue #79 listed itself there on its
    # first live run, since its own title matches none of the four agent
    # patterns) - it is an index, not a report.
    for issue in issues:
        if issue["title"] == DIGEST_TITLE:
            continue
        agent = classify_title(issue["title"])
        if agent:
            by_agent[agent].append(issue)
        else:
            unmatched.append(issue)

    lines = [
        f"# {DIGEST_TITLE}",
        "",
        f"Generated (UTC): {generated_at}",
        "",
        "Single rolling index over the four read-only audit agents' own report "
        "issues. This issue is updated in place on each coordination run, not "
        "recreated, so report volume never grows unbounded. It does not "
        "replace any agent's own issue or report artifact; it only indexes "
        "them so a human (or the coordinating Claude session) has one place "
        "to start from.",
        "",
        "## Open reports by agent",
        "",
    ]
    duplicates = find_duplicate_reports(by_agent)
    total_open = 0
    for agent, _pattern, domain in AGENT_PATTERNS:
        items = sorted(by_agent[agent], key=lambda i: i["number"])
        total_open += len(items)
        lines.append(f"### {agent} ({len(items)} open)")
        lines.append("")
        lines.append(f"Domain: {domain}")
        lines.append("")
        if items:
            for issue in items:
                lines.append(f"- #{issue['number']} [{issue['title']}]({issue['html_url']}) — opened {issue['created_at'][:10]}")
        else:
            lines.append("- None open.")
        if agent in duplicates:
            lines.append("")
            lines.append("⚠️ **Possible duplicate reports** (same title, opened separately - review before acting on either, and close the stale one instead of fixing both):")
            for group in duplicates[agent]:
                numbers = ", ".join(f"#{issue['number']}" for issue in sorted(group, key=lambda i: i["number"]))
                lines.append(f"  - {numbers}: \"{group[0]['title']}\"")
        lines.append("")

    if unmatched:
        lines.append("### Unrecognized report-shaped issues")
        lines.append("")
        lines.append(
            "These matched none of the four known title patterns above. "
            "Before adding a fifth agent, check this list is empty — an "
            "issue landing here usually means either a naming drift in an "
            "existing agent or an undeclared new one. See "
            "docs/agent-coordination.md before creating another workflow."
        )
        lines.append("")
        for issue in sorted(unmatched, key=lambda i: i["number"]):
            lines.append(f"- #{issue['number']} [{issue['title']}]({issue['html_url']})")
        lines.append("")

    lines += [
        "## Status",
        "",
        f"{total_open} open report issue(s) across {len(AGENT_PATTERNS)} known agents.",
        "",
    ]

    if workflow_health:
        icons = {"healthy": "✅", "pending": "🔄", "stale": "⚠️", "failed": "❌", "never-run": "—"}
        labels = {
            "healthy": "healthy",
            "pending": "run in progress",
            "stale": "stale — no completed run in the expected window",
            "failed": "last completed run failed",
            "never-run": "never observed running (no run on any branch yet)",
        }
        lines.append("## Agent execution health")
        lines.append("")
        lines.append(
            "Whether each agent's own workflow has actually executed recently - "
            "not whether a report *issue* exists, which `Open reports by agent` "
            "above already covers. A workflow only appears in GitHub's Actions "
            "API once it has run at least once (via `pull_request` or "
            "`workflow_dispatch`) from any branch; none of the five below are "
            "on `main` yet, so none can fire on their own `schedule:` trigger - "
            "\"stale\"/\"never-run\" here is therefore expected until the owner "
            "merges the underlying PR, not itself a new problem to fix."
        )
        lines.append("")
        for agent, workflow_file, cadence_days in KNOWN_WORKFLOWS:
            state, latest = workflow_health.get(workflow_file, ("never-run", None))
            icon = icons.get(state, "?")
            detail = labels.get(state, state)
            if latest:
                when = latest["created_at"][:10]
                link = f" ([run]({latest['html_url']}))" if latest.get("html_url") else ""
                detail += f" — last completed run {when}{link}"
            lines.append(f"- {icon} **{agent}** (`{workflow_file}`, every {cadence_days}d): {detail}")
        lines.append("")

    lines += [
        "## Claude handoff",
        "",
        "This digest exists so a scheduled poll (not a GitHub webhook - see "
        "docs/agent-coordination.md for why) can find every open agent "
        "report in one read instead of searching issue history. Review each "
        "linked issue against real source code, distinguish confirmed "
        "defects from suggestions needing human educational review, and "
        "open a separate draft PR with tests for confirmed fixes only. "
        "Never merge or deploy without explicit owner approval. Never edit "
        "another agent's active feature branch.",
        "",
    ]
    return "\n".join(lines) + "\n"


def _github_request(url, token, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def list_report_issues(repo, token):
    """All OPEN issues, paginated, excluding pull requests (the Issues API
    returns PRs too; they carry a 'pull_request' key we filter out)."""
    issues, page = [], 1
    while True:
        url = f"https://api.github.com/repos/{repo}/issues?state=open&per_page=100&page={page}"
        batch = _github_request(url, token)
        if not batch:
            break
        issues += [i for i in batch if "pull_request" not in i]
        if len(batch) < 100:
            break
        page += 1
    return [{"number": i["number"], "title": i["title"], "html_url": i["html_url"], "created_at": i["created_at"]} for i in issues]


def fetch_workflow_health(repo, token, now=None):
    """One classify_workflow_health() result per entry in KNOWN_WORKFLOWS,
    keyed by workflow filename. A workflow that has never run anywhere
    (common pre-merge: its `pull_request` trigger only fires on an actual
    PR event, and it may never have been manually dispatched) 404s on the
    runs endpoint - that is "never-run", not an error, so it is caught
    here rather than failing the whole digest build."""
    now = now or dt.datetime.now(dt.timezone.utc)
    health = {}
    for _agent, workflow_file, cadence_days in KNOWN_WORKFLOWS:
        url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/runs?per_page=5"
        try:
            result = _github_request(url, token)
            runs = [
                {
                    "status": r["status"],
                    "conclusion": r["conclusion"],
                    "created_at": r["created_at"],
                    "html_url": r["html_url"],
                }
                for r in result.get("workflow_runs", [])
            ]
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                runs = []
            else:
                raise
        health[workflow_file] = classify_workflow_health(runs, cadence_days, now)
    return health


def digest_search_url(repo):
    """Pure (no network) so the exact bug this once had - an unencoded
    space/quote in the query string, rejected by Python 3.14's stricter
    http.client path validator - has a regression test that doesn't need
    to mock a GitHub response."""
    query = f'repo:{repo} type:issue state:open in:title "{DIGEST_TITLE}"'
    return "https://api.github.com/search/issues?q=" + urllib.parse.quote(query, safe="")


def find_digest_issue(repo, token):
    result = _github_request(digest_search_url(repo), token)
    items = result.get("items", [])
    return items[0]["number"] if items else None


def upsert_digest(repo, token, body):
    existing = find_digest_issue(repo, token)
    if existing:
        _github_request(f"https://api.github.com/repos/{repo}/issues/{existing}", token, method="PATCH", body={"body": body})
        return existing, "updated"
    created = _github_request(f"https://api.github.com/repos/{repo}/issues", token, method="POST", body={"title": DIGEST_TITLE, "body": body})
    return created["number"], "created"


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", help="owner/repo, e.g. laviniamoraru28-creator/money-quest")
    parser.add_argument("--token-env", default="GH_TOKEN")
    parser.add_argument("--output", default="agent-coordination-digest.md")
    parser.add_argument("--dry-run", action="store_true", help="Build the digest but never write to GitHub.")
    args = parser.parse_args()

    import os
    token = os.environ.get(args.token_env)
    if not args.repo or not token:
        print("Missing --repo or token env var; building an empty-input digest for local/offline use.", file=sys.stderr)
        body = build_digest([])
        Path(args.output).write_text(body, encoding="utf-8")
        print(f"Wrote {args.output} (offline mode, no GitHub calls made)")
        return

    issues = list_report_issues(args.repo, token)
    try:
        health = fetch_workflow_health(args.repo, token)
    except urllib.error.HTTPError as exc:
        print(f"Warning: could not fetch agent workflow health ({exc.code} {exc.reason}); digest will omit that section.", file=sys.stderr)
        health = None
    body = build_digest(issues, workflow_health=health)
    Path(args.output).write_text(body, encoding="utf-8")

    if args.dry_run:
        print(f"Dry run: would upsert digest from {len(issues)} open issue(s). Report written to {args.output}.")
        return

    try:
        number, action = upsert_digest(args.repo, token, body)
        print(f"Digest issue #{number} {action} from {len(issues)} open issue(s).")
    except urllib.error.HTTPError as exc:
        print(f"GitHub API error upserting digest: {exc.code} {exc.reason}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
