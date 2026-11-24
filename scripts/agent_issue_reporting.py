#!/usr/bin/env python3
"""Shared GitHub-issue reporting for Money Quest's read-only audit agents.

Replaces the old pattern (every workflow run calling `gh issue create` with
the run id baked into the title) with an upsert: each report has one STABLE
issue, identified by a hidden marker in the issue body, that every run
updates in place instead of recreating. This is what makes "recurring
findings update the existing issue" (rather than growing a new issue per
run) and "pending findings get re-verified automatically" possible: the
previous run's state is read back from the issue body before the new
findings are written, not thrown away.

Two levels are supported:
  - `upsert_simple_report(...)`: one stable issue per agent-workflow, body
    replaced wholesale each run. For agents whose existing finding() shape
    has no stable per-finding id (education-guardians, journey-improvement,
    specialist-agents, parent-copywriting at the time this was written) -
    still gets real dedup (no more one-new-issue-per-run), just not
    per-finding verification tracking.
  - `upsert_rich_findings_issue(...)`: full per-finding dedup and
    pending/reverification tracking, for agents whose findings carry a
    stable `id` (growth-agents). Each finding gets persisted with
    verification_status and last_verified, carried forward across runs
    until a human (or Claude) marks it confirmed/false_positive/resolved,
    or it stops reproducing for enough consecutive runs to auto-resolve.
"""
import json
import re
import subprocess
from datetime import datetime, timezone

MARKER_PREFIX = "<!-- money-quest-agent-report:"
MARKER_SUFFIX = "-->"
# A finding that stops reproducing this many consecutive runs is marked
# resolved automatically, rather than lingering as "pending" forever.
AUTO_RESOLVE_AFTER_MISSES = 3


