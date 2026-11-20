#!/usr/bin/env python3
"""Read-only GitHub Actions evidence snapshot for Money Quest agent registry."""
import argparse
import datetime as dt
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = {
    73: "language-guardian.yml", 74: "education-guardians.yml",
    72: "learning-intelligence.yml", 76: "journey-improvement-agents.yml",
    92: "growth-agents.yml", 94: "specialist-agents.yml",
    95: "parent-copywriting.yml", 98: None, 99: "role-capabilities.yml",
}
# PR 98 has no proven dedicated workflow mapping. Do not guess one.
REPO = "laviniamoraru28-creator/money-quest"

def evaluate(runs, now, max_age_days=14):
    """Only completed successful scheduled/dispatch runs count as operational evidence."""
    candidates = [r for r in runs if r.get("status") == "completed"
                  and r.get("conclusion") == "success"
                  and r.get("event") in ("schedule", "workflow_dispatch")]
    if not candidates:
        return {"status": "no_verified_operational_run", "last_successful_run": None, "run_url": None}
    latest = max(candidates, key=lambda r: r.get("created_at", ""))
    when = dt.datetime.fromisoformat(latest["created_at"].replace("Z", "+00:00"))
    age = (now - when).total_seconds() / 86400
    return {"status": "recent_successful_workflow" if 0 <= age <= max_age_days else "stale_successful_workflow",
            "last_successful_run": latest["created_at"], "run_url": latest.get("html_url")}

def request_json(url, token):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "money-quest-agent-registry",
    })
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)

def snapshot(registry, fetch, now):
    results = {}
    referenced = sorted({a.get("implementation", {}).get("reference_pr") for a in registry["agents"]
                         if a.get("implementation", {}).get("reference_pr") in WORKFLOWS})
    for pr in referenced:
        filename = WORKFLOWS[pr]
        if filename is None:
            results[pr] = {"status": "workflow_not_mapped", "last_successful_run": None, "run_url": None}
            continue
        try:
            path = urllib.parse.quote(filename, safe="")
            payload = fetch(f"https://api.github.com/repos/{REPO}/actions/workflows/{path}/runs?per_page=100")
            results[pr] = evaluate(payload.get("workflow_runs", []), now)
        except urllib.error.HTTPError as exc:
            results[pr] = {"status": "workflow_not_found" if exc.code == 404 else "github_api_error",
                           "http_status": exc.code, "last_successful_run": None, "run_url": None}
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            results[pr] = {"status": "github_api_unavailable", "error_type": type(exc).__name__,
                           "last_successful_run": None, "run_url": None}
    agents = []
    for a in registry["agents"]:
        pr = a["implementation"]["reference_pr"]
        evidence = results.get(pr, {"status": "unmapped"})
        agents.append({"id": a["id"], "name": a["name"], "department": a["department"],
                       "workflow": WORKFLOWS.get(pr), "workflow_evidence": evidence,
                       "individual_agent_execution_verified": False,
                       "note": "A successful group workflow does not prove this individual agent produced useful output."})
    return {"generated_at": now.isoformat(), "source": "GitHub Actions REST API",
            "scope": "Evidence snapshot, not deployment or agent-autonomy certification",
            "agents": agents, "workflows": {str(k): v for k, v in results.items()}}

def markdown(report):
    lines = ["# Money Quest organizational registry: execution evidence", "",
             f"Generated UTC: {report['generated_at']}", "",
             "Group workflow status is not proof of an individual agent's useful output.", "",
             "| Agent | Workflow | Evidence | Last successful operational run |", "|---|---|---|---|"]
    for a in report["agents"]:
        e = a["workflow_evidence"]
        name = a["name"].replace("|", "/")
        date = (e.get("last_successful_run") or "not verified")[:19]
        lines.append(f"| {name} | {a['workflow'] or 'unmapped'} | {e['status']} | {date} |")
    return "\n".join(lines) + "\n"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=ROOT / "governance/agent-registry.json")
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts/agent-registry/live-evidence.json")
    parser.add_argument("--markdown", type=Path, default=ROOT / "artifacts/agent-registry/live-evidence.md")
    args = parser.parse_args()
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        parser.error("GITHUB_TOKEN required for live evidence; no cached or invented statuses")
    registry = json.loads(args.registry.read_text(encoding="utf-8"))
    now = dt.datetime.now(dt.timezone.utc)
    report = snapshot(registry, lambda url: request_json(url, token), now)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    args.markdown.write_text(markdown(report), encoding="utf-8")
    print(f"Wrote evidence for {len(report['agents'])} named agents; no repository writes.")

if __name__ == "__main__":
    main()
