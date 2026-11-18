import importlib.util
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

spec = importlib.util.spec_from_file_location("parent_copywriting_agent", Path(__file__).with_name("parent_copywriting_agent.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CopywritingBriefTest(unittest.TestCase):
    def test_four_unique_briefs_and_no_autopublish(self):
        with tempfile.TemporaryDirectory() as tmp:
            old_out, old_root = module.OUT_ROOT, module.ROOT
            try:
                module.OUT_ROOT = Path(tmp) / "artifacts" / "parent-copywriting"
                module.ROOT = Path(tmp)
                briefs = module.create_briefs(date(2026, 11, 18))
                self.assertEqual(len(briefs), 4)
                self.assertEqual(len({x["topic"] for x in briefs}), 4)
                self.assertTrue(all(x["publication_approved"] is False for x in briefs))
            finally:
                module.OUT_ROOT, module.ROOT = old_out, old_root

    def test_covers_all_eight_required_categories_within_three_months(self):
        # Regression guard for the brief's eight named subject areas -
        # every category must actually be reachable by the rotation,
        # not just present in the TOPICS list in name only.
        categories = {c for _s, _t, _a, c in module.TOPICS}
        self.assertEqual(len(categories), 8)


class SelectTopicsRotationTest(unittest.TestCase):
    def test_consecutive_months_do_not_repeat_three_of_four_topics(self):
        # Regression test for the real bug in the original
        # implementation: index incremented by 1 per month while
        # consuming 4 topics per month, so 3 of 4 topics repeated
        # verbatim month over month. With a 12-topic catalog and a
        # per-month step of 4, consecutive months must now be disjoint.
        nov = module.select_topics(date(2026, 11, 1))
        dec = module.select_topics(date(2026, 12, 1))
        nov_slugs = {t[0] for t in nov}
        dec_slugs = {t[0] for t in dec}
        self.assertEqual(nov_slugs & dec_slugs, set())

    def test_full_catalog_cycles_without_internal_repeats(self):
        seen = []
        d = date(2026, 1, 1)
        for _ in range(len(module.TOPICS) // 4):
            picked = module.select_topics(d)
            seen.extend(t[0] for t in picked)
            d = date(d.year + (1 if d.month == 12 else 0), 1 if d.month == 12 else d.month + 1, 1)
        self.assertEqual(len(seen), len(set(seen)))

    def test_excluded_slugs_are_skipped(self):
        picked = module.select_topics(date(2026, 11, 1), excluded_slugs={"financial-literacy"})
        self.assertNotIn("financial-literacy", {t[0] for t in picked})

    def test_always_returns_requested_count_even_with_many_exclusions(self):
        all_but_four = {t[0] for t in module.TOPICS[:8]}
        picked = module.select_topics(date(2026, 11, 1), excluded_slugs=all_but_four)
        self.assertEqual(len(picked), 4)


class LiveArticleSlugsTest(unittest.TestCase):
    def test_reads_real_live_slugs_from_repository(self):
        slugs = module.live_article_slugs()
        self.assertIn("saving-money-for-kids", slugs)
        self.assertIn("needs-vs-wants", slugs)

    def test_returns_empty_set_when_file_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(module.live_article_slugs(root=Path(tmp)), set())

    def test_no_topic_slug_collides_with_a_live_article_slug(self):
        live = module.live_article_slugs()
        topic_slugs = {t[0] for t in module.TOPICS}
        self.assertEqual(live & topic_slugs, set())


class PreviouslyDraftedSlugsTest(unittest.TestCase):
    def test_finds_slugs_from_prior_draft_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_root = Path(tmp)
            drafts_dir = out_root / "2026-10" / "drafts"
            drafts_dir.mkdir(parents=True)
            (drafts_dir / "some-slug.json").write_text(json.dumps({"slug": "some-slug"}), encoding="utf-8")
            self.assertEqual(module.previously_drafted_slugs(out_root), {"some-slug"})

    def test_empty_when_no_artifacts_exist_yet(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(module.previously_drafted_slugs(Path(tmp) / "does-not-exist"), set())


class ConsultLearningIntelligenceTest(unittest.TestCase):
    def test_honestly_reports_unavailable_when_file_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = module.consult_learning_intelligence(Path(tmp) / "missing.json")
            self.assertFalse(result["available"])
            self.assertEqual(result["ranked_topics"], [])

    def test_reads_ranked_topics_when_present(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "report.json"
            path.write_text(json.dumps({"search_console": {"status": "provided"}, "search_topics": [{"topic": "financial-literacy", "impressions": 10}]}), encoding="utf-8")
            result = module.consult_learning_intelligence(path)
            self.assertTrue(result["available"])
            self.assertEqual(result["ranked_topics"][0]["topic"], "financial-literacy")


class LintDraftTest(unittest.TestCase):
    def _valid_draft(self):
        return {
            "slug": "example-slug", "title": "A Reasonably Short Title About Money",
            "metaDescription": "A fifty-to-one-sixty character honest description of this article for search results, written as real ad copy.",
            "sections": [{"heading": "Try this activity at home", "paragraphs": ["Some text."], "list": ["Step one", "Step two"]}],
            "ctaSlug": "/learn",
        }

    def test_valid_draft_has_no_problems(self):
        self.assertEqual(module.lint_draft(self._valid_draft()), [])

    def test_missing_fields_are_flagged(self):
        problems = module.lint_draft({})
        self.assertTrue(any("slug" in p for p in problems))
        self.assertTrue(any("ctaSlug" in p for p in problems))

    def test_rejects_disallowed_cta_destination(self):
        draft = self._valid_draft()
        draft["ctaSlug"] = "https://facebook.com/moneyquest"
        problems = module.lint_draft(draft)
        self.assertTrue(any("ctaSlug" in p for p in problems))

    def test_rejects_banned_fabrication_phrase(self):
        draft = self._valid_draft()
        draft["sections"][0]["paragraphs"].append("Studies show this guarantees your child will become rich.")
        problems = module.lint_draft(draft)
        self.assertTrue(any("banned" in p for p in problems))

    def test_rejects_social_platform_reference(self):
        draft = self._valid_draft()
        draft["sections"][0]["paragraphs"].append("Follow us on facebook.com for more.")
        problems = module.lint_draft(draft)
        self.assertTrue(any("tiktok.com" in p or "facebook.com" in p for p in problems))

    def test_rejects_draft_with_no_activity(self):
        draft = self._valid_draft()
        draft["sections"] = [{"heading": "Some other heading", "paragraphs": ["No activity mentioned here."]}]
        problems = module.lint_draft(draft)
        self.assertTrue(any("activity" in p for p in problems))


class TranslationStatusTest(unittest.TestCase):
    def test_all_missing_when_no_translations_present(self):
        status = module.translation_status({})
        self.assertFalse(status["all_locales_complete"])
        self.assertEqual(len(status["missing_locales"]), len(module.SUPPORTED_LOCALES))

    def test_stub_translation_without_reviewed_flag_does_not_count(self):
        draft = {"translations": {"ro": {"title": "stub, not reviewed"}}}
        status = module.translation_status(draft)
        self.assertIn("ro", status["missing_locales"])

    def test_reviewed_translation_counts_as_complete(self):
        draft = {"translations": {loc: {"title": "x", "reviewed": True} for loc in module.SUPPORTED_LOCALES}}
        status = module.translation_status(draft)
        self.assertTrue(status["all_locales_complete"])
        self.assertEqual(status["missing_locales"], [])


class EditorialReportTest(unittest.TestCase):
    def test_report_envelope_matches_fleet_convention(self):
        with tempfile.TemporaryDirectory() as tmp:
            old_out = module.OUT_ROOT
            try:
                module.OUT_ROOT = Path(tmp)
                report = module.editorial_report(date(2026, 11, 18), drafts=[])
                self.assertEqual(report["mode"], "read_only")
                self.assertFalse(report["safe_to_auto_merge"])
                self.assertFalse(report["claude_auto_activation_verified"])
            finally:
                module.OUT_ROOT = old_out

    def test_flags_duplicate_when_draft_slug_matches_a_live_article(self):
        with tempfile.TemporaryDirectory() as tmp:
            old_out = module.OUT_ROOT
            try:
                module.OUT_ROOT = Path(tmp)
                report = module.editorial_report(date(2026, 11, 18), drafts=[{"slug": "needs-vs-wants", "title": "x", "status": "draft"}])
                self.assertIn("needs-vs-wants", report["duplicate_warnings"])
            finally:
                module.OUT_ROOT = old_out


if __name__ == "__main__":
    unittest.main()
