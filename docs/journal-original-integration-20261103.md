# Historical English-source checkpoint

The current nine-language completion is documented in `journal-pdf-translations-20261103.md`. The sections below preserve the earlier English-source checkpoint and its validation history; its pending-translation statements are superseded.

# Supplied 44-page journal replacement

This replaces the old three-edition, 12-week journal description with the owner's single illustrated, undated 30-day journal. Preserve product ID `adventure-journal`, price £7.99 and existing historical customer contracts. The supplied layout is retained. Page 8 has one verified correction: its 24 savings markers now run consecutively from 1 to 24, replacing the original sequence that skipped six numbers. The other 43 pages render pixel-identically to the supplied original.

## Content and free samples

- Full original: 44 A4 pages. Opening/planning pages 1-13, 30 daily pages 14-43, back cover 44.
- Journal sample: exactly source pages 1, 6 and 14, cover, personal money plan/budget and daily journal. The earlier Library sample used monthly goals instead of the requested budget. The corrected sample is linked from both shop and parent resources.
- Academy sample: the existing three-page sample from PR #27, linked from shop and parent resources. Old sample URLs stay available for compatibility but are no longer promoted on these pages.
- Real journal cover preview, accurate descriptions and explicit English-file sample labels in all nine website languages.
- Removes obsolete claims about three editions, 12 weeks, guaranteed 25 mm margins and included translated/reduced-distraction journals from this product and its sample guidance.

## Private delivery

The complete paid PDF and ZIP are not committed to this public repository. `content/printables/journal-original.json` records the supplied PDF and reproducible private ZIP hashes. Build it outside the repository:

```sh
python3 scripts/prepare-journal-original.py --source /private/path/Money_Quest_Future_Ready_Journal_44_pages.pdf --output-dir /private/path/downloads
```

Use the existing private host installer and immutable order/archive mechanism. Keep historical archives; never replace files used by an accepted order. The source filename is normalized inside the archive only. The private archive contains the corrected PDF. The manifest records both the uncorrected source hash and the corrected file hash. `scripts/correct-journal-savings-labels.py` reproduces the correction from the exact supplied original; repeat builds are byte-identical.

## Remaining work

The original journal contains English text embedded in illustrations. Catalogue translations are complete drafts; translated journal PDFs are not complete. Eight translated editions require page reconstruction, translation and visual review. There is one English source edition, no separate SEND or reduced-distraction edition. The complete illustrated PDF is not tagged for screen-reader access. Sales remain closed (`releaseReady:false`) pending final product and hosted checkout/delivery verification.

Integrated into main through PR #29, including the Academy replacement from PR #27. PR #30 separately integrates the existing website copy and UI corrections. No Stripe account, customer payment, host configuration or Namecheap deployment is changed.

## Validation at this checkpoint

TypeScript, ESLint and all 51 unit suites pass, including nine-language catalogue/parent-page SSR, exact sample page count/A4/hash, existing commerce history/fulfilment checks and the Academy pack tests. The journal private packager produces byte-identical archives and rejects changed source PDFs, overwrites and output inside the repository. The three sample pages render pixel-identically to source pages 1, 6 and 14 and were visually reviewed. Full GitHub browser CI and production hosting checks are separate gates.

## Final integration verification

PR #29 full GitHub CI passes at run 41681210112. PR #30 full GitHub CI passes at run 41681524587. Both are merged into main. The combined main tree plus this private-journal integrity correction passes TypeScript, ESLint, all 51 unit suites and a production build on Node 24.22.1. Production HTTP checks confirm nine localized review-footer links, nine retired Explorer 404s, retained Inclusive Learning, 18 shop/resource pages, both sample responses byte-for-byte, the sitemap and corrected private PDF/ZIP hashes. The correction itself rebuilds deterministically and preserves the other 43 page renders. These checks do not prove hosted merchant configuration, email delivery or a live payment. Translated paid PDFs remain pending and LIVE purchasing remains closed.
