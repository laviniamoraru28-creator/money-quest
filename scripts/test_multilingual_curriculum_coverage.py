import unittest
from scripts.multilingual_curriculum_coverage import compare, LOCALES

def sample():
    return {"curriculum":{"explorer-money_basics-l1":{"title":"Money"}},
            "entrepreneurQuest":{"stages":{"find-a-problem":{"title":"Problem"}}},
            "leadershipQuest":{"missions":{"meet-your-team":{"title":"Team"}}}}

class MultilingualCoverageTests(unittest.TestCase):
    def test_complete_locale_record_keys_match(self):
        results=compare({locale:sample() for locale in LOCALES})
        self.assertTrue(all(r["status"]=="record_keys_match" for r in results))

    def test_missing_record_detected(self):
        local=sample()
        local["curriculum"]={}
        results=compare({"en":sample(),"ro":local})
        ro=next(r for r in results if r["locale"]=="ro")
        self.assertEqual(ro["sections"][0]["missing_records"],["explorer-money_basics-l1"])

    def test_missing_locale_is_not_success(self):
        results=compare({"en":sample()})
        self.assertEqual(next(r for r in results if r["locale"]=="de")["status"],"missing_locale")

if __name__=="__main__":
    unittest.main()
