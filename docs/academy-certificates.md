# Money Quest Academy certificates

Implementation scope: PR #26, building on main b2c9eff and existing certificate branch 5c2c967. No other open PR is included. The only pre-existing certificate implementation was this branch's CSS/print prototype. Main contained the released nine-language site. The initial branch had no associated PR CI run; the existing website quality workflow did not target main PRs. This change enables that workflow for this branch and main.

## Artwork and PDF

The three supplied Meta AI designs are the edit targets for the cleaned Explorer, Builder and Strategist backgrounds in public/certificates. Image editing removed headings, text, book words and badge labels, retaining the academic navy/gold composition, graduation cap, six level-specific illustrations, framed blank name, globe, scroll and MQA seals. These are artwork edits, not CSS approximations. Their native raster size is 1490 × 1055; export to JPEG quality 95 preserves resolution. Text is vector PDF text, independent of the artwork. Font files ship locally with licenses: DejaVu Serif, DejaVu Sans and Allura. Allura must embed without subsetting, because subsetting caused invisible signature glyphs in the rendered PDF despite successful text extraction.

Browser-side pdf-lib/fontkit creates a genuine application/pdf Blob and downloads it through a native download link. No print dialog, account, payment, child name input or progress network request. Only public static assets are fetched. PDF is A4 landscape with the complete artwork inset 5 mm to accommodate home printers. The decorative blank name box remains entirely empty. The automatic institution signature is the text Money Quest. It does not represent a person's signature or outside accreditation. Fonts and PDF chunks are included in the existing offline manifest.

English, Romanian, Spanish, French, German, Italian, Portuguese, Dutch and Polish use the existing next-intl selection. The copy includes title, localized level, achievement message, all six competencies, labels, buttons, error/loading/locked/legacy messages and programme attribution. Fixed branding remains MONEY QUEST ACADEMY and Money Quest Education. Seal branding remains in the artwork.

## Completion and dates

The required activities are exactly the canonical LESSON_STRUCTURES and age-specific GAME_STRUCTURES used by the seven-world catalogue. The automated test compares their IDs directly against getWorldCatalog for every world/band. Optional open-ended labs/discovery spaces are not additional mandatory curriculum gates.

applyActivityCompletion awards a certificate date when the final missing required activity succeeds, only for the selected age band and only once. Neither XP totals nor opening a certificate can award a date. It stores the exact local timestamp including UTC offset, so the original local calendar day survives later timezone changes. Downloads format that stored calendar day using the selected regional locale, never Date.now. Existing awards remain available when switching levels. The existing full reset clears dates with progress. Duplicate completions cannot add rewards or replace dates.

Historical completed progress without a stored date has no recoverable exact completion time. It can download its earned certificate, with a blank date and an explicit localized explanation on the page. It does not invent a historical date or substitute today's date. Storage failure retains the existing session-only architecture; cross-session persistence depends on browser storage being available.

## Validation

- npm run lint, npm run typecheck, npm run test:unit, npm run build, npm run check:multilingual.
- scripts/test-academy-certificates.ts: required curriculum IDs, incomplete/wrong-band eligibility, correct final-activity timestamp, duplicate rewards, level switching/reset, regional dates and 27 actual generated A4 PDF combinations.
- CERTIFICATE_QA_OUTPUT=/absolute/output node --import tsx scripts/test-academy-certificates.ts creates all samples.
- python3 scripts/inspect-certificate-pdfs.py /absolute/output: extracts every title/level/message/competency/label/date/signature, checks Unicode and embedded font streams, empty name box, printable bounds and actual signature raster pixels. It renders all 27 pages for visual inspection.
- e2e/journeys/academy-certificates.spec.ts: real final lesson completion, preserved date, switching/reset, all 27 direct downloads per browser, keyboard operation, selected-language switching, legacy dates, mobile width, runtime errors, no outbound POST, and axe checks. Runs on desktop/mobile Chromium and iPhone/iPad WebKit in CI. These are browser emulations, not physical-device certification.
- The existing package workflow includes all public/certificates assets and compiled PDF code. The extracted-package rehearsal checks all backgrounds/fonts and the Romanian certificate route, plus the existing website/commerce-off checks. No environment files, credentials or paid archives enter the ZIP.

No live Namecheap deployment is performed by this work. Commerce remains under the existing activation gates.
