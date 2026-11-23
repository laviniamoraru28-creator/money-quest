import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from scripts.offline_agent_runner import plan, execute

class OfflineAgentRunnerTests(unittest.TestCase):
    def test_missing_and_external_are_not_executed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "scripts").mkdir()
            (root / "scripts/growth_agents.py").write_text("# test")
            registry = {"agents": [
                {"id": "search-opportunity-hunter", "implementation": {"path": "scripts/growth_agents.py"}},
                {"id": "seo-technical-guardian", "implementation": {"path": "scripts/growth_agents.py"}},
                {"id": "missing", "implementation": {"path": "scripts/absent.py"}}]}
            states = plan(registry, root)
            self.assertEqual(states["search-opportunity-hunter"]["status"], "awaiting_external_data")
            self.assertEqual(states["seo-technical-guardian"]["status"], "eligible_for_offline_execution")
            self.assertEqual(states["missing"]["status"], "missing_implementation")
            calls = []
            def fake_runner(args, **kwargs):
                calls.append(args)
                return SimpleNamespace(returncode=0, stdout="ok", stderr="")
            report = execute(registry, root, root / "artifacts", runner=fake_runner)
            self.assertEqual(len(calls), 1)
            self.assertEqual(report["agents"][0]["run_status"], "not_run")
            self.assertEqual(report["agents"][1]["run_status"], "completed")
            self.assertEqual(report["agents"][2]["run_status"], "not_run")

    def test_failed_run_is_not_certified(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "scripts").mkdir()
            (root / "scripts/language-guardian.py").write_text("# test")
            registry = {"agents": [{"id": "language-guardian", "implementation": {"path": "scripts/language-guardian.py"}}]}
            report = execute(registry, root, root / "artifacts",
                runner=lambda *args, **kwargs: SimpleNamespace(returncode=1, stdout="", stderr="bad"))
            self.assertEqual(report["agents"][0]["run_status"], "failed")
            self.assertEqual(report["agents"][0]["execution_evidence"]["exit_code"], 1)

if __name__ == "__main__":
    unittest.main()
