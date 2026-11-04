# Library publication cleanup, 4 November 2026

## Result

The public children's story shelf contains one complete illustrated original: **The Little Compass and the Money Choices**, Explorer ages 6–8. It retains all eight chapters and all 32 reading pages. Each reading page has reviewed, context-matched artwork. The cover reuses the first story illustration, with the correct purple sail. Cover images preserve their original aspect ratio.

Nine unfinished original books and eight unillustrated short reads are temporarily unpublished. Their source stories, translations, covers and existing illustrations remain intact. Hidden titles are excluded from shelves, public routes/static parameters, sitemap and offline page lists. Direct requests return 404. The draft translation/presentation functions still support archived material for future development.

Ten illustrated biographies and twelve attributed external-book recommendations remain separate collections. External recommendations do not claim to host the complete books. Parent Toolkit PDFs and the five Meta AI parent-guide images were not imported into storybooks or added to the store. No Parent Toolkit content was published or changed.

## Inventory

| Collection | Found | Public | Temporarily hidden |
| --- | ---: | ---: | ---: |
| Original children's books | 10 | 1 | 9 |
| Short reads | 8 | 0 | 8 |
| External book recommendations | 12 | 12 | 0 |
| Biographies, counted separately | 10 | 10 | 0 |

Thus 30 book/story entries were found, plus ten biographies. There is one complete hosted illustrated storybook; external recommendations are not included in that readiness count.

| Original story | Illustrated reading pages | Publication |
| --- | ---: | --- |
| The Little Compass and the Money Choices | 32/32 | Public |
| The Garden Everyone Could Enter | 3/12 | Hidden |
| The Market Town Notebook | 3/12 | Hidden |
| Emma and the Picture Plan | 3/12 | Hidden |
| The Pause Before the Choice | 2/12 | Hidden |
| The Message Max Could Not Send | 3/12 | Hidden |
| The Repair Table | 3/12 | Hidden |
| The Robot with the Wrong Answer | 3/12 | Hidden |
| The Picnic with Eight Tokens | 2/12 | Hidden |
| The Kindness Club | 3/12 | Hidden |

Across all preserved originals, 57/140 reading pages are mapped to artwork. The archived books retain 25/108 illustrated pages, leaving 83 missing archived illustrations. None of those missing pages is published.

## Artwork reuse and generation

- Reused 24 distinct existing story illustrations in the public book. Its cover reuses one of these assets.
- One previously reviewed supportive-conversation illustration also serves a second, context-matched page about helping and listening. The mapping records `reusedFrom` and an editorial reason; no duplicate binary was created.
- Added seven new final WebP assets for the last two chapters. One generated drawing scene was edited to remove unrelated inset scenes before integration.
- The public story uses 31 distinct page illustrations across 32 reading pages, plus its reused illustrated cover.
- Three generation requests returned output-stage `moderation_blocked` errors. The successful results were preserved. The conversation page uses an existing matching scene; the boat-inspection page uses a dedicated close-up.
- Reviewed all 32 public page associations and the cover for story relevance. Kept the existing friendly 3D style and character identities. One-pound coin counts were visually checked on the four-pound and six-pound payment examples.

## Reader and accessibility

Preserved the existing shelf, book opening/closing, chapters, questions, narration and page-turn controls. Removed the unrelated-world/cover fallback for an opened story page: missing artwork now fails the publication check rather than silently substituting an unrelated image. Added publication tests that enforce reviewed inventory entries and asset hashes.

Book pages use a sage frame and cream paper. Existing night-view styles remain in use. Page-arrival and book-opening animations respect both system Reduced Motion and the website's own motion setting. Covers use `object-contain` and their landscape ratio to avoid cropping.

## Verification

- 50/50 automated unit/validation suites passed.
- `check:library-art` passed for every public page. Archived coverage is reported separately, not claimed complete.
- TypeScript and ESLint passed.
- Production build passed under Node 24.22.1; localized worksheet generation and offline manifest generation completed as existing build steps. No deployment ZIP was created.
- 48/48 Chromium browser tests passed on desktop and Pixel 7 mobile emulation. This includes 18 full-public-book journeys: all 32 pages in every one of nine locales on both layouts, translated text/image association, non-overflowing layout, keyboard page turn, next/previous boundaries, opening/closing with focus return, night-view controls and Reduced Motion. Existing chapter feedback, saved completion, blocked storage, English narration and ten biography journeys also passed on both layouts.
- Narration tests use deterministic Web Speech stubs to verify language tags and Listen/Stop behavior. They do not certify the audible quality or availability of installed device voices.
- Screenshots were inspected for desktop reading layout and mobile night view. A further targeted public-book browser run verifies the final uncropped-cover adjustment.
- Translation coverage, source fingerprints, paragraph counts and rendered content were checked in all nine languages. This is not a claim of native-speaker editorial certification.

## Remaining work and boundaries

The public storybook has no missing artwork. Expanding toward five to eight complete books requires finishing and reviewing the archived titles; they are deliberately not exposed now. Physical-device/Safari testing and audible voice quality are not covered by Chromium emulation.

PR #20 was already a draft with conflicts against main at the start of this task. This work stays on `feature/library-visual-localisation-20261102`; no merge, main update, release-branch update or deployment package is included. The PR also contains earlier non-Library changes, which this task does not certify. Claude must reconcile the final production integration separately.
