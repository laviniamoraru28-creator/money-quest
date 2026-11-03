# Supplied 44-page journal replacement

This replaces the old three-edition, 12-week journal description with the owner's single illustrated, undated 30-day journal. Preserve product ID `adventure-journal`, price £7.99 and existing historical customer contracts. The source PDF is unchanged.

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

Use the existing private host installer and immutable order/archive mechanism. Keep historical archives; never replace files used by an accepted order. The source filename is normalized inside the archive only. The original PDF bytes remain unchanged.

## Remaining work

The original journal contains English text embedded in illustrations. Catalogue translations are complete drafts; translated journal PDFs are not complete. Eight translated editions require page reconstruction, translation and visual review. There is one English source edition, no separate SEND or reduced-distraction edition. The complete illustrated PDF is not tagged for screen-reader access. Sales remain closed (`releaseReady:false`) pending final product and hosted checkout/delivery verification.

This branch builds on the current PR #27. It retains that branch's Academy replacement and does not merge unrelated Library, currency or UI work. No Stripe account, customer payment, host configuration or Namecheap deployment is changed.

## Validation at this checkpoint

TypeScript, ESLint and all 51 unit suites pass, including nine-language catalogue/parent-page SSR, exact sample page count/A4/hash, existing commerce history/fulfilment checks and the Academy pack tests. The journal private packager produces byte-identical archives and rejects changed source PDFs, overwrites and output inside the repository. The three sample pages render pixel-identically to source pages 1, 6 and 14 and were visually reviewed. Full GitHub browser CI and production hosting checks are separate gates.
