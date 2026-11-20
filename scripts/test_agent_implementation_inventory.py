import json
import tempfile
import unittest
from pathlib import Path
from scripts.agent_implementation_inventory import inventory
from scripts.agent_registry import REGISTRY
class ImplementationInventoryTests(unittest.TestCase):
    def test_all_registry_agents_included(self):
        data=json.loads(REGISTRY.read_text(encoding="utf-8"))
        report=inventory(data,REGISTRY.parents[1])
        self.assertEqual(report["total"],len(data["agents"]))
        self.assertTrue(all(not r["execution_verified"] and not r["domain_competence_verified"] for r in report["records"]))
    def test_path_traversal_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            report=inventory({"agents":[{"id":"unsafe","implementation":{"path":"../secret"}}]},Path(tmp))
            self.assertFalse(report["records"][0]["path_exists"])
            self.assertIn("unsafe path outside repository",report["records"][0]["issues"])
    def test_missing_file_not_called_running(self):
        with tempfile.TemporaryDirectory() as tmp:
            report=inventory({"agents":[{"id":"missing","implementation":{"path":"missing.py"}}]},Path(tmp))
            self.assertEqual(report["missing_or_invalid_paths"],1)
