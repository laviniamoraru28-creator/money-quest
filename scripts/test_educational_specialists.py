import unittest
from scripts.educational_specialists import review, RUBRIC, DOMAIN_CHECKS

class EducationalSpecialistsTests(unittest.TestCase):
    def sample(self, domain="money"):
        return {"id":"lesson1","title":"Saving","domain":domain,"age_band":"explorer",
                "objective":"Choose a saving goal","activity":"Choose between two options",
                "assessment":"Explain one choice","reviewer_notes":"Review required",
                "evidence_sources":[{"url":"https://example.org/research","claim":"Example claim","limitation":"Not verified in this pilot"}],
                "rubric":{key:"pass" for key in RUBRIC},
                "domain_checks":{key:"pass" for key in DOMAIN_CHECKS[domain]}}

    def test_missing_evidence_blocks(self):
        record=self.sample()
        record["evidence_sources"]=[]
        self.assertEqual(review(record)["decision"],"needs_evidence")

    def test_all_four_domains_require_human_review(self):
        for domain in DOMAIN_CHECKS:
            with self.subTest(domain=domain):
                result=review(self.sample(domain))
                self.assertEqual(result["decision"],"human_review_required")
                self.assertFalse(result["safe_to_auto_publish"])

    def test_unchecked_psychology_rubric_blocks(self):
        record=self.sample()
        record["rubric"].pop("emotional_safety")
        self.assertEqual(review(record)["decision"],"needs_evidence")

    def test_no_clinical_assessment(self):
        self.assertFalse(review(self.sample())["clinical_assessment"])

if __name__=="__main__":
    unittest.main()
