import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("deliver_growth_agents_report.py")
spec = importlib.util.spec_from_file_location("deliver_growth_agents_report", MODULE)
deliver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deliver)


class LoadAllFindingsTests(unittest.TestCase):
    def test_combines_findings_from_the_four_generating_agents_not_the_prioritizer(self):
        with tempfile.TemporaryDirectory() as directory:
            reports_dir = Path(directory)
            for agent in deliver.FINDING_GENERATING_AGENTS:
                (reports_dir / f"{agent}.json").write_text(json.dumps(
                    {"findings": [{"id": agent, "title": "t", "priority": "low"}]}), encoding="utf-8")
            (reports_dir / "opportunity-prioritizer.json").write_text(json.dumps(
                {"findings": [{"id": "should-not-appear", "title": "t", "priority": "low"}]}), encoding="utf-8")
            findings = deliver.load_all_findings(reports_dir)
            ids = {f["id"] for f in findings}
            self.assertEqual(ids, set(deliver.FINDING_GENERATING_AGENTS))
            self.assertNotIn("should-not-appear", ids)

    def test_missing_report_file_is_skipped_not_an_error(self):
        with tempfile.TemporaryDirectory() as directory:
            reports_dir = Path(directory)
            (reports_dir / "seo-technical-guardian.json").write_text(
                json.dumps({"findings": []}), encoding="utf-8")
            findings = deliver.load_all_findings(reports_dir)
            self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
