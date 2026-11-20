#!/usr/bin/env python3
"""Offline, read-only organizational inventory validation. No live-status claims."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "governance" / "agent-registry.json"

def validate(data):
    errors = []
    agents = data.get("agents", [])
    ids = [a.get("id") for a in agents]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate agent ids")
    for agent in agents:
        for field in ("id", "name", "department", "purpose", "implementation", "operational_status"):
            if not agent.get(field):
                errors.append(f"{agent.get('id', '?')}: missing {field}")
        if agent.get("operational_status") not in ("unverified", "verified_running", "blocked", "inactive"):
            errors.append(f"{agent.get('id', '?')}: invalid operational_status")
        if agent.get("operational_status") == "verified_running" and not agent.get("last_successful_run"):
            errors.append(f"{agent.get('id', '?')}: verified_running without dated evidence")
    return errors

def summarize(data, root):
    agents = data["agents"]
    paths = sorted(set(a["implementation"]["path"] for a in agents))
    return {"agents": len(agents), "departments": dict(sorted(Counter(a["department"] for a in agents).items())),
            "operational_statuses": dict(sorted(Counter(a["operational_status"] for a in agents).items())),
            "paths_on_checked_branch": {path: (root / path).is_file() for path in paths},
            "warning": "Path presence does not prove scheduled execution or agent autonomy; check GitHub Actions and PR states separately."}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=REGISTRY)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.registry.read_text(encoding="utf-8"))
    errors = validate(data)
    result = {"valid": not errors, "errors": errors, "summary": summarize(data, args.root)}
    output = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
    else:
        print(output, end="")
    raise SystemExit(1 if errors else 0)

if __name__ == "__main__":
    main()
