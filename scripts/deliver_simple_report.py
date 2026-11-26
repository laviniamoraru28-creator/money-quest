#!/usr/bin/env python3
"""Generic "deliver this run's report to one stable GitHub issue" helper,
for agent workflows whose findings don't (yet) carry a stable per-finding
id - see agent_issue_reporting.upsert_simple_report for what "stable"
means here (one issue per report_key, updated in place, never a fresh
issue per run). Used by education-guardians.yml, journey-improvement-
agents.yml, specialist-agents.yml and parent-copywriting.yml in place of
their old direct `gh issue create --title "... $RUN_ID"` call.

Usage: python3 scripts/deliver_simple_report.py --report-key KEY --title
TITLE --body-file FILE [--claude-instruction TEXT]
Requires GH_TOKEN/GH_REPO in the environment (same as the old inline calls).
"""
import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agent_issue_reporting as air  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--report-key", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--body-file", required=True)
    parser.add_argument("--claude-instruction", default="")
    args = parser.parse_args()

    body = Path(args.body_file).read_text(encoding="utf-8")
    ref, action = air.upsert_simple_report(args.report_key, args.title, body)
    if action == "created" and args.claude_instruction:
        subprocess.run(["gh", "issue", "comment", ref, "--body", args.claude_instruction], check=True)
    print(f"{action}: {ref}")


if __name__ == "__main__":
    main()
