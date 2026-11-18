import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("journey-improvement-agents.py")
spec = importlib.util.spec_from_file_location("journey_agents", MODULE)
ja = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ja)


def src(path, text):
    return (ja.ROOT / "src" / path, text)


class JourneyDetectiveTests(unittest.TestCase):
    def test_flags_disabled_button_for_review(self):
        tsx = '<button disabled={!ready} onClick={go}>Go</button>'
        results = ja.journey([src("app/x.tsx", tsx)])
        self.assertTrue(any(r["title"] == "Review disabled action explanation" for r in results))

    def test_flags_local_storage_usage(self):
        tsx = 'localStorage.setItem("progress", JSON.stringify(state));'
        results = ja.journey([src("components/x.tsx", tsx)])
        self.assertTrue(any(r["title"] == "Review progress persistence" for r in results))

    def test_ignores_files_outside_app_or_components(self):
        # An out-of-scope file alone produces no journey finding from it -
        # the fallback evidence-gap item still fires because there are
        # zero findings overall, not because the file itself was scanned.
        tsx = 'localStorage.setItem("x", "y");'
        results = ja.journey([src("lib/x.ts", tsx)])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["kind"], "evidence-gap")

    def test_reports_evidence_gap_when_nothing_found_rather_than_fabricating(self):
        results = ja.journey([])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["kind"], "evidence-gap")

    def test_caps_at_35_findings(self):
        tsx = "\n".join(f'<button disabled={{!r{i}}}>{i}</button>' for i in range(60))
        results = ja.journey([src("app/x.tsx", tsx)])
        self.assertLessEqual(len(results), 35)


class ExperimentDesignerTests(unittest.TestCase):
    def test_always_includes_guardrail_against_live_child_experiments(self):
        results = ja.experiments([])
        self.assertTrue(any(r["kind"] == "guardrail" for r in results))

    def test_hypothesis_is_tagged_as_hypothesis_not_a_measured_result(self):
        results = ja.experiments([src("app/play/x.tsx", "")])
        hyps = [r for r in results if r["kind"] == "hypothesis"]
        self.assertEqual(len(hyps), 1)
        self.assertIn("hypothesis, not a measured result", hyps[0]["evidence"])


class PrioritizeTests(unittest.TestCase):
    def test_score_is_impact_times_confidence_over_effort(self):
        findings = [ja.item("A", "t", "e", "a", impact=3, confidence=2, effort=2)]
        ranked = ja.prioritize(findings)
        self.assertEqual(ranked[0]["priority_score"], 3.0)

    def test_sorted_descending_by_score(self):
        findings = [
            ja.item("A", "low", "e", "a", impact=1, confidence=1, effort=3),
            ja.item("A", "high", "e", "a", impact=3, confidence=3, effort=1),
        ]
        ranked = ja.prioritize(findings)
        self.assertEqual(ranked[0]["title"], "high")
        self.assertEqual(ranked[1]["title"], "low")


class JsonReportTests(unittest.TestCase):
    def test_report_is_valid_json_with_required_envelope_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "report.json"
            findings = ja.prioritize(ja.experiments([]))
            data = ja.write_json_report(findings, path=str(out))
            reloaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(reloaded, data)
            for field in ("schema_version", "agent", "generated_at", "mode", "findings",
                          "limitations", "claude_auto_activation_verified", "safe_to_auto_merge"):
                self.assertIn(field, reloaded)
            self.assertEqual(reloaded["mode"], "read_only")
            self.assertFalse(reloaded["safe_to_auto_merge"])
            self.assertTrue(all("priority_score" in f for f in reloaded["findings"]))


if __name__ == "__main__":
    unittest.main()
