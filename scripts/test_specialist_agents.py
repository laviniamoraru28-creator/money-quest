import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("specialist_agents.py")
spec = importlib.util.spec_from_file_location("specialist_agents", MODULE)
agents = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agents)

class SpecialistAgentsTest(unittest.TestCase):
 def test_all_expected_agents_present(self):
  self.assertEqual(len(agents.AGENTS),16)
  self.assertEqual(len(set(agents.AGENTS)),16)
 def test_reports_are_read_only_and_no_auto_merge(self):
  with tempfile.TemporaryDirectory() as directory:
   old=agents.OUT
   try:
    agents.OUT=Path(directory)
    agents.generate()
    for name in agents.AGENTS:
     report=json.loads((Path(directory)/(name+".json")).read_text())
     self.assertEqual(report["mode"],"read_only")
     self.assertFalse(report["safe_to_auto_merge"])
     self.assertFalse(report["claude_auto_activation_verified"])
   finally: agents.OUT=old
 def test_data_dependent_agents_disclose_missing_inputs(self):
  self.assertIn("social-growth-scientist",agents.NEEDS_DATA)
  self.assertIn("feedback-intelligence-agent",agents.NEEDS_DATA)
  self.assertIn("research-to-lesson-agent",agents.NEEDS_DATA)

if __name__=="__main__": unittest.main()
