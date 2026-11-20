#!/usr/bin/env python3
"""Offline evidence-gated controls for every registered Money Quest agent.
Structural checks are NOT evidence of professional expertise or live operation.
"""
import argparse
import json
from collections import Counter
from pathlib import Path
from scripts.agent_registry import REGISTRY, ROOT

CRITICAL_IDS = {
 "security-sentinel", "privacy-guardian", "ai-cost-controller", "release-guardian",
 "language-guardian", "inclusive-experience-guardian", "learning-architect",
 "parent-copywriting-strategist", "seo-technical-guardian", "research-to-lesson-agent",
}
CATEGORIES = {
 "Quality & Security": ("security", "privacy", "release_safety"),
 "Education & Research": ("pedagogy", "evidence_quality", "inclusion"),
 "Child Experience": ("usability", "accessibility", "child_wellbeing"),
 "Growth & Marketing": ("source_validity", "measurement", "ethical_marketing"),
 "Content & Community": ("editorial_accuracy", "privacy", "moderation"),
 "Technology": ("reliability", "security", "cost_control"),
 "Strategy & Operations": ("traceability", "prioritisation", "approval"),
 "Visual Design": ("readability", "age_appropriateness", "accessibility"),
}
BLOCKED = {"auto_publish", "auto_merge", "auto_deploy", "collect_child_personal_data",
           "modify_payment_settings", "change_ai_spending_cap", "send_external_messages"}
STATUS = {"unverified", "verified_running", "blocked", "inactive"}

def profile(agent):
    dept = agent.get("department", "")
    checks = CATEGORIES.get(dept, ("evidence_quality", "scope_control", "human_review"))
    return {
      "id": agent.get("id"), "name": agent.get("name"),
      "department": dept, "purpose": agent.get("purpose"),
      "priority": "critical" if agent.get("id") in CRITICAL_IDS else "standard",
      "competency_checks": list(checks),
      "evidence_requirements": [
        "reproducible source or test artifact",
        "documented scope and known limitations",
        "dated human-reviewed sample output",
        "false-positive and missed-issue assessment",
      ],
      "allowed_actions": ["read_repository", "create_review_report", "propose_change"],
      "prohibited_without_separate_authorisation": sorted(BLOCKED),
      "claim": "defined review profile, not certified AI expertise",
    }

def evaluate(agent, evidence):
    reasons = []
    if not isinstance(evidence, dict):
        evidence = {}
    if agent.get("operational_status") not in STATUS:
        reasons.append("unknown operational status")
    if agent.get("operational_status") == "verified_running" and not agent.get("last_successful_run"):
        reasons.append("running status lacks dated execution evidence")
    if evidence.get("artifact_path") is None:
        reasons.append("no reproducible evidence artifact")
    if evidence.get("human_reviewed") is not True:
        reasons.append("no human-reviewed output")
    if evidence.get("tested_cases", 0) < 5 or evidence.get("false_positives") is None or evidence.get("missed_issues") is None:
        reasons.append("insufficient scored benchmark and error analysis")
    if evidence.get("scope_limits_documented") is not True:
        reasons.append("missing scope and limitations review")
    if evidence.get("approval_for_publication") is True:
        reasons.append("registry evaluation cannot authorise publication")
    return {
      "id": agent.get("id"),
      "competence_status": "candidate_for_human_validation" if not reasons else "not_validated",
      "blockers": reasons,
      "can_auto_publish": False,
      "can_auto_deploy": False,
      "can_access_child_data": False,
    }

def build(registry, evidence=None):
    agents = registry.get("agents", [])
    if not isinstance(agents, list):
        raise ValueError("agents must be a list")
    ids = [a.get("id") for a in agents]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate agent ids")
    evidence = evidence or {}
    return {
      "schema_version": 1, "scope": "registered agents only",
      "profiles": [profile(a) for a in agents],
      "assessments": [evaluate(a, evidence.get(a.get("id"))) for a in agents],
      "totals": {"agents": len(agents),
                 "departments": dict(sorted(Counter(a.get("department") for a in agents).items())),
                 "validated_experts": 0,
                 "autonomous_publication_grants": 0},
      "limitations": [
        "No LLM invoked and no agent expertise assessed by this script.",
        "No source retrieval, independent citation checking or human credential verification.",
        "All existing operational_status values are preserved; no live execution is inferred.",
        "A candidate status is not an approval to change code or publish.",
      ],
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=REGISTRY)
    parser.add_argument("--evidence", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/agents/competency-audit.json")
    args = parser.parse_args()
    registry = json.loads(args.registry.read_text(encoding="utf-8"))
    evidence = json.loads(args.evidence.read_text(encoding="utf-8")) if args.evidence else {}
    report = build(registry, evidence)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Audited {report['totals']['agents']} registered profiles; none automatically certified or deployed.")

if __name__ == "__main__":
    main()
