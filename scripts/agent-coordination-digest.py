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
]
# Matching is deliberately "name appears anywhere in the title", not an
# exact prefix: the four workflows' own automated issues ("Education
# Guardians report: <run id>") and the owner's manually-opened handoff
# issues ("Claude handoff: Education Guardians MVP report and review")
# use different conventions today. Both must land under the same agent -
# see docs/agent-coordination.md for the recommended convention going
# forward (a shared "agent-report" label, once the other branches merge).


def classify_title(title):
    for agent, pattern, _domain in AGENT_PATTERNS:
        if pattern.search(title):
            return agent
    return None


def build_digest(issues, generated_at=None):
    """issues: list of {number, title, html_url, created_at, state} dicts
    for OPEN issues only (closed ones are out of scope for the digest -
    they've already been handled). Pure function, no network access, so
    it's testable without a GitHub token or live repository."""
    generated_at = generated_at or dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    by_agent = {agent: [] for agent, _p, _d in AGENT_PATTERNS}
    unmatched = []
    for issue in issues:
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
    body = build_digest(issues)
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
