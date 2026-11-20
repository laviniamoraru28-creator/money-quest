import unittest
from scripts.educational_competency_gates import PROFILES, assess, benchmark

class CompetencyGateTests(unittest.TestCase):
    def test_all_five_profiles_have_checks_and_boundaries(self):
        self.assertEqual(set(PROFILES), {"educational_psychology","money","entrepreneurship","leadership","ai"})
        self.assertTrue(all(v["checks"] and v["boundaries"] for v in PROFILES.values()))

    def test_synthetic_benchmark(self):
        result=benchmark()
        self.assertEqual(result["passed"],result["total"])
        self.assertGreaterEqual(result["total"],8)

    def test_empty_record_is_blocked(self):
        self.assertEqual(assess({})["decision"],"blocked")

    def test_no_auto_publication(self):
        self.assertFalse(assess({})["safe_to_auto_publish"])
