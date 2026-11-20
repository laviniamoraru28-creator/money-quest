#!/usr/bin/env python3
"""Evidence-gated agent health report. No agent is executed or certified by this script."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from scripts.agent_registry import REGISTRY, ROOT

LEVELS = ("configured", "executed", "validated", "effective")
REQUIRED_RUN = ("run_id", "started_at", "completed_at", "implementation_ref", "artifact_url", "result")
REQUIRED_REVIEW = ("reviewer", "reviewed_at", "benchmark_url", "cases_total", "cases_passed", "false_positives", "missed_issues", "scope_limits_documented")
REQUIRED_IMPACT = ("metric", "baseline", "after", "measured_at", "evidence_url", "reviewer", "direction")
MAX_AGE_DAYS = 45

def date(value):
    if not isinstance(value, str):
        return None
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return result if result.tzinfo else None
    except ValueError:
        return None

def nonempty(record, fields):
    return all(record.get(k) is not None and record.get(k) != "" for k in fields)

def report(registry, evidence, now=None):
    now = now or datetime.now(timezone.utc)
    if not isinstance(evidence, dict) or not isinstance(evidence.get("agents", {}), dict):
        raise ValueError("evidence.agents must be an object")
    records = []
    ids = {agent["id"] for agent in registry["agents"]}
    unknown = sorted(set(evidence.get("agents", {})) - ids)
    for agent in registry["agents"]:
        agent_id = agent["id"]
        item = evidence.get("agents", {}).get(agent_id, {})
        if not isinstance(item, dict):
            raise ValueError(f"invalid evidence for {agent_id}")
        blockers = []
        level = "configured"
        run = item.get("execution") or {}
        if not isinstance(run, dict):
            raise ValueError(f"invalid execution for {agent_id}")
        start, finish = date(run.get("started_at")), date(run.get("completed_at"))
        execution_ok = (
            nonempty(run, REQUIRED_RUN) and run.get("result") == "success"
            and start is not None and finish is not None and start <= finish <= now
            and (now - finish).days <= MAX_AGE_DAYS
            and str(run.get("artifact_url", "")).startswith("https://")
            and str(run.get("implementation_ref", "")).strip() != ""
        )
        if execution_ok:
            level = "executed"
        else:
            blockers.append("Missing recent successful execution with dated, reproducible artifact")
        review = item.get("validation") or {}
        if not isinstance(review, dict):
            raise ValueError(f"invalid validation for {agent_id}")
        reviewed = date(review.get("reviewed_at"))
        validation_ok = (
            execution_ok and nonempty(review, REQUIRED_REVIEW)
            and isinstance(review.get("cases_total"), int) and not isinstance(review.get("cases_total"), bool)
            and review["cases_total"] >= 5
            and isinstance(review.get("cases_passed"), int) and not isinstance(review.get("cases_passed"), bool)
            and review["cases_passed"] == review["cases_total"]
            and isinstance(review.get("false_positives"), int) and not isinstance(review.get("false_positives"), bool)
            and review["false_positives"] == 0
            and isinstance(review.get("missed_issues"), int) and not isinstance(review.get("missed_issues"), bool)
            and review["missed_issues"] == 0
            and review.get("scope_limits_documented") is True
            and reviewed is not None and finish <= reviewed <= now
            and str(review.get("benchmark_url", "")).startswith("https://")
        )
        if validation_ok:
            level = "validated"
        else:
            blockers.append("Independent human review and passing benchmark not established")
        impact = item.get("impact") or {}
        if not isinstance(impact, dict):
            raise ValueError(f"invalid impact for {agent_id}")
        measured = date(impact.get("measured_at"))
        impact_ok = (
            validation_ok and nonempty(impact, REQUIRED_IMPACT)
            and isinstance(impact.get("baseline"), (int, float)) and not isinstance(impact.get("baseline"), bool)
            and isinstance(impact.get("after"), (int, float)) and not isinstance(impact.get("after"), bool)
            and impact.get("direction") in ("increase", "decrease")
            and ((impact["after"] > impact["baseline"]) if impact.get("direction") == "increase" else (impact["after"] < impact["baseline"]))
            and measured is not None and reviewed <= measured <= now
            and str(impact.get("evidence_url", "")).startswith("https://")
        )
        if impact_ok:
            level = "effective"
        else:
            blockers.append("Reviewed before/after impact evidence not established")
        records.append({"id": agent_id, "name": agent.get("name"), "department": agent.get("department"),
                        "level": level, "last_execution": run.get("completed_at") if execution_ok else None,
                        "evidence_url": run.get("artifact_url") if execution_ok else None,
                        "blockers": blockers, "autonomous_actions_authorized": False})
    return {"generated_at": now.isoformat(), "agent_count": len(records),
            "counts": {level: sum(x["level"] == level for x in records) for level in LEVELS},
            "unknown_evidence_ids": unknown, "agents": records,
            "limitations": ["Evidence references and reviewer claims require independent verification.",
                            "A green CI job or registered script alone does not prove agent operation.",
                            "No autonomous merge, deployment, publication or child-data access is authorized."]}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--registry", type=Path, default=REGISTRY)
    p.add_argument("--evidence", type=Path, default=ROOT / "governance/agent-operational-evidence.json")
    p.add_argument("--output", type=Path, default=ROOT / "artifacts/agents/operational-health.json")
    args = p.parse_args()
    data = report(json.loads(args.registry.read_text(encoding="utf-8")),
                  json.loads(args.evidence.read_text(encoding="utf-8")))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Agent health: {data['agent_count']} registered, {data['counts']}; evidence is not independently authenticated.")

if __name__ == "__main__":
    main()
