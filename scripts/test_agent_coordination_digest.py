import datetime as dt
import importlib.util
import unittest
import urllib.parse
from pathlib import Path

spec = importlib.util.spec_from_file_location("digest", Path(__file__).with_name("agent-coordination-digest.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def make_issue(number, title, created_at="2026-11-17T12:00:00Z"):
    return {"number": number, "title": title, "html_url": f"https://example.invalid/issues/{number}", "created_at": created_at}


def make_run(status="completed", conclusion="success", created_at="2026-11-18T06:10:00Z", html_url="https://example.invalid/runs/1"):
    return {"status": status, "conclusion": conclusion, "created_at": created_at, "html_url": html_url}


class DigestSearchUrlTests(unittest.TestCase):
    def test_url_has_no_raw_space_or_quote_characters(self):
        # Regression test for the actual failure seen in CI run 44092562948:
        # http.client.InvalidURL: URL can't contain control characters
        # (found at least ' ') - the query string was interpolated
        # unencoded. Guards against reintroducing that without needing to
        # mock a live GitHub response.
        url = module.digest_search_url("laviniamoraru28-creator/money-quest")
        query_part = url.split("?q=", 1)[1]
        self.assertNotIn(" ", query_part)
        self.assertNotIn('"', query_part)
        self.assertTrue(url.startswith("https://api.github.com/search/issues?q="))

    def test_url_is_round_trip_decodable_to_the_intended_query(self):
        url = module.digest_search_url("owner/repo")
        decoded = urllib.parse.unquote(url.split("?q=", 1)[1])
        self.assertEqual(decoded, f'repo:owner/repo type:issue state:open in:title "{module.DIGEST_TITLE}"')


class ClassifyTitleTests(unittest.TestCase):
    def test_matches_each_known_agent_automated_title(self):
        self.assertEqual(module.classify_title("Language Guardian: Claude translation review"), "Language Guardian")
        self.assertEqual(module.classify_title("Education Guardians report: 44085326532"), "Education Guardians")
        self.assertEqual(module.classify_title("Journey Improvement Agents report: 44086354433"), "Journey Improvement Agents")
        self.assertEqual(module.classify_title("Learning Intelligence weekly research notes"), "Learning Intelligence")
        self.assertEqual(module.classify_title("Growth Agents report: 44300000000"), "Growth Agents")
        self.assertEqual(module.classify_title("Specialist Agents report: 44300000001"), "Specialist Agents")
        self.assertEqual(module.classify_title("Parent Copywriting Strategist report: 44300000002"), "Parent Copywriting Strategist")

    def test_matches_individual_specialist_and_growth_sub_agent_mentions(self):
        # The 16 specialist / 5 growth sub-agents don't each open their own
        # issue today (one combined issue per workflow run), but a title
        # naming one of them by name - a manual handoff, say - must still
        # resolve to the right group, not fall through to unrecognized.
        self.assertEqual(module.classify_title("SEO Technical Guardian found a missing sitemap"), "Growth Agents")
        self.assertEqual(module.classify_title("Security Sentinel flagged dangerouslySetInnerHTML"), "Specialist Agents")
        self.assertEqual(module.classify_title("Privacy Guardian: localStorage review"), "Specialist Agents")

    def test_matches_parent_copywriting_strategist_regardless_of_connector_spacing(self):
        # Original handoff doc used "Parent Communication & Copywriting
        # Strategist"; the automated workflow's issue titles use the
        # shorter "Parent Copywriting Strategist" - both must resolve.
        self.assertEqual(module.classify_title("Parent Communication & Copywriting Strategist: November briefs"), "Parent Copywriting Strategist")

    def test_matches_real_manually_opened_handoff_titles(self):
        # These are the actual titles of issues #75 and #77 as opened by
        # the repo owner - a different convention from the workflows' own
        # automated "<Agent> report: <run id>" titles. Both must resolve
        # to the right agent, not fall through to "unrecognized".
        self.assertEqual(
            module.classify_title("Claude handoff: Education Guardians MVP report and review"),
            "Education Guardians",
        )
        self.assertEqual(
            module.classify_title("Claude handoff: Journey Detective, Experiment Designer and Improvement Engine"),
            "Journey Improvement Agents",
        )

    def test_unrecognized_title_returns_none(self):
        self.assertIsNone(module.classify_title("Unrelated bug report"))
        self.assertIsNone(module.classify_title(""))


class BuildDigestTests(unittest.TestCase):
    def test_groups_by_agent_and_counts(self):
        issues = [
            make_issue(75, "Claude handoff: Education Guardians MVP report and review"),
            make_issue(77, "Journey Improvement Agents report: 1"),
            make_issue(90, "Education Guardians report: 2"),
        ]
        body = module.build_digest(issues, generated_at="2026-11-17T13:00:00+00:00")
        # #75 and #90 are both Education Guardians issues (handoff title
        # vs. automated report title) and both must be indexed together.
        self.assertIn("### Education Guardians (2 open)", body)
        self.assertIn("#90", body)
        self.assertIn("#75", body)
        self.assertIn("### Journey Improvement Agents (1 open)", body)
        self.assertIn("#77", body)
        self.assertIn("### Language Guardian (0 open)", body)
        self.assertIn("None open.", body)
        self.assertNotIn("Unrecognized report-shaped issues", body)

    def test_empty_input_still_lists_every_declared_agent_at_zero(self):
        body = module.build_digest([], generated_at="2026-11-17T13:00:00+00:00")
        for agent, _pattern, _domain in module.AGENT_PATTERNS:
            self.assertIn(f"### {agent} (0 open)", body)
        self.assertNotIn("Unrecognized report-shaped issues", body)
        self.assertIn(f"0 open report issue(s) across {len(module.AGENT_PATTERNS)} known agents.", body)

    def test_never_lists_itself_as_unrecognized(self):
        # Regression test: issue #79's first live run listed itself under
        # "Unrecognized report-shaped issues" (its own title matches none
        # of the four agent patterns) - the digest is an index, not a
        # report, and must never appear in its own output.
        issues = [make_issue(79, module.DIGEST_TITLE), make_issue(75, "Claude handoff: Education Guardians MVP report and review")]
        body = module.build_digest(issues)
        self.assertNotIn("Unrecognized report-shaped issues", body)
        self.assertNotIn("#79", body)
        self.assertIn("#75", body)

    def test_never_fabricates_an_undeclared_agent(self):
        body = module.build_digest([make_issue(1, "Something completely unrelated")])
        self.assertIn("Unrecognized report-shaped issues", body)
        self.assertIn("#1", body)
        # Still exactly the declared agents, each explicitly at zero.
        self.assertEqual(body.count("### "), len(module.AGENT_PATTERNS) + 1)  # N agents + 1 "Unrecognized" section


class WorkflowHealthTests(unittest.TestCase):
    NOW = dt.datetime(2026, 11, 18, 12, 0, tzinfo=dt.timezone.utc)

    def test_never_run_when_no_runs_at_all(self):
        state, latest = module.classify_workflow_health([], cadence_days=7, now=self.NOW)
        self.assertEqual(state, "never-run")
        self.assertIsNone(latest)

    def test_pending_when_only_an_in_progress_run_exists(self):
        runs = [make_run(status="in_progress", conclusion=None, created_at="2026-11-18T11:00:00Z")]
        state, latest = module.classify_workflow_health(runs, cadence_days=1, now=self.NOW)
        self.assertEqual(state, "pending")
        self.assertEqual(latest, runs[0])

    def test_failed_when_latest_completed_run_did_not_succeed(self):
        runs = [make_run(conclusion="failure", created_at="2026-11-18T11:00:00Z")]
        state, latest = module.classify_workflow_health(runs, cadence_days=1, now=self.NOW)
        self.assertEqual(state, "failed")
        self.assertEqual(latest["conclusion"], "failure")

    def test_healthy_when_recent_completed_run_succeeded(self):
        runs = [make_run(conclusion="success", created_at="2026-11-18T06:10:00Z")]
        state, _latest = module.classify_workflow_health(runs, cadence_days=1, now=self.NOW)
        self.assertEqual(state, "healthy")

    def test_stale_when_last_success_is_older_than_two_cadences(self):
        # cadence 1 day, stale after 2 days; this run is ~15 days old.
        runs = [make_run(conclusion="success", created_at="2026-11-03T06:10:00Z")]
        state, _latest = module.classify_workflow_health(runs, cadence_days=1, now=self.NOW)
        self.assertEqual(state, "stale")

    def test_weekly_cadence_is_not_stale_a_few_days_after_success(self):
        # cadence 7 days, stale threshold 14 days; this run is 3 days old.
        runs = [make_run(conclusion="success", created_at="2026-11-15T06:10:00Z")]
        state, _latest = module.classify_workflow_health(runs, cadence_days=7, now=self.NOW)
        self.assertEqual(state, "healthy")

    def test_skipped_and_neutral_conclusions_still_count_as_healthy(self):
        for conclusion in ("skipped", "neutral"):
            state, _latest = module.classify_workflow_health(
                [make_run(conclusion=conclusion, created_at="2026-11-18T06:10:00Z")], cadence_days=1, now=self.NOW,
            )
            self.assertEqual(state, "healthy", conclusion)


class DuplicateDetectionTests(unittest.TestCase):
    def test_flags_same_title_twice_within_one_agent(self):
        by_agent = {
            "Language Guardian": [
                make_issue(10, "Language Guardian report: 1"),
                make_issue(12, "Language Guardian report: 1"),
            ],
            "Education Guardians": [make_issue(11, "Education Guardians report: 2")],
        }
        duplicates = module.find_duplicate_reports(by_agent)
        self.assertIn("Language Guardian", duplicates)
        self.assertNotIn("Education Guardians", duplicates)
        [group] = duplicates["Language Guardian"]
        self.assertEqual({issue["number"] for issue in group}, {10, 12})

    def test_case_and_whitespace_insensitive(self):
        by_agent = {"Language Guardian": [
            make_issue(1, "Language Guardian report: 1"),
            make_issue(2, "  language guardian   report: 1 "),
        ]}
        duplicates = module.find_duplicate_reports(by_agent)
        self.assertIn("Language Guardian", duplicates)

    def test_no_false_positive_across_different_titles(self):
        by_agent = {"Language Guardian": [
            make_issue(1, "Language Guardian report: 1"),
            make_issue(2, "Language Guardian report: 2"),
        ]}
        self.assertEqual(module.find_duplicate_reports(by_agent), {})


class BuildDigestHealthAndDuplicateRenderingTests(unittest.TestCase):
    def test_omits_health_section_when_not_provided(self):
        body = module.build_digest([make_issue(75, "Claude handoff: Education Guardians MVP report and review")])
        self.assertNotIn("## Agent execution health", body)

    def test_renders_health_section_with_each_known_workflow(self):
        health = {workflow_file: ("never-run", None) for _agent, workflow_file, _cadence in module.KNOWN_WORKFLOWS}
        health["language-guardian.yml"] = ("failed", make_run(conclusion="failure"))
        body = module.build_digest([], workflow_health=health)
        self.assertIn("## Agent execution health", body)
        self.assertIn("language-guardian.yml", body)
        self.assertIn("last completed run failed", body)
        self.assertIn("never observed running", body)

    def test_renders_duplicate_warning_for_the_affected_agent_only(self):
        issues = [
            make_issue(10, "Language Guardian report: 1"),
            make_issue(12, "Language Guardian report: 1"),
            make_issue(13, "Education Guardians report: 1"),
        ]
        body = module.build_digest(issues)
        guardian_section = body.split("### Language Guardian")[1].split("### Education Guardians")[0]
        education_section = body.split("### Education Guardians")[1]
        self.assertIn("Possible duplicate reports", guardian_section)
        self.assertNotIn("Possible duplicate reports", education_section)


if __name__ == "__main__":
    unittest.main()
