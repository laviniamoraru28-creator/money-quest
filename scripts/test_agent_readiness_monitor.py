"""Tests for evidence-honest readiness monitoring."""
import tempfile
import unittest
from pathlib import Path
from scripts.agent_readiness_monitor import build_report

class ReadinessTests(unittest.TestCase):
    def test_existing_script_is_not_marked_operational(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "scripts").mkdir()
            (root / "scripts" / "ok.py").write_text("value = 1\n", encoding="utf-8")
            registry = {"agents": [{"id":"ok","name":"OK","department":"Quality",
                        "implementation":{"path":"scripts/ok.py"},"operational_status":"unverified"}]}
            result = build_report(registry, root=root)
            self.assertEqual(result["implementation_files_present"], 1)
            self.assertTrue(result["agents"][0]["python_syntax_ok"])
            self.assertFalse(result["agents"][0]["execution_verified"])
            self.assertEqual(result["agents"][0]["operational"], "unverified")

    def test_missing_and_invalid_scripts_are_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "bad.py").write_text("def broken(:\n", encoding="utf-8")
            registry = {"agents": [
                {"id":"missing","name":"Missing","department":"Quality","implementation":{"path":"absent.py"},"operational_status":"unverified"},
                {"id":"bad","name":"Bad","department":"Quality","implementation":{"path":"bad.py"},"operational_status":"unverified"}
            ]}
            result = build_report(registry, root=root)
            self.assertEqual(result["missing_implementations"], ["missing"])
            self.assertEqual(result["syntax_failures"], ["bad"])

if __name__ == "__main__":
    unittest.main()
