import unittest
from scripts.agent_registry import validate, summarize

class RegistryTests(unittest.TestCase):
    def test_duplicate_ids_rejected(self):
        item = {"id":"a","name":"A","department":"X","purpose":"P","implementation":{"path":"x"},"operational_status":"unverified"}
        self.assertTrue(validate({"agents":[item,item]}))

    def test_verified_requires_evidence(self):
        item = {"id":"a","name":"A","department":"X","purpose":"P","implementation":{"path":"x"},"operational_status":"verified_running"}
        self.assertTrue(validate({"agents":[item]}))

    def test_unknown_does_not_claim_live(self):
        item = {"id":"a","name":"A","department":"X","purpose":"P","implementation":{"path":"x"},"operational_status":"unverified"}
        self.assertEqual(validate({"agents":[item]}), [])

if __name__ == "__main__":
    unittest.main()
