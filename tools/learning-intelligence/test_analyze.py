import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("learning", Path(__file__).with_name("analyze.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class LearningIntelligenceTests(unittest.TestCase):
    def test_classify(self):
        self.assertIn("financial-literacy", module.classify("How to teach kids saving money"))
        self.assertEqual(module.classify("unknown topic"), [])
    def test_inventory(self):
        items = module.curriculum_inventory()
        self.assertTrue(any(item["route"] == "/play" for item in items))
        self.assertTrue(any(item["route"] == "/entrepreneur-quest" for item in items))
    def test_missing_data_is_not_fabricated(self):
        with tempfile.TemporaryDirectory() as d:
            report = module.generate(output=d)
            self.assertEqual(report["search_topics"], [])
            self.assertEqual(report["search_console"]["status"], "not_connected")
    def test_csv_import(self):
        with tempfile.TemporaryDirectory() as d:
            file = Path(d) / "queries.csv"
            file.write_text("Top queries,Clicks,Impressions\nsaving money for kids,2,50\n", encoding="utf-8")
            report = module.generate(str(file), str(Path(d) / "out"))
            self.assertEqual(report["search_topics"][0]["impressions"], 50)

if __name__ == "__main__":
    unittest.main()
