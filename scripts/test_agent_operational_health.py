import unittest
from datetime import datetime, timezone
from scripts.agent_operational_health import report

NOW = datetime(2026, 11, 20, 15, tzinfo=timezone.utc)
REGISTRY = {"agents": [{"id": "learning-architect", "name": "Learning Architect", "department": "Education & Research"}]}

def sample():
    return {"agents": {"learning-architect": {
        "execution": {"run_id": "run-123", "started_at": "2026-11-19T10:00:00Z",
                      "completed_at": "2026-11-19T10:01:00Z", "implementation_ref": "abc123",
                      "artifact_url": "https://example.org/artifact", "result": "success"},
        "validation": {"reviewer": "qualified-reviewer", "reviewed_at": "2026-11-19T11:00:00Z",
                       "benchmark_url": "https://example.org/benchmark", "cases_total": 5,
                       "cases_passed": 5, "false_positives": 0, "missed_issues": 0,
                       "scope_limits_documented": True},
        "impact": {"metric": "verified_errors", "baseline": 10, "after": 6,
                   "measured_at": "2026-11-20T10:00:00Z",
                   "evidence_url": "https://example.org/impact", "reviewer": "reviewer",
                   "direction": "decrease"}}}

class OperationalHealthTests(unittest.TestCase):
    def level(self, evidence):
        return report(REGISTRY, evidence, NOW)["agents"][0]["level"]

    def test_missing_evidence_is_only_configured(self):
        self.assertEqual(self.level({"agents": {}}), "configured")

    def test_execution_only(self):
        e = sample()
        del e["agents"]["learning-architect"]["validation"]
        self.assertEqual(self.level(e), "executed")

    def test_validated_without_impact(self):
        e = sample()
        del e["agents"]["learning-architect"]["impact"]
        self.assertEqual(self.level(e), "validated")

    def test_effective_requires_measured_improvement(self):
        self.assertEqual(self.level(sample()), "effective")
        e = sample()
        e["agents"]["learning-architect"]["impact"]["after"] = 12
        self.assertEqual(self.level(e), "validated")

    def test_failed_run_never_certified(self):
        e = sample()
        e["agents"]["learning-architect"]["execution"]["result"] = "failure"
        self.assertEqual(self.level(e), "configured")

    def test_missing_benchmark_never_validated(self):
        e = sample()
        e["agents"]["learning-architect"]["validation"]["benchmark_url"] = ""
        self.assertEqual(self.level(e), "executed")

    def test_future_run_never_counts(self):
        e = sample()
        e["agents"]["learning-architect"]["execution"]["completed_at"] = "2027-01-01T00:00:00Z"
        self.assertEqual(self.level(e), "configured")

    def test_no_auto_actions(self):
        self.assertFalse(report(REGISTRY, sample(), NOW)["agents"][0]["autonomous_actions_authorized"])

if __name__ == "__main__":
    unittest.main()
