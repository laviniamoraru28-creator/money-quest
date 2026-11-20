import unittest
from scripts.structured_curriculum_bridge import extract

class StructuredCurriculumBridgeTests(unittest.TestCase):
    def test_extracts_real_curriculum_shape(self):
        payload={"curriculum":{"explorer-money_basics-l1":{"title":"What Is Money?","learningObjective":"Recognise money","shortIntroduction":"Coins"}},
                 "entrepreneurQuest":{"stages":{"find-a-problem":{"title":"Find a Problem","learnText":"Find a problem"}}},
                 "leadershipQuest":{"missions":{"meet-your-team":{"title":"Meet Your Team","outro":"Work together"}}}}
        drafts,warnings=extract(payload)
        self.assertEqual(len(drafts),3)
        self.assertEqual(warnings,[])
        self.assertEqual(drafts[0]["age_band"],"explorer")
        self.assertEqual(drafts[1]["domain"],"entrepreneurship")
        self.assertIsNone(drafts[1]["age_band"])
        self.assertEqual(drafts[2]["source_pointer"],"/leadershipQuest/missions/meet-your-team")
        self.assertTrue(all(not d["evidence_sources"] and not d["rubric"] for d in drafts))

    def test_unknown_band_not_assumed(self):
        drafts,warnings=extract({"curriculum":{"unknown-topic":{"title":"X"}}})
        self.assertEqual(drafts,[])
        self.assertIn("unmapped_age_band:unknown-topic",warnings)

    def test_no_ai_quest_invented(self):
        drafts,_=extract({})
        self.assertEqual(drafts,[])

if __name__=="__main__":
    unittest.main()
