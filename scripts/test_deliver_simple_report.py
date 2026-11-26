import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).with_name("deliver_simple_report.py")
spec = importlib.util.spec_from_file_location("deliver_simple_report", MODULE)
deliver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deliver)


class MainTests(unittest.TestCase):
    def test_creates_and_sends_claude_instruction_on_first_run(self):
        with tempfile.TemporaryDirectory() as directory:
            body_file = Path(directory) / "report.md"
            body_file.write_text("# Report\nsome findings", encoding="utf-8")
            argv = ["prog", "--report-key", "edu", "--title", "Education Guardians report",
                    "--body-file", str(body_file), "--claude-instruction", "@claude review"]
            with patch.object(sys, "argv", argv), \
                 patch.object(deliver.air, "upsert_simple_report", return_value=("https://x/1", "created")), \
                 patch.object(deliver.subprocess, "run") as run:
                deliver.main()
                run.assert_called_once()
                self.assertIn("@claude review", run.call_args.args[0])

    def test_no_claude_ping_when_just_updating_existing_issue(self):
        with tempfile.TemporaryDirectory() as directory:
            body_file = Path(directory) / "report.md"
            body_file.write_text("# Report", encoding="utf-8")
            argv = ["prog", "--report-key", "edu", "--title", "Education Guardians report",
                    "--body-file", str(body_file), "--claude-instruction", "@claude review"]
            with patch.object(sys, "argv", argv), \
                 patch.object(deliver.air, "upsert_simple_report", return_value=("#5", "updated")), \
                 patch.object(deliver.subprocess, "run") as run:
                deliver.main()
                run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