def _run_gh(args, input_text=None):
    result = subprocess.run(["gh", *args], input=input_text, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def _marker(report_key):
    return f"{MARKER_PREFIX}{report_key}{MARKER_SUFFIX}"


def find_existing_issue(report_key):
    """Returns (issue_number, body) for the open issue carrying this report's
    marker, or (None, None) if none exists yet. Searches open issues only -
    a closed/resolved report issue gets a fresh one on next findings, which
    is the right behavior (closing means "this was fully addressed")."""
    marker = _marker(report_key)
    raw = _run_gh(["issue", "list", "--state", "open", "--search", marker,
                   "--json", "number,body", "--limit", "5"])
    candidates = json.loads(raw) if raw else []
    for candidate in candidates:
        if marker in (candidate.get("body") or ""):
            return candidate["number"], candidate["body"]
    return None, None


def upsert_simple_report(report_key, title, body_markdown):
    """One stable issue per report_key: update body + comment if it exists,
    create it (with the marker embedded) if it doesn't."""
    marker = _marker(report_key)
    full_body = f"{body_markdown}\n\n{marker}\n"
    number, _ = find_existing_issue(report_key)
    if number is None:
        issue_url = _run_gh(["issue", "create", "--title", title, "--body", full_body])
        return issue_url, "created"
    _run_gh(["issue", "edit", str(number), "--body", full_body])
    _run_gh(["issue", "comment", str(number), "--body",
              "Updated with this run's findings (see body above) - same tracked report, not a new one."])
    return f"#{number}", "updated"


def _extract_findings_json(body):
    match = re.search(r"<!-- FINDINGS_JSON\n(.*?)\n-->", body or "", re.S)
    if not match:
        return {}
    try:
        return {f["id"]: f for f in json.loads(match.group(1))}
    except (json.JSONDecodeError, KeyError, TypeError):
        return {}


def _today():
    return datetime.now(timezone.utc).date().isoformat()


def merge_findings(previous_by_id, current_findings):
    """Carries verification history forward. A finding seen again keeps its
    verification_status (confirmed/false_positive stick; unverified stays
    unverified for a human/Claude to triage) but gets a fresh last_verified
    date and its miss_count reset to 0. A previously-open finding that did
    NOT reproduce this run has its miss_count incremented; after
    AUTO_RESOLVE_AFTER_MISSES consecutive misses it is marked resolved
    automatically rather than left pending forever. A finding already
    marked resolved/false_positive that genuinely reproduces again is
    reopened as unverified - code can regress."""
    today = _today()
    current_by_id = {f["id"]: dict(f) for f in current_findings}
    merged = {}

    for fid, current in current_by_id.items():
        previous = previous_by_id.get(fid)
        if previous is None:
            current.setdefault("verification_status", "unverified")
            current["first_seen"] = today
        else:
            carried_status = previous.get("verification_status", "unverified")
            if carried_status in ("resolved", "false_positive"):
                carried_status = "unverified"  # reproduced again after being closed out
            current["verification_status"] = carried_status
            current["first_seen"] = previous.get("first_seen", today)
        current["last_verified"] = today
        current["miss_count"] = 0
        merged[fid] = current

    for fid, previous in previous_by_id.items():
        if fid in current_by_id:
            continue
        if previous.get("verification_status") in ("resolved", "false_positive"):
            merged[fid] = dict(previous)  # already closed out; carry forward unchanged as audit trail
            continue
        carried = dict(previous)
        carried["miss_count"] = previous.get("miss_count", 0) + 1
        if carried["miss_count"] >= AUTO_RESOLVE_AFTER_MISSES:
            carried["verification_status"] = "resolved"
            carried["resolved_reason"] = f"did not reproduce for {carried['miss_count']} consecutive runs"
        merged[fid] = carried

    return merged


def render_findings_markdown(findings_by_id):
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    ordered = sorted(findings_by_id.values(),
                      key=lambda f: (order.get(f.get("priority", "medium"), 4), f["id"]))
    lines = []
    open_findings = [f for f in ordered if f.get("verification_status") not in ("resolved", "false_positive")]
    closed_findings = [f for f in ordered if f.get("verification_status") in ("resolved", "false_positive")]

    lines.append(f"### Open findings ({len(open_findings)})")
    if not open_findings:
        lines.append("\nNone open.")
    for f in open_findings:
        lines.append(f"\n#### `{f['id']}` — {f['title']} ({f.get('priority', 'medium')})")
        lines.append(f"- **Description**: {f.get('description', '')}")
        lines.append(f"- **Source**: {f.get('source', '')}")
        lines.append(f"- **Evidence**: {f.get('evidence', '')}")
        lines.append(f"- **Recommendation**: {f.get('recommendation', '')}")
        lines.append(f"- **Confidence**: {f.get('confidence', 'medium')}")
        lines.append(f"- **Verification status**: {f.get('verification_status', 'unverified')}")
        lines.append(f"- **First seen**: {f.get('first_seen', '?')} · **Last verified**: {f.get('last_verified', '?')}")

    if closed_findings:
        lines.append(f"\n### Closed findings ({len(closed_findings)})")
        for f in closed_findings:
            reason = f.get("resolved_reason", f.get("verification_status"))
            lines.append(f"- `{f['id']}` — {f['title']}: **{f.get('verification_status')}** ({reason})")

    return "\n".join(lines)


def upsert_rich_findings_issue(report_key, title, findings, intro_markdown, run_url):
    """Full per-finding dedup + pending/reverification. `findings` is this
    run's list of finding dicts (must each have a stable `id`)."""
    number, previous_body = find_existing_issue(report_key)
    previous_by_id = _extract_findings_json(previous_body) if previous_body else {}
    merged = merge_findings(previous_by_id, findings)

    body = (
        f"{intro_markdown}\n\n"
        f"{render_findings_markdown(merged)}\n\n"
        f"Full run: {run_url}\n\n"
        f"{_marker(report_key)}\n"
        f"<!-- FINDINGS_JSON\n{json.dumps(list(merged.values()), indent=2)}\n-->\n"
    )

    if number is None:
        issue_url = _run_gh(["issue", "create", "--title", title, "--body", body])
        return issue_url, "created", merged
    _run_gh(["issue", "edit", str(number), "--body", body])
    newly_added = set(merged) - set(previous_by_id)
    newly_resolved = {fid for fid in merged if merged[fid].get("verification_status") == "resolved"
                       and previous_by_id.get(fid, {}).get("verification_status") != "resolved"}
    if newly_added or newly_resolved:
        note = []
        if newly_added:
            note.append(f"{len(newly_added)} new finding(s): {', '.join(sorted(newly_added))}")
        if newly_resolved:
            note.append(f"{len(newly_resolved)} auto-resolved (stopped reproducing): {', '.join(sorted(newly_resolved))}")
        _run_gh(["issue", "comment", str(number), "--body", "Updated this run - " + "; ".join(note) + "."])
    else:
        _run_gh(["issue", "comment", str(number), "--body",
                  "Re-verified this run: no new or resolved findings (see body above for current state)."])
    return f"#{number}", "updated", merged
