import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("trends_csv", Path(__file__).with_name("trends_csv.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TrendsCSVTests(unittest.TestCase):
    def parse(self, content):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "trends.csv"
            file.write_text(content, encoding="utf-8")
            return mod.parse_csv(file)

    def test_relative_interest_and_suppression(self):
        report = self.parse("Category: All categories\n\nWeek,financial literacy: (United Kingdom),AI education: (United Kingdom)\n2026-11-01,20,<1\n2026-11-08,40,30\n")
        self.assertEqual(report["series"][0]["mean_index"], 30)
        self.assertEqual(report["series"][1]["suppressed_values"], 1)
        self.assertEqual(report["series"][1]["mean_index"], 30)
        self.assertIn("not search volume", report["measurement"])

    def test_invalid_export(self):
        with self.assertRaises(ValueError):
            self.parse("query,clicks\ntest,3\n")

if __name__ == "__main__":
    unittest.main()
