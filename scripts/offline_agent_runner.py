#!/usr/bin/env python3
"""Run repository-only agent implementations without external services or paid APIs."""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from scripts.agent_registry import ROOT, REGISTRY

COMMANDS = {
 "scripts/language-guardian.py": ["scripts/language-guardian.py"],
 "scripts/education-guardians.py": ["scripts/education-guardians.py", "--output", "education-guardians-report.md", "--json-output", "education-guardians-report.json"],
 "scripts/journey-improvement-agents.py": ["scripts/journey-improvement-agents.py", "--output", "journey-improvement-report.md", "--json-output", "journey-improvement-findings.json"],
 "scripts/growth_agents.py": ["scripts/growth_agents.py"],
 "scripts/specialist_agents.py": ["scripts/specialist_agents.py"],
 "scripts/parent_copywriting_agent.py": ["scripts/parent_copywriting_agent.py"],
}
EXTERNAL_DATA = {
 "search-opportunity-hunter", "growth-intelligence-director", "social-growth-scientist",
 "parent-teacher-community-scout", "partnership-discovery-agent", "feedback-intelligence-agent",
}
REPORT_FILES = {
 "scripts/language-guardian.py": ["language-guardian-report.json"],
 "scripts/education-guardians.py": ["education-guardians-report.json"],
 "scripts/journey-improvement-agents.py": ["journey-improvement-findings.json"],
}

def plan(registry, root=ROOT):
    groups = {}
    for agent in registry["agents"]:
        path = (agent.get("implementation") or {}).get("path")
        if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
            status = "missing_implementation"
        elif not (root / path).is_file():
            status = "missing_implementation"
        elif agent["id"] in EXTERNAL_DATA:
            status = "awaiting_external_data"
        elif path not in COMMANDS:
            status = "manual_review_required"
        else:
            status = "eligible_for_offline_execution"
        groups[agent["id"]] = {"id": agent["id"], "path": path, "status": status,
                               "run_status": "not_run", "execution_evidence": None}
    return groups

def execute(registry, root=ROOT, out=None, runner=subprocess.run):
    out = out or root / "artifacts/agents/offline-execution"
    out.mkdir(parents=True, exist_ok=True)
    agents = plan(registry, root)
    commands = sorted({item["path"] for item in agents.values()
                       if item["status"] == "eligible_for_offline_execution"})
    outcomes = {}
    for path in commands:
        name = Path(path).stem.replace("-", "_")
        args = [sys.executable, *COMMANDS[path]]
        try:
            result = runner(args, cwd=root, capture_output=True, text=True, timeout=180,
                            env={**os.environ, "MQ_OFFLINE_AUDIT": "1"})
            outcome = {"exit_code": result.returncode, "status": "completed" if result.returncode == 0 else "failed"}
            (out / (name + ".stdout.txt")).write_text(result.stdout[-30000:], encoding="utf-8")
            (out / (name + ".stderr.txt")).write_text(result.stderr[-30000:], encoding="utf-8")
        except subprocess.TimeoutExpired:
            outcome = {"exit_code": None, "status": "timeout"}
        outcomes[path] = outcome
    for item in agents.values():
        if item["status"] != "eligible_for_offline_execution":
            continue
        outcome = outcomes[item["path"]]
        item["run_status"] = outcome["status"]
        item["execution_evidence"] = {"implementation": item["path"],
             "exit_code": outcome["exit_code"], "log_name": Path(item["path"]).stem.replace("-", "_") + ".stdout.txt",
             "shared_script": sum(a["path"] == item["path"] and a["status"] == "eligible_for_offline_execution"
                                  for a in agents.values()) > 1}
    summary = {status: sum(a["status"] == status for a in agents.values())
               for status in ("eligible_for_offline_execution", "awaiting_external_data",
                              "missing_implementation", "manual_review_required")}
    return {"generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary, "commands": outcomes, "agents": list(agents.values()),
            "limitations": ["A shared script run does not establish that every named role executed distinct logic.",
                            "Exit code zero is not proof of correct output or professional expertise.",
                            "No records are promoted to validated/effective without independent evidence.",
                            "External services and child data are not accessed."]}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--registry", type=Path, default=REGISTRY)
    p.add_argument("--output-dir", type=Path, default=ROOT / "artifacts/agents/offline-execution")
    args = p.parse_args()
    data = execute(json.loads(args.registry.read_text(encoding="utf-8")), out=args.output_dir)
    (args.output_dir / "summary.json").write_text(json.dumps(data, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({"summary": data["summary"], "commands": data["commands"]}))
    if any(v["status"] in ("failed", "timeout") for v in data["commands"].values()):
        raise SystemExit(1)

if __name__ == "__main__":
    main()
