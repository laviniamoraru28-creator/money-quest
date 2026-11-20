import unittest
from scripts.quality_improvement import build_report,normalize
class QualityImprovementTests(unittest.TestCase):
    def setUp(self):
        self.base={"source":"curriculum-audit","source_pointer":"/curriculum/explorer-money","code":"objective_review","domain":"education","severity":"medium","summary":"Review learning objective"}
    def test_candidate_is_not_confirmed(self):
        r=build_report([self.base],{"agents":[{"department":"Education & Research"}]})
        self.assertEqual(r["confirmed_critical_blockers"],0)
        self.assertFalse(r["findings"][0]["release_blocker"])
        self.assertFalse(r["findings"][0]["auto_publish"])
    def test_dedup_and_highest_severity(self):
        r=build_report([self.base,{**self.base,"source":"second-review","severity":"high"}],{"agents":[]})
        self.assertEqual(r["unique_count"],1)
        self.assertEqual(r["findings"][0]["priority"],"P1")
        self.assertEqual(len(r["findings"][0]["sources"]),2)
    def test_confirmed_critical_requires_evidence(self):
        with self.assertRaises(ValueError):
            normalize({**self.base,"status":"confirmed","severity":"critical"})
        r=build_report([{**self.base,"status":"confirmed","severity":"critical","review_evidence":"reviewed by designated human"}],{"agents":[]})
        self.assertEqual(r["confirmed_critical_blockers"],1)
    def test_personal_data_rejected(self):
        with self.assertRaises(ValueError):
            normalize({**self.base,"child_name":"Test Child"})
    def test_invalid_domain_rejected(self):
        with self.assertRaises(ValueError):
            normalize({**self.base,"domain":"unverified"})
