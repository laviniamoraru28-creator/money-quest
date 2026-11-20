import datetime as dt
import unittest
from scripts.agent_registry_live import evaluate, snapshot

NOW = dt.datetime(2026, 11, 20, tzinfo=dt.timezone.utc)

class LiveRegistryTests(unittest.TestCase):
    def test_pr_success_does_not_count_as_operational(self):
        runs = [{"status":"completed","conclusion":"success","event":"pull_request",
                 "created_at":"2026-11-20T09:00:00Z"}]
        self.assertEqual(evaluate(runs, NOW)["status"], "no_verified_operational_run")

    def test_recent_manual_run_counts_only_for_workflow(self):
        runs = [{"status":"completed","conclusion":"success","event":"workflow_dispatch",
                 "created_at":"2026-11-19T09:00:00Z","html_url":"https://github.com/example/run"}]
        self.assertEqual(evaluate(runs, NOW)["status"], "recent_successful_workflow")

    def test_old_run_is_stale(self):
        runs = [{"status":"completed","conclusion":"success","event":"schedule",
                 "created_at":"2026-10-01T09:00:00Z"}]
        self.assertEqual(evaluate(runs, NOW)["status"], "stale_successful_workflow")

    def test_missing_workflow_and_individual_not_verified(self):
        agent = {"id":"a","name":"A","department":"Test","implementation":{"reference_pr":98}}
        report = snapshot({"agents":[agent]}, lambda url: self.fail("Should not fetch unmapped workflow"), NOW)
        self.assertEqual(report["agents"][0]["workflow_evidence"]["status"], "workflow_not_mapped")
        self.assertFalse(report["agents"][0]["individual_agent_execution_verified"])

    def test_404_is_not_success(self):
        import urllib.error
        agent = {"id":"a","name":"A","department":"Test","implementation":{"reference_pr":73}}
        def fail(url):
            raise urllib.error.HTTPError(url,404,"not found",{},None)
        report = snapshot({"agents":[agent]}, fail, NOW)
        self.assertEqual(report["agents"][0]["workflow_evidence"]["status"], "workflow_not_found")

if __name__ == "__main__":
    unittest.main()
