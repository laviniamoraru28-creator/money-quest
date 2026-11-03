# Nine-language journal PDF completion

The journal now has nine actual 44-page PDF editions, not just translated shop descriptions. Each contains the same undated 30-day journal. The English artwork/layout is retained. Eight translations cover 130 source strings, including headings, prompts, table labels, emotions, week labels, small illustration labels and the back cover. Money Quest branding remains unchanged. The original GBP planner units remain; blank amounts are not converted.

## Files and public presentation

- Private customer ZIP: `money-quest-future-ready-journal-multilingual.zip`, nine language folders, one PDF per folder, plus the household-use readme.
- Each public sample contains exactly source pages 1, 6 and 14: cover, personal budget and daily journal.
- Shop and parent resources choose the sample for the active website language. The journal cover preview and its alternative text also follow that language.
- Academy activity samples remain the three supplied English worksheets. Their eight translated full editions are still pending. The journal completion does not mark those activities complete.
- Product ID `adventure-journal`, one-time GBP price £7.99 and accepted historical contracts are preserved. Old source files and historical customer archives must not be removed.

The full PDFs, full translated manuscripts and customer ZIP are not in this public repository. Only the samples, cover previews, checksums, build/verification tools and integration code are committed. The private authoring handoff retains the exact corrected source PDF, all translations and reproduction instructions.

## Reproduction and private installation

Generate an edition outside the public repository with `scripts/build-journal-translations.py`, the corrected owner-supplied source PDF and the private copy JSON. Its source hash guard prevents applying this layout to the wrong journal. Keep full-page QA images outside the repository too. `scripts/verify-journal-translations.py` checks the private complete editions, their text, page bounds, language tags, samples and unchanged art outside translated labels.

Rebuild the verified delivery ZIP from the nine supplied edition PDFs:

```sh
python3 scripts/prepare-journal-multilingual.py --source-dir /private/journal-pdfs --output-dir /private/downloads
```

The source directory may contain the flat build outputs or the nine language folders. Every PDF must match the approved size and SHA-256. The packager refuses changed files, source symlinks outside the selected directory, overwrites and output inside this public repository. The legacy English-only packager now deliberately reproduces `previousEnglishArchive` rather than accidentally using the new multilingual archive name.

Install the new ZIP privately and update the host's approved product/release manifest before deploying the new catalogue for public purchasing. Preserve all older content-addressed archives. Verify the actual hosted checkout, webhook, confirmation email, download, recovery and refund flows before opening real sales. Updating the catalogue does not configure the host or prove an actual payment.

## Checks completed

- All eight translated editions: 44 A4 pages, correct PDF language, all 583 rendered text regions present, no replacement glyphs or out-of-page text, identical prompts across all 30 daily pages.
- All 15 unique page templates in each translated edition were visually reviewed. Automated pixel comparison found no changes outside the translated label regions. English source artwork remains unchanged.
- All nine samples: three A4 pages, their own document language, correct source-page order and pixel-identical correspondence with their full editions.
- Repeated Romanian generation is byte-identical. The customer ZIP rebuild is byte-identical to its manifest. Archive tamper, overwrite, public-output and source-symlink refusal are tested.
- Node 24.22.1 TypeScript, ESLint, all 51 unit suites and production build pass locally. Production HTTP rehearsal confirms 18 localized shop/resource pages, nine matching sample/cover responses and closed checkout without host configuration.

This is AI translation, editorial and visual review, not an independent native-editor or tagged-PDF certification. Small decorative labels retain the scale of the supplied artwork. There is one common journal, not separate age or SEND editions.

## Checkout readiness correction

The journal's product-file readiness flag now reflects the completed nine-language files. The existing live eligibility check previously consulted that flag only for the Academy pack. It now respects an unreleased flag for either product. A regression check verifies that an unreleased journal rejects new LIVE checkout even with otherwise valid configured assets. Existing paid-contract download/fulfilment paths do not depend on the current catalogue readiness flag.

Merchant credentials, private host installation and end-to-end settlement/email/download evidence remain separate from these file checks. No real charge, payment link or hosting deployment is performed by this integration.
