import importlib.util
import tempfile
import unittest
from datetime import date
from pathlib import Path

spec=importlib.util.spec_from_file_location("parent_copywriting_agent",Path(__file__).with_name("parent_copywriting_agent.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class CopywritingTest(unittest.TestCase):
 def test_four_unique_briefs_and_no_autopublish(self):
  with tempfile.TemporaryDirectory() as tmp:
   old=module.ROOT
   try:
    module.ROOT=Path(tmp)
    briefs=module.create_briefs(date(2026,11,18))
    self.assertEqual(len(briefs),4)
    self.assertEqual(len({x["topic"] for x in briefs}),4)
    self.assertTrue(all(x["publication_approved"] is False for x in briefs))
   finally: module.ROOT=old
if __name__=="__main__": unittest.main()
