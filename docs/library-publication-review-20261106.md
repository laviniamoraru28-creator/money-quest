# Library publication decision, 6 November 2026

This review supersedes the earlier requirement to publish every manuscript and require 140 illustrations before release. The owner explicitly approved publishing only fully illustrated, visually reviewed books.

## Public collection

| Collection | Published | Preserved but hidden |
| --- | ---: | ---: |
| Original illustrated storybooks | 2 | 8 |
| Short reads without complete illustrations | 0 | 8 |
| Illustrated biographies | 10 | 0 |
| Attributed external book recommendations | 12 | 0 |

The Little Compass and the Money Choices has 32 reviewed page illustrations. The Garden Everyone Could Enter has 12. Both retain their original text, chapter questions, navigation, completion state, translated editions, narration, keyboard controls and accessibility preferences. No new illustrations were generated for this release work.

The eight hidden original manuscripts are The Market Town Notebook, Emma and the Picture Plan, The Pause Before the Choice, The Message Max Could Not Send, The Repair Table, The Robot with the Wrong Answer, The Picnic with Eight Tokens and The Kindness Club. All ten original manuscripts, all eight short reads, translations and existing art remain in Git.

The illustration inventory preserves 66 of 140 reviewed mappings. All 44 pages in the public subset have reviewed art, matching source fingerprints and asset hashes. The other 22 mappings belong to archived stories; 74 archived pages still need illustrations. Their completion is not required to publish the two finished books.

## Publication enforcement

- Shelves, dynamic and static Library routes, metadata, sitemap and offline page inventory use the same public subset.
- Hidden story requests return 404. They have no public story-navigation links.
- Opened story pages cannot substitute a cover for missing artwork.
- The strict artwork check validates completeness of published books. Integrity checks still validate all retained mappings and ten biography portraits.
- Public page-by-page journeys cover the two books in nine languages. Source/translation checks retain archived manuscripts without rendering them as public stories.

## Other release work

Reused the existing PR #14 fix for untranslated Play-level guidance and world-map links. It supplies the selected locale and existing translated guide/navigation labels; it does not create a second navigation system. New browser coverage exercises both the initial level chooser and the resulting map in all nine languages.

PR #39's recovered-source inventory and private recovery tool are retained. This does not complete the 27 paid Activity Pack PDFs. Their commercial readiness remains false. The existing completed journal, certificates, Parent Guide bonus, original Quiet Corner videos, homepage hero and removed picture-learning decision remain unchanged.

Fresh test results and deployment status belong in the release report. This document does not certify hosted payments, SMTP delivery or a Namecheap deployment.
