import unittest
from scripts.education_qualitative_pack import compare

class QualitativePackTests(unittest.TestCase):
    def test_preserves_real_objective_and_pointer(self):
        data={"curriculum":{"explorer-saving-l1":{"title":"Save","learningObjective":"Keep money","interactiveActivity":"Add a coin","quiz":{"question":"What is saving?"}}}}
        pack=compare(data,["saving-l1"])
        self.assertEqual(pack[0]["bands"][0]["objective"],"Keep money")
        self.assertEqual(pack[0]["bands"][0]["source_pointer"],"/curriculum/explorer-saving-l1")
        self.assertEqual(pack[0]["verdict"],"not_assessed")
        self.assertIn("missing_age_band_record",pack[0]["flags"])

    def test_identical_activity_is_review_flag_not_defect(self):
        data={"curriculum":{f"{b}-x":{"learningObjective":b,"interactiveActivity":"Tap the coin"} for b in ("explorer","builder","strategist")}}
        pack=compare(data)
        self.assertIn("identical_activities_review",pack[0]["flags"])
        self.assertEqual(pack[0]["verdict"],"not_assessed")

    def test_does_not_invent_missing_topic(self):
        self.assertEqual(compare({"curriculum":{}},["missing"]),[])

if __name__=="__main__":
    unittest.main()
