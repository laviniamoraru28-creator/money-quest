import json
import unittest
from scripts.agent_registry import REGISTRY
from scripts.agent_scorecards import scorecards

class AgentScorecardsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    def test_all_agents_have_scorecard(self):
        result=scorecards(self.registry)
        self.assertEqual(result["agent_count"],len(self.registry["agents"]))
        self.assertEqual(len({s["id"] for s in result["scorecards"]}),result["agent_count"])
    def test_no_fake_metrics(self):
        result=scorecards(self.registry)
        self.assertTrue(all(s["precision"] is None and s["recall"] is None and not s["expertise_validated"] for s in result["scorecards"]))
    def test_bad_numeric_evidence_not_trusted(self):
        agent=self.registry["agents"][0]["id"]
        result=scorecards(self.registry,{agent:{"tested_cases":-1,"false_positives":-2,"missed_issues":"unknown"}})
        first=next(s for s in result["scorecards"] if s["id"]==agent)
        self.assertEqual(first["benchmark_cases"],0)
        self.assertIsNone(first["false_positives"])
