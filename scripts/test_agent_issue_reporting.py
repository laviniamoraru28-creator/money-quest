import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).with_name("agent_issue_reporting.py")
spec = importlib.util.spec_from_file_location("agent_issue_reporting", MODULE)
air = importlib.util.module_from_spec(spec)
spec.loader.exec_module(air)


def make_finding(fid, title="t", priority="medium", **extra):
    base = dict(id=fid, title=title, description="d", source="s", evidence="e",
                recommendation="r", priority=priority, confidence="medium")
    base.update(extra)
    return base


class MergeFindingsTests(unittest.TestCase):
    def test_new_finding_starts_unverified_with_first_seen_today(self):
        merged = air.merge_findings({}, [make_finding("a")])
        self.assertEqual(merged["a"]["verification_status"], "unverified")
        self.assertEqual(merged["a"]["first_seen"], air._today())
        self.assertEqual(merged["a"]["last_verified"], air._today())
        self.assertEqual(merged["a"]["miss_count"], 0)

    def test_reproduced_finding_keeps_confirmed_status_and_refreshes_date(self):
        previous = {"a": dict(make_finding("a"), verification_status="confirmed",
                               first_seen="2026-01-01", last_verified="2026-01-01", miss_count=0)}
        merged = air.merge_findings(previous, [make_finding("a")])
        self.assertEqual(merged["a"]["verification_status"], "confirmed")
        self.assertEqual(merged["a"]["first_seen"], "2026-01-01")
        self.assertEqual(merged["a"]["last_verified"], air._today())

    def test_missing_finding_increments_miss_count_without_resolving_immediately(self):
        previous = {"a": dict(make_finding("a"), verification_status="unverified",
                               first_seen="2026-01-01", last_verified="2026-01-01", miss_count=0)}
        merged = air.merge_findings(previous, [])
        self.assertEqual(merged["a"]["miss_count"], 1)
        self.assertEqual(merged["a"]["verification_status"], "unverified")

    def test_missing_finding_auto_resolves_after_threshold_misses(self):
        previous = {"a": dict(make_finding("a"), verification_status="unverified",
                               first_seen="2026-01-01", last_verified="2026-01-01",
                               miss_count=air.AUTO_RESOLVE_AFTER_MISSES - 1)}
        merged = air.merge_findings(previous, [])
        self.assertEqual(merged["a"]["verification_status"], "resolved")
        self.assertIn("did not reproduce", merged["a"]["resolved_reason"])

    def test_resolved_finding_that_stays_absent_is_not_resurrected(self):
        previous = {"a": dict(make_finding("a"), verification_status="resolved", miss_count=5)}
        merged = air.merge_findings(previous, [])
        self.assertIn("a", merged)
        self.assertEqual(merged["a"]["verification_status"], "resolved")

    def test_finding_that_reproduces_after_being_resolved_reopens_as_unverified(self):
        previous = {"a": dict(make_finding("a"), verification_status="resolved",
                               first_seen="2026-01-01", miss_count=5)}
        merged = air.merge_findings(previous, [make_finding("a")])
        self.assertEqual(merged["a"]["verification_status"], "unverified")
        self.assertEqual(merged["a"]["miss_count"], 0)

    def test_false_positive_that_reproduces_also_reopens(self):
        previous = {"a": dict(make_finding("a"), verification_status="false_positive", miss_count=0)}
        merged = air.merge_findings(previous, [make_finding("a")])
        self.assertEqual(merged["a"]["verification_status"], "unverified")


class RenderMarkdownTests(unittest.TestCase):
    def test_separates_open_from_closed_and_sorts_by_priority(self):
        findings = {
            "low1": dict(make_finding("low1", priority="low"), verification_status="unverified",
                          first_seen="2026-01-01", last_verified="2026-01-01"),
            "crit1": dict(make_finding("crit1", priority="critical"), verification_status="unverified",
                          first_seen="2026-01-01", last_verified="2026-01-01"),
            "done1": dict(make_finding("done1", priority="high"), verification_status="resolved",
                           resolved_reason="fixed", first_seen="2026-01-01", last_verified="2026-01-01"),
        }
        text = air.render_findings_markdown(findings)
        self.assertLess(text.index("crit1"), text.index("low1"))
        self.assertIn("Open findings (2)", text)
        self.assertIn("Closed findings (1)", text)
        self.assertIn("done1", text)

    def test_no_open_findings_says_none_open(self):
        text = air.render_findings_markdown({})
        self.assertIn("None open.", text)


