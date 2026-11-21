#!/usr/bin/env python3
"""Read-only readiness inventory. Never claims an agent ran merely because its code exists."""
import argparse
import json
import py_compile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from scripts.agent_registry import REGISTRY, ROOT

def build_report(registry, root=ROOT, now=None):
    now = now or datetime.now(timezone.utc)
    (root / "artifacts" / "agent-readiness").mkdir(parents=True, exist_ok=True)
    agents = []
    for agent in registry["agents"]:
        rel = agent["implementation"]["path"]
        path = root / rel
        exists = path.is_file() and path.resolve().is_relative_to(root.resolve())
        syntax_ok = None
        error = None
        if exists and path.suffix == ".py":
            try:
                py_compile.compile(str(path), cfile=str(root / "artifacts" / "agent-readiness" / (agent["id"] + ".pyc")), doraise=True)
                syntax_ok = True
            except (py_compile.PyCompileError, OSError) as exc:
                syntax_ok = False
                error = str(exc)[:500]
        agents.append({
            "id": agent["id"], "name": agent["name"], "department": agent["department"],
            "implementation_path": rel, "implementation_exists": exists,
            "python_syntax_ok": syntax_ok, "declared_status": agent["operational_status"],
            "execution_verified": False, "operational": "unverified",
            "next_action": "Repair missing implementation" if not exists else
                           "Repair Python syntax" if syntax_ok is False else
                           "Verify scheduled execution, output and human-reviewed quality",
            "error": error,
        })
    return {
        "generated_at": now.isoformat(), "agent_count": len(agents),
        "implementation_files_present": sum(a["implementation_exists"] for a in agents),
        "missing_implementations": [a["id"] for a in agents if not a["implementation_exists"]],
        "syntax_failures": [a["id"] for a in agents if a["python_syntax_ok"] is False],
        "departments": dict(Counter(a["department"] for a in agents)),
        "limitations": [
            "File presence and syntax are prerequisites, not proof of successful agent execution.",
            "This report does not read production secrets, run agents, certify outputs, or authorize autonomous changes.",
            "Operational evidence must be independently linked to actual workflow runs and artifacts."
        ], "agents": agents
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=REGISTRY)
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/agent-readiness/readiness.json")
    args = parser.parse_args()
    data = build_report(json.loads(args.registry.read_text(encoding="utf-8")))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Agent readiness: {data['implementation_files_present']}/{data['agent_count']} implementation files present; {len(data['syntax_failures'])} syntax failures. Execution remains unverified.")
    # Missing implementations are inventory findings, not a failure of the monitor itself.
    # Downstream release gates may enforce a separate explicit threshold.

if __name__ == "__main__":
    main()
