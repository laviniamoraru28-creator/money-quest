import tempfile
import unittest
from pathlib import Path
from scripts.education_runtime_wiring import inspect, CHECKS

class RuntimeWiringTests(unittest.TestCase):
    def test_missing_source_is_not_a_runtime_defect(self):
        with tempfile.TemporaryDirectory() as tmp:
            checks=inspect(Path(tmp))
            self.assertEqual(len(checks),len(CHECKS))
            self.assertTrue(all(c["status"]=="source_unavailable" for c in checks))

    def test_pattern_reports_line_and_no_runtime_claim(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            path=root/"src/content/catalog.ts"
            path.parent.mkdir(parents=True)
            path.write_text("const x = 1;\nconst a = l.ageBand === ageBand;")
            checks=inspect(root)
            match=next(c for c in checks if c["check"]=="mq_catalog_age_filter")
            self.assertEqual(match["line"],2)
            self.assertFalse(match["verified_runtime"])

    def test_missing_pattern_is_review_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            path=root/"src/content/catalog.ts"
            path.parent.mkdir(parents=True)
            path.write_text("export const x = 1;")
            match=next(c for c in inspect(root) if c["check"]=="mq_catalog_age_filter")
            self.assertEqual(match["status"],"pattern_not_found")

if __name__=="__main__":
    unittest.main()
