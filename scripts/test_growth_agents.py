import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("growth_agents.py")
spec = importlib.util.spec_from_file_location("growth_agents", MODULE)
ga = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ga)


def write(root, rel, text=""):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


class SeoTechnicalGuardianTests(unittest.TestCase):
    def test_flags_missing_sitemap_robots_and_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export default function Page(){return null;}")
            findings = ga.seo_technical_guardian(root)
            ids = {f["id"] for f in findings}
            self.assertEqual(ids, {"seo-sitemap-review", "seo-robots-review", "seo-metadata-review"})
            for f in findings:
                for field in ("id", "title", "description", "source", "evidence", "recommendation",
                              "priority", "confidence"):
                    self.assertIn(field, f)

    def test_no_findings_when_sitemap_robots_and_metadata_all_present(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export function generateMetadata(){return {};}")
            write(root, "src/app/sitemap.ts", "")
            write(root, "public/robots.txt", "")
            self.assertEqual(ga.seo_technical_guardian(root), [])


class SearchOpportunityHunterTests(unittest.TestCase):
    def test_not_connected_is_empty_same_as_before(self):
        self.assertEqual(ga.search_opportunity_hunter(None, "not configured"), [])

    def test_connected_with_zero_rows_reports_honest_zero_finding_not_silence(self):
        findings = ga.search_opportunity_hunter([], "Google Search Console export, 2026-01-01 to 2026-01-28")
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["id"], "search-gsc-zero-rows")
        self.assertEqual(findings[0]["confidence"], "high")

    def test_uses_only_real_numbers_from_rows_never_invents_a_ranking(self):
        rows = [{"query": "money quest for kids", "clicks": 1, "impressions": 200}]
        findings = ga.search_opportunity_hunter(rows, "Google Search Console export")
        self.assertEqual(len(findings), 1)
        f = findings[0]
        self.assertIn("200", f["evidence"])
        self.assertIn("1", f["evidence"])
        self.assertIn("money quest for kids", f["description"])
        # Reasonable, general SEO language ("the page ranks") is fine; a
        # specific invented position/rank number would not be.
        self.assertNotRegex(f["description"], r"(?i)(rank|position)\s*#?\d")

    def test_high_ctr_rows_produce_no_low_ctr_findings(self):
        rows = [{"query": "x", "clicks": 40, "impressions": 100}]
        findings = ga.search_opportunity_hunter(rows, "source")
        self.assertEqual([f["id"] for f in findings], ["search-no-low-ctr-signal"])

    def test_low_volume_rows_are_not_flagged_even_with_zero_clicks(self):
        # impressions < 50 - too little volume for the CTR signal to mean anything.
        rows = [{"query": "x", "clicks": 0, "impressions": 3}]
        findings = ga.search_opportunity_hunter(rows, "source")
        self.assertEqual([f["id"] for f in findings], ["search-no-low-ctr-signal"])


class GrowthIntelligenceDirectorTests(unittest.TestCase):
    def test_not_connected_is_empty_same_as_before(self):
        self.assertEqual(ga.growth_intelligence_director(None, "not configured"), [])

    def test_connected_with_zero_rows_reports_honest_zero_finding(self):
        findings = ga.growth_intelligence_director([], "GA4 aggregate report")
        self.assertEqual(findings[0]["id"], "growth-ga4-zero-rows")
        self.assertIn("not actually installed", findings[0]["description"])

    def test_connected_with_real_rows_reports_only_the_real_totals(self):
        rows = [{"page_path": "/learn/a", "sessions": 10, "screenPageViews": 12, "totalUsers": 8},
                {"page_path": "/learn/b", "sessions": 5, "screenPageViews": 6, "totalUsers": 4}]
        findings = ga.growth_intelligence_director(rows, "GA4 aggregate report")
        self.assertEqual(findings[0]["id"], "growth-ga4-aggregate-summary")
        self.assertIn("15 total sessions", findings[0]["evidence"])
        self.assertNotIn("conversion", findings[0]["recommendation"].lower().split("do not infer")[0])


