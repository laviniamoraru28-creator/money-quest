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
 def test_generate_works_when_out_is_outside_root(self):
  # Regression: generate()'s final print called OUT.relative_to(ROOT),
  # which raised ValueError whenever a caller (like this very test, or
  # any other script importing this module) pointed OUT somewhere not
  # under ROOT - a real bug, not a hypothetical, since it broke this
  # test module's own test_reports_are_read_only_and_no_auto_merge
  # before this fix.
  with tempfile.TemporaryDirectory() as directory:
   old=agents.OUT
   try:
    agents.OUT=Path(directory)
    agents.generate()
   finally: agents.OUT=old

class ImgLoadingRegexTests(unittest.TestCase):
 def test_matches_a_real_img_tag(self):
  # Regression: the original pattern was r"<img\\b" (a literal
  # backslash followed by 'b'), which can never match real JSX since
  # there is no backslash after <img in source - the check could never
  # fire. Confirmed against the real repository before this fix: 0
  # matches even though <img> tags exist in the codebase.
  import re
  self.assertTrue(re.search(r"<img\b", '<img src="/x.png" />'))

class LocaleFindingsTests(unittest.TestCase):
 def test_no_findings_when_all_locales_have_identical_top_level_keys(self):
  files = {"en": {"nav": {}, "home": {}}, "ro": {"nav": {}, "home": {}}}
  with tempfile.TemporaryDirectory() as directory:
   paths = []
   for stem, data in files.items():
    p = Path(directory) / f"{stem}.json"
    p.write_text(json.dumps(data))
    paths.append(p)
   self.assertEqual(agents.locale_findings(paths), [])

 def test_flags_locale_missing_a_top_level_key(self):
  files = {"en": {"nav": "x", "home": "y"}, "ro": {"nav": "x"}}
  with tempfile.TemporaryDirectory() as directory:
   paths = []
   for stem, data in files.items():
    p = Path(directory) / f"{stem}.json"
    p.write_text(json.dumps(data))
    paths.append(p)
   results = agents.locale_findings(paths)
   self.assertEqual(len(results), 1)
   self.assertIn("ro", results[0]["id"])

 def test_flags_invalid_json_as_high_priority(self):
  with tempfile.TemporaryDirectory() as directory:
   p = Path(directory) / "en.json"
   p.write_text("{not valid json")
   results = agents.locale_findings([p])
   self.assertEqual(len(results), 1)
   self.assertEqual(results[0]["priority"], "high")

 def test_no_findings_against_the_real_repository_locales(self):
  real_paths = sorted((agents.ROOT / "messages").glob("*.json"))
  self.assertEqual(len(real_paths), 9)
  self.assertEqual(agents.locale_findings(real_paths), [])

if __name__=="__main__": unittest.main()