class ExtractFindingsJsonTests(unittest.TestCase):
    def test_round_trips_through_rendered_body(self):
        findings = [dict(make_finding("a"), verification_status="confirmed",
                          first_seen="2026-01-01", last_verified="2026-01-01", miss_count=0)]
        with patch.object(air, "find_existing_issue", return_value=(None, None)), \
             patch.object(air, "_run_gh") as run_gh:
            run_gh.return_value = "https://github.com/x/y/issues/1"
            air.upsert_rich_findings_issue("growth-agents", "Growth Agents", findings, "intro", "http://run")
            body = run_gh.call_args_list[0].args[0][-1]
        extracted = air._extract_findings_json(body)
        self.assertEqual(extracted["a"]["verification_status"], "confirmed")

    def test_missing_marker_returns_empty(self):
        self.assertEqual(air._extract_findings_json("no marker here"), {})

    def test_malformed_json_returns_empty_not_raise(self):
        body = "<!-- FINDINGS_JSON\nnot json\n-->"
        self.assertEqual(air._extract_findings_json(body), {})


class UpsertSimpleReportTests(unittest.TestCase):
    def test_creates_when_no_existing_issue(self):
        with patch.object(air, "find_existing_issue", return_value=(None, None)), \
             patch.object(air, "_run_gh") as run_gh:
            run_gh.return_value = "https://github.com/x/y/issues/9"
            url, action = air.upsert_simple_report("edu-guardians", "Education Guardians report", "body text")
            self.assertEqual(action, "created")
            self.assertIn("issue", run_gh.call_args_list[0].args[0])
            self.assertIn("create", run_gh.call_args_list[0].args[0])

    def test_updates_existing_issue_instead_of_creating(self):
        with patch.object(air, "find_existing_issue", return_value=(42, "old body")), \
             patch.object(air, "_run_gh") as run_gh:
            url, action = air.upsert_simple_report("edu-guardians", "Education Guardians report", "new body")
            self.assertEqual(action, "updated")
            self.assertEqual(url, "#42")
            edit_call = run_gh.call_args_list[0].args[0]
            self.assertIn("edit", edit_call)
            self.assertIn("42", edit_call)


class UpsertRichFindingsIssueTests(unittest.TestCase):
    def test_second_run_with_same_finding_updates_not_creates(self):
        first_body = None
        with patch.object(air, "_run_gh") as run_gh:
            run_gh.return_value = "https://github.com/x/y/issues/7"
            with patch.object(air, "find_existing_issue", return_value=(None, None)):
                air.upsert_rich_findings_issue("growth-agents", "Growth Agents", [make_finding("a")], "intro", "url")
            first_body = run_gh.call_args_list[0].args[0][-1]

        with patch.object(air, "find_existing_issue", return_value=(7, first_body)), \
             patch.object(air, "_run_gh") as run_gh2:
            ref, action, merged = air.upsert_rich_findings_issue(
                "growth-agents", "Growth Agents", [make_finding("a")], "intro", "url")
            self.assertEqual(action, "updated")
            self.assertEqual(ref, "#7")
            self.assertEqual(merged["a"]["first_seen"], air._today())

    def test_comment_calls_out_newly_resolved_findings(self):
        # Craft a previous-run body whose finding "a" is one miss away from
        # auto-resolving, so this run's empty findings list pushes it over
        # the threshold - exercises the real round-trip format directly
        # rather than relying on miss_count surviving a "current findings"
        # pass-through (merge_findings always resets miss_count=0 for
        # anything present in the current run, by design).
        previous_state = [dict(make_finding("a"), verification_status="unverified",
                                first_seen="2026-01-01", last_verified="2026-01-01",
                                miss_count=air.AUTO_RESOLVE_AFTER_MISSES - 1)]
        previous_body = f"<!-- FINDINGS_JSON\n{json.dumps(previous_state)}\n-->\n"

        with patch.object(air, "find_existing_issue", return_value=(7, previous_body)), \
             patch.object(air, "_run_gh") as run_gh:
            run_gh.return_value = ""
            air.upsert_rich_findings_issue("growth-agents", "Growth Agents", [], "intro", "url")
            comment_call = run_gh.call_args_list[-1].args[0]
            comment_body = comment_call[-1]
            self.assertIn("auto-resolved", comment_body)


if __name__ == "__main__":
    unittest.main()
