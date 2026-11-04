# Academy printable replacement, 3 November 2026

This change replaces the Family Adventure Pack preview and catalogue copy with the three PDFs supplied in the current task. The existing product ID and £5.99 price remain stable. The journal is a separate product and is not replaced.

## What is included

- Explorer, ages 6-8: 20 pages.
- Builder, ages 9-11: 20 pages.
- Strategist, ages 12-14: 20 pages.
- A public three-page English sample, one page from each supplied PDF.
- A public preview from the actual Explorer PDF.
- Accurate product descriptions in EN, RO, ES, FR, DE, IT, PT, NL and PL.
- A private English ZIP containing the three complete supplied PDFs, byte-for-byte unchanged.
- Source and archive hashes in `content/printables/academy-originals.json`.
- Reproducible private packaging via `scripts/prepare-academy-originals.py`.

The complete PDFs are deliberately absent from this public GitHub repository. Only samples, the preview, code and integrity records are committed. Host the paid ZIP using the existing private download directory and payment-verification flow. Do not place it in `public/` or attach it to a public PR/release.

## Translation status

The PDF pages are flattened images. No PDF has selectable text. The English originals are supplied; the other eight PDF language editions are NOT complete. Translating catalogue text is not a translation of a printable. The source manifest records these states separately. Every catalogue language labels this pack's sample as English. Old translated Family Adventure samples are no longer linked by this product.

OCR was attempted on all 60 original images. Small print and decorative lettering generate transcription errors and missing strings, especially in labels and tables. Raw OCR is a workbench aid, not a verified manuscript. Do not make a sale-ready language edition from it without page-by-page correction. Editable source pages, or the same illustrations without text plus the exact source manuscript, would allow faithful replacement of all text without obscuring the artwork.

The eight pending PDF editions require reconstruction and translation of titles, instructions, task labels, tables and illustrated text, followed by visual and activity-answer checks across 480 pages. The family product stays closed for LIVE purchases while `releaseReady` is false. A direct checkout API request also runs `canCheckout`, so the gate applies server-side. Sandbox configuration can use the private English ZIP for rehearsal. Existing paid contract snapshots and historical content-addressed archives remain readable.

## Host handoff

1. Keep the existing journal archive and all historical customer archives.
2. Prepare the Academy English archive outside the source repository with the script above. Its exact hash must match the manifest.
3. Do not activate the Academy multilingual product yet. Eight translated PDF editions are missing.
4. When all editions are finished, create and verify the final private product archive, update the product file, source manifest, descriptions and samples together, then update the private host release manifest. Open LIVE purchasing only after that verification.

The provided PDFs use small physical page boxes with A4 proportions, about 111 x 157 mm. To print on A4, select A4 paper and fit the page to the printable area. Their original embedded artwork is 1312 x 1856 pixels. This integration preserves those original files.

## Overlap review

Main was inspected at `2f517f339f354089accdd0533b720754a92b3566`, with successful CI. PRs #24 and #25 contain printable design/source drafts; they do not contain these supplied illustrated PDFs or their translations. This branch does not merge their different activity manuscripts. Existing certificate integration on main is preserved. No Stripe account, payment, seller contract or hosting settings are changed.
