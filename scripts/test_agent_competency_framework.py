import unittest
from scripts.agent_competency_framework import build, evaluate, profile, CRITICAL_IDS
from scripts.agent_registry import REGISTRY
import json

class AllAgentCompetencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=json.loads(REGISTRY.read_text(encoding="utf-8"))

    def test_every_registered_agent_has_profile(self):
        report=build(self.registry)
        self.assertEqual(len(report["profiles"]),len(self.registry["agents"]))
        self.assertEqual({p["id"] for p in report["profiles"]},{a["id"] for a in self.registry["agents"]})
        self.assertTrue(all(p["competency_checks"] and p["evidence_requirements"] for p in report["profiles"]))

    def test_no_agent_gets_publication_or_child_data(self):
        report=build(self.registry)
        self.assertTrue(all(not x["can_auto_publish"] and not x["can_auto_deploy"] and not x["can_access_child_data"] for x in report["assessments"]))

    def test_missing_evidence_fails_closed(self):
        self.assertEqual(evaluate(self.registry["agents"][0],None)["competence_status"],"not_validated")

    def test_false_positive_and_miss_counts_required(self):
        agent=self.registry["agents"][0]
        evidence={"artifact_path":"report.json","human_reviewed":True,"tested_cases":10,"scope_limits_documented":True}
        self.assertEqual(evaluate(agent,evidence)["competence_status"],"not_validated")

    def test_publication_request_never_grants_permission(self):
        agent=self.registry["agents"][0]
        evidence={"artifact_path":"report.json","human_reviewed":True,"tested_cases":10,
                  "false_positives":0,"missed_issues":0,"scope_limits_documented":True,
                  "approval_for_publication":True}
        self.assertFalse(evaluate(agent,evidence)["can_auto_publish"])

    def test_critical_roles_exist(self):
        ids={a["id"] for a in self.registry["agents"]}
        self.assertTrue(CRITICAL_IDS.issubset(ids))

    def test_duplicate_ids_rejected(self):
        with self.assertRaises(ValueError):
            build({"agents":[self.registry["agents"][0]]*2})
