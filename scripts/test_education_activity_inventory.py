import unittest
from scripts.education_activity_inventory import inventory, game_links

class InventoryTests(unittest.TestCase):
    def test_catalog_game_is_not_claimed_to_implement_prompt(self):
        structures='export const GAME_STRUCTURES = [\n  {\n    key: "needs-or-wants",\n    topicId: "needs_wants",\n    variants: [{ageBand: "builder"}],\n  },\n];'
        data={"curriculum":{"builder-needs_wants-l1":{"interactiveActivity":"Discuss a situation"}}}
        row=inventory(data,structures)[0]
        self.assertEqual(row["same_topic_game_keys"],["needs-or-wants"])
        self.assertEqual(row["relationship_to_games"],"unverified")
        self.assertFalse(row["is_executable_in_lesson_disclosure"])

    def test_no_game_does_not_claim_missing_interactivity_everywhere(self):
        data={"curriculum":{"strategist-saving-l1":{"interactiveActivity":"Compare scenarios"}}}
        row=inventory(data,"export const GAME_STRUCTURES = [];")[0]
        self.assertEqual(row["same_topic_game_keys"],[])
        self.assertEqual(row["activity_category"],"requires_human_classification")

    def test_filters_explorer_and_preserves_source(self):
        data={"curriculum":{"explorer-saving-l1":{"interactiveActivity":"Tap"},
                            "builder-saving-l1":{"interactiveActivity":"Track a goal"}}}
        rows=inventory(data,"")
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["prompt"],"Track a goal")
        self.assertEqual(rows[0]["source_pointer"],"/curriculum/builder-saving-l1/interactiveActivity")

if __name__=="__main__":
    unittest.main()
