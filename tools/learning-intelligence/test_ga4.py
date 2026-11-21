import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

spec = importlib.util.spec_from_file_location("ga4", Path(__file__).with_name("ga4.py"))
ga4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ga4)

class GA4Tests(unittest.TestCase):
    def test_rejects_non_numeric_property_before_auth(self):
        with self.assertRaises(ValueError):
            ga4.fetch_report("{}", "properties/123")
    def test_aggregate_only_metrics(self):
        self.assertEqual(ga4.METRICS, ["sessions", "screenPageViews", "totalUsers"])
        self.assertEqual(ga4.DIMENSION, "pagePath")
    def test_no_user_identifiers_in_source(self):
        source = Path(ga4.__file__).read_text()
        for field in ("userId", "clientId", "userPseudoId", "emailAddress"):
            self.assertNotIn('"' + field + '"', source)

if __name__ == "__main__":
    unittest.main()
