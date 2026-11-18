import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("education-guardians.py")
spec = importlib.util.spec_from_file_location("education_guardians", MODULE)
eg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eg)


def src(path, text):
    return (eg.ROOT / "src" / path, text)


class InclusiveGuardianTests(unittest.TestCase):
    def test_flags_genuinely_icon_only_button(self):
        tsx = '<button type="button" onClick={go}><TrashIcon /></button>'
        results = eg.inclusive([src("app/x.tsx", tsx)])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Potential icon-only button")

    def test_does_not_flag_icon_with_visible_expression_label(self):
        # Regression: real false positive found in src/components/VisualExplorer.tsx
        # - the icon is followed by a translated {t.listen} text node, which
        # already gives the button an accessible name.
        tsx = '<button type="button"><ActionIcon name="sound" size={30}/>{t.listen}</button>'
        self.assertEqual(eg.inclusive([src("components/x.tsx", tsx)]), [])

    def test_does_not_flag_icon_with_visible_span_label(self):
        # Regression: real false positive found in
        # src/components/real-life-quests/VisualChoiceButton.tsx - the icon
        # is followed by a <span>{label}</span> text node.
        tsx = '<button type="button"><PilotIcon name={icon} /><span className="text-sm">{label}</span></button>'
        self.assertEqual(eg.inclusive([src("components/x.tsx", tsx)]), [])

    def test_aria_label_after_an_arrow_function_is_still_seen(self):
        # Regression: the real bug found in src/components/ui/NavMenu.tsx -
        # a naive [^>]*> tag match stops at the '>' inside onClick={() =>
        # ...}, truncating the tag before it ever reaches aria-label a few
        # attributes later, so the button was wrongly flagged.
        tsx = ('<button\n  type="button"\n  onClick={() => setOpen(true)}\n'
               '  aria-label="Open menu"\n>\n  <ActionIcon name="menu" />\n</button>')
        self.assertEqual(eg.inclusive([src("components/x.tsx", tsx)]), [])

    def test_does_not_flag_icon_with_template_literal_translation_call(self):
        # Regression: real false positive in the real-life-quests mission
        # page - {t(`realLifeQuests.variantLabels.${variant}`)} is a visible
        # text node, but its template literal's ${variant} is itself a
        # nested brace, which an earlier [^{}]+ expression check rejected.
        tsx = '<button type="button"><VariantIcon variant={v} />{t(`x.${v}`)}</button>'
        self.assertEqual(eg.inclusive([src("components/x.tsx", tsx)]), [])

    def test_aria_label_suppresses_the_finding(self):
        tsx = '<button type="button" aria-label="Delete"><TrashIcon /></button>'
        self.assertEqual(eg.inclusive([src("app/x.tsx", tsx)]), [])

    def test_flags_image_missing_alt(self):
        tsx = '<img src="/x.png" />'
        results = eg.inclusive([src("app/x.tsx", tsx)])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Image missing alt attribute")

    def test_does_not_flag_image_with_alt(self):
        tsx = '<img src="/x.png" alt="A coin" />'
        self.assertEqual(eg.inclusive([src("app/x.tsx", tsx)]), [])

    def test_ignores_files_outside_app_or_components(self):
        tsx = '<img src="/x.png" />'
        self.assertEqual(eg.inclusive([src("lib/x.tsx", tsx)]), [])


class ArchitectGuardianTests(unittest.TestCase):
    def test_always_includes_manual_progression_review(self):
        results = eg.architect([])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["severity"], "manual")

    def test_flags_randomized_lesson_flow(self):
        tsx = "const order = shuffle(explorerMissions); // Explorer lesson activity"
        results = eg.architect([src("content/x.ts", tsx)])
        self.assertTrue(any(f["title"] == "Randomized learning flow" for f in results))


class RadarGuardianTests(unittest.TestCase):
    def test_missing_manifest_reports_needs_evidence_not_fabricated_data(self):
        old = eg.ROOT
        try:
            eg.ROOT = Path(tempfile.mkdtemp())
            results = eg.radar()
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["severity"], "needs-evidence")
        finally:
            eg.ROOT = old

    def test_valid_evidence_record_is_review_candidate_not_confirmed(self):
        with tempfile.TemporaryDirectory() as directory:
            old = eg.ROOT
            try:
                eg.ROOT = Path(directory)
                (eg.ROOT / "research").mkdir()
                (eg.ROOT / "research" / "future-skills-evidence.json").write_text(json.dumps([
                    {"title": "T", "url": "https://example.org/x", "published": "2024-01-01",
                     "evidence": "E", "limitation": "L"}
                ]))
                results = eg.radar()
                self.assertEqual(len(results), 1)
                self.assertEqual(results[0]["severity"], "research-to-review")
            finally:
                eg.ROOT = old

    def test_rejects_non_https_source_url(self):
        with tempfile.TemporaryDirectory() as directory:
            old = eg.ROOT
            try:
                eg.ROOT = Path(directory)
                (eg.ROOT / "research").mkdir()
                (eg.ROOT / "research" / "future-skills-evidence.json").write_text(json.dumps([
                    {"title": "T", "url": "http://example.org/x", "published": "2024-01-01",
                     "evidence": "E", "limitation": "L"}
                ]))
                results = eg.radar()
                self.assertEqual(results[0]["severity"], "needs-evidence")
                self.assertEqual(results[0]["title"], "Unverifiable source URL")
            finally:
                eg.ROOT = old


class JsonReportTests(unittest.TestCase):
    def test_report_is_valid_json_and_read_only(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "report.json"
            data = eg.write_json_report([eg.finding("inclusive", "review", "T", "E", "S")], path=str(out))
            reloaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(reloaded, data)
            self.assertEqual(reloaded["mode"], "read_only")
            self.assertFalse(reloaded["safe_to_auto_merge"])


if __name__ == "__main__":
    unittest.main()
