import importlib.util
import unittest
import urllib.parse
from pathlib import Path

spec = importlib.util.spec_from_file_location("digest", Path(__file__).with_name("agent-coordination-digest.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def make_issue(number, title, created_at="2026-11-17T12:00:00Z"):
    return {"number": number, "title": title, "html_url": f"https://example.invalid/issues/{number}", "created_at": created_at}


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

    def test_empty_input_still_lists_all_four_agents_at_zero(self):
        body = module.build_digest([], generated_at="2026-11-17T13:00:00+00:00")
        for agent, _pattern, _domain in module.AGENT_PATTERNS:
            self.assertIn(f"### {agent} (0 open)", body)
        self.assertNotIn("Unrecognized report-shaped issues", body)
        self.assertIn("0 open report issue(s) across 4 known agents.", body)

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

    def test_never_fabricates_a_fifth_agent(self):
        body = module.build_digest([make_issue(1, "Something completely unrelated")])
        self.assertIn("Unrecognized report-shaped issues", body)
        self.assertIn("#1", body)
        # Still exactly the four declared agents, each explicitly at zero.
        self.assertEqual(body.count("### "), 5)  # 4 agents + 1 "Unrecognized" section


if __name__ == "__main__":
    unittest.main()
