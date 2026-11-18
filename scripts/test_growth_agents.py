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

    def test_no_findings_when_sitemap_robots_and_metadata_all_present(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export function generateMetadata(){return {};}")
            write(root, "src/app/sitemap.ts", "")
            write(root, "public/robots.txt", "")
            self.assertEqual(ga.seo_technical_guardian(root), [])


class SearchAndGrowthDirectorTests(unittest.TestCase):
    def test_search_opportunity_hunter_never_fabricates_demand_data(self):
        # No authorized GSC/keyword dataset exists - this agent must always
        # report zero findings rather than inventing search rankings.
        self.assertEqual(ga.search_opportunity_hunter(), [])

    def test_growth_intelligence_director_never_infers_traffic(self):
        self.assertEqual(ga.growth_intelligence_director(), [])


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
            self.assertEqual(findings[0]["status"], "candidate_requires_validation")
            self.assertEqual(findings[0]["priority"], "low")


class OpportunityPrioritizerTests(unittest.TestCase):
    def test_sorts_critical_before_low(self):
        findings = [
            ga.finding("b", "t", "e", "a", priority="low"),
            ga.finding("a", "t", "e", "a", priority="critical"),
        ]
        ordered = ga.opportunity_prioritizer(findings)
        self.assertEqual([f["id"] for f in ordered], ["a", "b"])


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

    def test_main_writes_all_five_agent_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write(root, "src/app/page.tsx", "export default function Page(){return null;}")
            out = root / "artifacts" / "growth-agents"
            summary = ga.main(root=root, out=out)
            self.assertEqual(summary["agents"], 5)
            expected = {"seo-technical-guardian", "search-opportunity-hunter", "first-visit-experience-agent",
                        "growth-intelligence-director", "opportunity-prioritizer"}
            actual = {p.stem for p in out.glob("*.json")}
            self.assertEqual(actual, expected)
            for name in expected:
                data = json.loads((out / f"{name}.json").read_text(encoding="utf-8"))
                self.assertEqual(data["mode"], "read_only")
                self.assertFalse(data["safe_to_auto_merge"])


if __name__ == "__main__":
    unittest.main()
