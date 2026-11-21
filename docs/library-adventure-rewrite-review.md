# Library adventure rewrite, editorial review

This branch contains complete English adventure manuscripts for the two published original books in `editorial/library-adventure-rewrites.en.json`.

The manuscripts preserve the existing characters Emma and Max, harbour market, boat with a purple sail, garden reading corner, communication board, access considerations, and the educational learning sequence. There are 8 chapters for the Compass story and 6 for the Garden story, each with four short paragraphs to preserve the canonical source shape. The public reading experience currently selects five chapters per book and shows four paragraphs per page; changing that selection would need separate review.

Important: These manuscripts are **not yet wired into public routes**. The existing nine-language editions, illustrations, quiz feedback, activities and source fingerprint manifests remain untouched. This avoids an English-only public mismatch and translation QA failures.

## Integration steps for Claude

1. Read both manuscripts, the canonical `src/content/original-books.ts` and `src/content/more-original-books.ts`, the artwork manifest `src/content/book-page-art.json`, and original illustration files. Check visual continuity chapter by chapter. Do not regenerate images or replace illustrations.
2. Compare every draft with its original educational idea, quiz, feedback and activity. Keep all original learning outcomes, numerical examples (£6 boat, £4 starting funds, £2 gap, debit card versus cash, contextual needs/wants, advert checking, optional kindness, accessible participation, consent and adult safety checks).
3. Verify the short public edition's selected chapters in `src/lib/i18n/library-presentation.ts` and `src/components/OriginalBookReader.tsx`. If keeping five chapters, ensure a coherent story across selected chapters; if changing, retain tested image mappings.
4. Prepare accurate native translations in RO, ES, FR, DE, IT, PT, NL and PL. Update translation source hashes with the repository's established `sourceFingerprint` function, never by guessing. Verify language-specific titles, questions, narration and no residual English.
5. Only then replace the canonical source paragraphs and titles, keep slugs/URLs stable, update visible titles, descriptions and shelf copy in every language, and run full existing library and E2E tests.
6. Confirm the number of actual displayed pages and user request for a maximum ten-page reading experience, including quizzes and navigation. Do not assume chapter count equals page count.
7. Create a separate implementation PR for review. No merge, deploy or new images without owner approval.

Current artwork hashes are tied to existing source text, so a rewrite may invalidate artwork publication checks even when images remain visually suitable. Review the repository's hashing contract and update source manifests only after inspecting artwork, not by bypassing checks.

Run `python3 scripts/test-library-adventure-drafts.py` for the editorial structure check.
