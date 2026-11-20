import json
import tempfile
import unittest
from pathlib import Path
from scripts.role_capabilities import business_analysis, engineering_review, visual_review, run

class RoleCapabilitiesTests(unittest.TestCase):
    def test_missing_evidence_never_approves(self):
        result = business_analysis({"id": "test"})
        self.assertEqual(result["recommendation"], "needs_evidence")
        self.assertIn("success_metric", result["missing_fields"])

    def test_engineering_requires_existing_scripts(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "package.json").write_text(json.dumps({"scripts": {"lint": "eslint"}}))
            result = engineering_review(root)
            self.assertFalse(result["ready_for_implementation"])
            self.assertFalse(result["checks"]["test:unit"])

    def test_visual_has_no_generated_images(self):
        with tempfile.TemporaryDirectory() as folder:
            result = visual_review(Path(folder))
            self.assertEqual(result["mode"], "read_only")
            self.assertEqual(result["age_bands"], ["explorer", "builder", "strategist"])

    def test_never_auto_merge(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "package.json").write_text(json.dumps({"scripts": {}}))
            self.assertFalse(run(root)["safe_to_auto_merge"])

if __name__ == "__main__":
    unittest.main()
