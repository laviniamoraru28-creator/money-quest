import unittest
from scripts.education_content_audit import audit

class ContentAuditTests(unittest.TestCase):
    def test_translation_metadata_gap_not_called_confirmed_defect(self):
        data={"curriculum":{},"entrepreneurQuest":{"stages":{"find-a-problem":{"title":"Find a Problem"}}},
              "leadershipQuest":{"missions":{}}}
        findings=audit(data)
        self.assertEqual(len(findings),1)
        self.assertTrue(all(not f["confirmed_defect"] for f in findings))
        self.assertTrue(all("translation" in f["code"] for f in findings))

    def test_identical_objective_between_bands_is_candidate(self):
        data={"curriculum":{"explorer-saving-l1":{"learningObjective":"Save money","quiz":{"question":"Q"}},
                             "builder-saving-l1":{"learningObjective":"Save money","quiz":{"question":"Q"}},
                             "strategist-saving-l1":{"learningObjective":"Compare savings options","quiz":{"question":"Q"}}}}
        findings=audit(data)
        self.assertTrue(any(f["code"]=="identical_age_band_text" for f in findings))
        self.assertFalse(any(f["code"]=="age_band_record_gap" for f in findings))

    def test_long_intro_is_review_only(self):
        data={"curriculum":{"explorer-x":{"learningObjective":"Recognise","shortIntroduction":"word "*66,"quiz":{"question":"Q"}}}}
        findings=audit(data)
        self.assertTrue(any(f["code"]=="long_intro_review" for f in findings))
        self.assertTrue(all(f["status"]=="human_review_candidate" for f in findings))

if __name__=="__main__":
    unittest.main()
