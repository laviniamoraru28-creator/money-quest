import tempfile
import unittest
from pathlib import Path
from scripts.curriculum_source_inventory import inventory, classify

class CurriculumInventoryTests(unittest.TestCase):
    def test_domain_candidate_not_claimed_verified(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/"src/app/entrepreneur-quest").mkdir(parents=True)
            (root/"src/app/entrepreneur-quest/page.tsx").write_text("export const title = 'Entrepreneur Quest Explorer';")
            result=inventory(root)
            self.assertEqual(result["status"],"inventory_only")
            self.assertEqual(len(result["candidates"]),1)
            item=result["candidates"][0]
            self.assertIn("entrepreneurship",item["domains"])
            self.assertFalse(item["age_band_verified"])
            self.assertFalse(item["objective_verified"])

    def test_missing_src_does_not_invent_lessons(self):
        with tempfile.TemporaryDirectory() as d:
            result=inventory(Path(d))
            self.assertEqual(result["status"],"missing_source")
            self.assertEqual(result["candidates"],[])

    def test_multiple_domains_are_not_forced_to_one(self):
        domains,_=classify("src/app/shared.tsx","Money Quest and Leadership Quest")
        self.assertIn("money",domains)
        self.assertIn("leadership",domains)

if __name__=="__main__":
    unittest.main()
