# Explorer comic localized images — incoming, not yet integrated

Raw images the user is sending for Directive 5 (real localized comic images,
replacing the broken ZIP upload), staged here as each language batch arrives.
**Nothing in this folder is wired into the site.** It is source material only,
kept here instead of session scratch space so it survives container resets
across the multiple upload rounds.

Layout: `<lang>/<topic_id>.jpg`, one file per Explorer comic topic:
`money_basics, needs_wants, saving, currencies, scams, long_term_thinking,
giving, digital_money, investing_basics, junior_isa`.

## ro/ — complete (10/10), received 2026-11-15

All 10 topics matched by comparing each image's on-page dialogue against the
already-approved Romanian text in `src/content/explorer-comic-transcripts.ts`.

- First batch of 10 had only 9 unique topics — the 10th file was a duplicate
  render of digital_money's dialogue, not investing_basics. Kept as
  `digital_money_DUPLICATE_not_investing_basics.jpg` for the record; not used.
- The user then sent the correct investing_basics image separately, title
  "Economisirea sau creșterea banilor?" — matches the approved transcript.
  Romanian set is now complete.

## es/ — complete (10/10), received 2026-11-15

All 9 matched uniquely, no duplicates. The user then sent giving separately,
title "La alegría de compartir" — matches the approved transcript. Spanish
set is now complete.

## fr/ — 9 of 10, received 2026-11-15

All 9 matched uniquely, no duplicates.

- **investing_basics is MISSING.** Its approved French title per the
  transcript is "Épargner ou faire grandir son argent" — no image with
  that title/content was sent.

## de/ — 9 of 10, received 2026-11-15

All 9 matched uniquely, no duplicates.

- **investing_basics is MISSING.** Its approved German title per the
  transcript is "Sparen oder dein Geld wachsen lassen" — no image with
  that title/content was sent.

## it/ — 9 of 10, received 2026-11-15

All 9 matched uniquely, no duplicates.

- **investing_basics is MISSING.** Its approved Italian title per the
  transcript is "Risparmiare o far crescere i tuoi soldi" — no image with
  that title/content was sent.

## pt/ — 9 of 10, received 2026-11-15

All 9 matched uniquely, no duplicates.

- **investing_basics is MISSING.** Its approved Portuguese title per the
  transcript is "Poupar ou fazer crescer o teu dinheiro" — no image with
  that title/content was sent.

## nl/ — 9 of 10, received 2026-11-15

10 files sent, but one is a duplicate render of digital_money's dialogue
("Geld dat je niet vast kunt houden"), not investing_basics — same pattern
as the first Romanian batch. Kept as
`digital_money_DUPLICATE_not_investing_basics.jpg`; not used.

- **investing_basics is MISSING.** Its approved Dutch title per the
  transcript is "Sparen of je geld laten groeien" — no image with that
  title/content was sent.

## pl/ — 9 of 10, received 2026-11-15

All 9 matched uniquely, no duplicates.

- **investing_basics is MISSING.** Its approved Polish title per the
  transcript is "Oszczędzanie czy pomnażanie pieniędzy" — no image with
  that title/content was sent.

## Summary across all 9 languages (first pass complete)

| Language | Status |
|---|---|
| ro | 10/10 complete |
| es | 10/10 complete |
| fr | 9/10 — missing investing_basics |
| de | 9/10 — missing investing_basics |
| it | 9/10 — missing investing_basics |
| pt | 9/10 — missing investing_basics |
| nl | 9/10 — missing investing_basics |
| pl | 9/10 — missing investing_basics |

investing_basics is missing in 6 of 9 languages — worth flagging to the
user as likely a systematic gap in whatever process generated the source
images, not 6 independent one-off misses.

## investing_basics follow-up batch — received 2026-11-15

5 of the 6 missing investing_basics images arrived: pl, nl, pt, it, de —
each matched by title/content against the approved transcript and added
to its language folder. Those 5 languages are now 10/10 complete.

- **fr investing_basics is still MISSING.** Approved title: "Épargner ou
  faire grandir son argent".

## Status after this batch

| Language | Status |
|---|---|
| ro | 10/10 complete |
| es | 10/10 complete |
| de | 10/10 complete |
| it | 10/10 complete |
| pt | 10/10 complete |
| nl | 10/10 complete |
| pl | 10/10 complete |
| fr | 9/10 — missing investing_basics only |

8 of 9 languages complete. Only fr/investing_basics remains outstanding.
