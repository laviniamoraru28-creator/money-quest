import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("language-guardian.py")
spec = importlib.util.spec_from_file_location("language_guardian", MODULE)
lg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lg)


class FlattenTests(unittest.TestCase):
    def test_flattens_nested_namespaces(self):
        value = {"nav": {"home": "Home", "shop": "Shop"}, "title": "Money Quest"}
        self.assertEqual(lg.flatten(value), {"nav.home": "Home", "nav.shop": "Shop", "title": "Money Quest"})

    def test_ignores_non_string_leaves(self):
        self.assertEqual(lg.flatten({"count": 3, "label": "ok"}), {"label": "ok"})


class AuditAgainstRealFilesTests(unittest.TestCase):
    def test_real_repository_messages_have_no_structural_failures(self):
        # Regression guard for the real audit this agent runs in CI: the
        # nine shipped messages/*.json files must at least parse and exist.
        # Content-completeness findings (missing/extra keys, placeholders)
        # are allowed to vary over time and are intentionally not asserted
        # here - that is what the agent itself reports, not a fixed test.
        findings = lg.audit()
        structural = [f for f in findings if f[1] in lg.STRUCTURAL_KINDS]
        self.assertEqual(structural, [], f"Structural failures found: {structural}")


class ExitCodeSeverityTests(unittest.TestCase):
    """Only structural breakage (a missing or unparsable locale file) should
    fail CI. Ordinary translation-completeness findings (missing/extra key,
    empty value, placeholder mismatch) are reported, matching every other
    Money Quest audit agent's advisory-only convention - not a hard failure
    that would block any PR touching messages/** over a single wording gap."""

    def test_only_structural_kinds_are_treated_as_failures(self):
        advisory_only = [("ro", "missing_key", "nav.home", "x"), ("es", "placeholders", "title", "x")]
        self.assertFalse(any(f[1] in lg.STRUCTURAL_KINDS for f in advisory_only))
        structural_present = advisory_only + [("pl", "missing_file", "-", "x")]
        self.assertTrue(any(f[1] in lg.STRUCTURAL_KINDS for f in structural_present))


class JsonReportTests(unittest.TestCase):
    def test_report_is_valid_json_with_required_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "report.json"
            data = lg.write_json_report(
                [("ro", "missing_key", "nav.home", "Translation key missing")], path=str(out)
            )
            reloaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(reloaded, data)
            for field in ("schema_version", "agent", "generated_at", "mode", "findings",
                          "limitations", "claude_auto_activation_verified", "safe_to_auto_merge"):
                self.assertIn(field, reloaded)
            self.assertEqual(reloaded["mode"], "read_only")
            self.assertFalse(reloaded["safe_to_auto_merge"])
            self.assertEqual(reloaded["findings"][0]["severity"], "low")

    def test_structural_finding_is_severity_high(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "report.json"
            data = lg.write_json_report([("pl", "missing_file", "-", "Missing messages file")], path=str(out))
            self.assertEqual(data["findings"][0]["severity"], "high")
            self.assertEqual(data["structural_failures"], 1)


if __name__ == "__main__":
    unittest.main()
