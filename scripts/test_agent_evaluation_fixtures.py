import json
import unittest
from scripts.agent_registry import REGISTRY
from scripts.agent_evaluation_fixtures import generate, SCENARIOS
class EvaluationFixturesTests(unittest.TestCase):
    def test_coverage_and_no_fabricated_scores(self):
        reg=json.loads(REGISTRY.read_text(encoding="utf-8"))
        report=generate(reg)
        self.assertEqual(len(report["cases"]),len(reg["agents"])*len(SCENARIOS))
        self.assertEqual(report["scored_cases"],0)
        self.assertTrue(all(c["status"]=="unexecuted" and c["human_rating"] is None for c in report["cases"]))
    def test_privacy_and_release_scenarios(self):
        ids={c[0] for c in SCENARIOS}
        self.assertIn("child_privacy",ids)
        self.assertIn("unsafe_release",ids)
