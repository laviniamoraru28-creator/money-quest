import importlib.util
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("experience_lab", Path(__file__).with_name("experience_lab.py"))
lab = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(lab)

class ExperienceLabTests(unittest.TestCase):
    def test_six_distinct_profiles(self):
        self.assertEqual(len(lab.PROFILES), 6)
        self.assertEqual({p["band"] for p in lab.PROFILES.values()}, {"Explorer", "Builder", "Strategist", "cross-band"})
    def test_read_only_and_explicit_limitations(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "src").mkdir()
            results = lab.report(root)
            for report in results.values():
                self.assertFalse(report["automatic_changes_allowed"])
                self.assertFalse(report["browser_interaction_verified"])
                self.assertFalse(report["personal_data_collected"])
    def test_detect_drag_and_create_reports(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            p = root / "src" / "lesson.tsx"
            p.parent.mkdir(parents=True)
            p.write_text('export default function A(){return <div draggable={true}>Move</div>}', encoding="utf-8")
            result = lab.generate(root)
            self.assertTrue(any(x["signal"] == "drag-interaction" for x in result["child"]["candidate_findings"]))
            self.assertTrue((root / "artifacts/experience-lab/innovation.json").exists())
            self.assertTrue((root / "artifacts/experience-lab/child.json").exists())

if __name__ == "__main__":
    unittest.main()