class FirstVisitExperienceAgentTests(unittest.TestCase):
    def test_reports_missing_router_when_no_pages_found(self):
        with tempfile.TemporaryDirectory() as directory:
            findings = ga.first_visit_experience_agent(Path(directory))
            self.assertEqual(findings[0]["id"], "first-visit-routes")

    def test_reports_review_candidate_not_usability_conclusion_when_pages_exist(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export default function Page(){return null;}")
            findings = ga.first_visit_experience_agent(root)
            self.assertEqual(findings[0]["priority"], "low")
            self.assertIn("new-visitor-ux-evaluation-plan.md", findings[0]["recommendation"])


class OpportunityPrioritizerTests(unittest.TestCase):
    def test_sorts_critical_before_low(self):
        findings = [
            ga.finding("b", "t", "d", "s", "e", "r", priority="low"),
            ga.finding("a", "t", "d", "s", "e", "r", priority="critical"),
        ]
        ordered = ga.opportunity_prioritizer(findings)
        self.assertEqual([f["id"] for f in ordered], ["a", "b"])

    def test_tags_rank_but_does_not_duplicate_or_wrap_findings(self):
        findings = [ga.finding("a", "t", "d", "s", "e", "r", priority="high")]
        ordered = ga.opportunity_prioritizer(findings)
        self.assertEqual(ordered[0]["id"], "a")
        self.assertEqual(ordered[0]["priority_rank"], 0)
        self.assertEqual(len(ordered), 1)  # ranked in place, not appended as a second copy


class FetchConnectorGatingTests(unittest.TestCase):
    def test_search_console_not_configured_returns_none_and_explains_why(self):
        rows, note = ga.fetch_search_console_rows(env={})
        self.assertIsNone(rows)
        self.assertIn("not configured", note)

    def test_ga4_not_configured_returns_none_and_explains_why(self):
        rows, note = ga.fetch_ga4_rows(env={})
        self.assertIsNone(rows)
        self.assertIn("not configured", note)


class ReportAndMainTests(unittest.TestCase):
    def test_report_is_valid_json_with_required_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            data = ga.report("x", [], ["l"], now="2026-01-01T00:00:00+00:00", out=out)
            reloaded = json.loads((out / "x.json").read_text(encoding="utf-8"))
            self.assertEqual(reloaded, data)
            for field in ("schema_version", "agent", "generated_at", "mode", "findings",
                          "limitations", "claude_auto_activation_verified", "safe_to_auto_merge"):
                self.assertIn(field, reloaded)
            self.assertEqual(reloaded["mode"], "read_only")
            self.assertFalse(reloaded["safe_to_auto_merge"])

    def test_main_writes_five_reports_with_opportunity_prioritizer_empty_not_duplicated(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export default function Page(){return null;}")
            out = root / "artifacts" / "growth-agents"
            summary = ga.main(root=root, out=out, env={})
            self.assertEqual(summary["agents"], 5)
            expected = {"seo-technical-guardian", "search-opportunity-hunter", "first-visit-experience-agent",
                        "growth-intelligence-director", "opportunity-prioritizer"}
            actual = {p.stem for p in out.glob("*.json")}
            self.assertEqual(actual, expected)
            prioritizer = json.loads((out / "opportunity-prioritizer.json").read_text(encoding="utf-8"))
            self.assertEqual(prioritizer["findings"], [])  # ranks others; generates none of its own
            for name in expected:
                data = json.loads((out / f"{name}.json").read_text(encoding="utf-8"))
                self.assertEqual(data["mode"], "read_only")
                self.assertFalse(data["safe_to_auto_merge"])

    def test_main_reports_not_connected_when_no_env_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export default function Page(){return null;}")
            out = root / "artifacts" / "growth-agents"
            summary = ga.main(root=root, out=out, env={})
            self.assertFalse(summary["connection_status"]["gsc_connected"])
            self.assertFalse(summary["connection_status"]["ga4_connected"])


if __name__ == "__main__":
    unittest.main()
