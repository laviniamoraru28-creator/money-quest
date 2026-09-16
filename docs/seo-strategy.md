# Money Quest — SEO Strategy

## 1. Target audience and what they're actually searching for

Parents, teachers, educators, and families — not children. Every page built for this strategy is written in an adult register, answers a real question an adult would type into a search engine, and is genuinely useful to read even if the reader never signs up for Money Quest. That last point matters: content built only to rank, with no standalone value, is exactly the "thin content" pattern search engines actively penalize and the brief's "no misleading SEO techniques" instruction rules out on its own terms.

## 2. Content architecture: why 7 pages, not 11

The brief listed 11 target topics. Building one page per topic verbatim would have produced several near-duplicate pages competing with each other for the same searches (**keyword cannibalization** — a real, well-documented SEO failure mode, not a hypothetical one) — "financial literacy for kids," "financial education," and "teaching children about money" are close enough in search intent that three separate thin pages would each rank worse than one well-developed page covering all three.

Instead: a **hub-and-spoke** model.

| Page | Covers |
|---|---|
| `/learn` (hub) | financial literacy for kids, financial education, teaching children about money, money lessons for children |
| `/learn/saving-money-for-kids` | saving money for kids |
| `/learn/budgeting-for-kids` | budgeting for kids |
| `/learn/needs-vs-wants` | needs vs wants |
| `/learn/money-games-for-kids` | money games for kids, financial literacy activities |
| `/learn/money-worksheets` | money worksheets |
| `/learn/currency-education` | currency education |

Every one of the 11 requested topics is covered by exactly one page, with no two pages targeting the same primary term. This is a real strategic decision, not a shortcut.

**Scalability**: adding topic #12 means adding one entry to `src/content/articles.ts` (title, description, sections, FAQs, related-article links) — the page template (`src/app/[locale]/learn/[slug]/page.tsx`) is generic and needs no changes. Metadata, structured data, canonical URLs, and internal links are all generated from that one data entry.

## 3. Metadata, titles, descriptions

Every page (hub and every article) has a unique `<title>` and meta description written as real ad-copy — not a keyword list — via `generateMetadata()`. `scripts/test-seo-content.ts` checks every title is under the length search results typically display without truncation, and every description falls in the recommended 50-160 character range — checked mechanically, not eyeballed per page.

## 4. Structured data (JSON-LD)

| Schema | Where | Built from |
|---|---|---|
| `Article` | Every `/learn/[slug]` page | The article's own real title, dates, audience |
| `BreadcrumbList` | Hub + every article page | The same breadcrumb trail rendered visibly on the page |
| `FAQPage` | Only articles with a real, visible FAQ section | The article's own `faqs` array — `buildFaqSchema()` returns `null` (no schema at all) for an article with none, never a fabricated one |
| `Organization` | The `/learn` hub | Site identity only |

The core principle, stated in `structured-data.ts`'s own doc comment: every schema object describes something a human visitor can actually see on the same page. `FAQPage` schema specifically is only built when `article.faqs.length > 0` — never added speculatively to try to win a rich-result snippet for a page that doesn't really have an FAQ.

## 5. Sitemap and robots

`src/app/sitemap.ts` and `src/app/robots.ts` use Next.js's native App Router conventions (not a hand-rolled XML string), so they're generated automatically at the correct `/sitemap.xml` and `/robots.txt` paths.

- **Sitemap** includes every public page (landing, `/learn` hub, every article, `/privacy`, `/contact`) x every one of the 9 supported locales, each entry carrying a full set of `hreflang` alternates pointing at its sibling in every other locale.
- **Robots** disallows exactly the routes that require sign-in — `/dashboard`, `/world`, `/coach`, `/simulator`, `/map`, `/parent`, `/onboarding`, `/grown-up-gate` — plus `/login`/`/signup` (public but not content-valuable) and `/api/`. This list was checked against `src/middleware.ts`'s own `isProtectedRoute` list and matches it exactly (verified directly, not assumed) — **this is the concrete implementation of "the child application itself does not need to be indexed."**

## 6. Canonical URLs and hreflang

Every page's `generateMetadata()` sets `alternates.canonical` to its own locale-specific URL and `alternates.languages` to the full set of sibling URLs across all 9 locales — the same pattern already established for the root layout during the multilingual build, now extended to the new `/learn` pages specifically.

## 7. Open Graph metadata

Every page sets `openGraph.title`, `.description`, `.url`, `.type` (`article` for spoke pages, `website` for the hub), `.locale`, and `.siteName`, plus a matching `twitter` card block. Honest scope note: no dedicated per-page Open Graph *image* is generated yet (a `next/og` `ImageResponse`-based dynamic image generator is a natural next addition) — the metadata itself is complete; the image is a follow-up.

## 8. Internal linking strategy

Three deliberate link types, expressed as **data**, not hand-placed links buried in prose:

1. **Hub -> every spoke**: the `/learn` page lists and links to all 7 articles.
2. **Spoke -> related spokes**: each article's `relatedSlugs` field (2 per article) drives a "Related reading" section — `scripts/test-seo-content.ts` verifies every one of these links resolves to a real article and that no article links to itself, so this doesn't silently rot into broken links as the catalog grows.
3. **Spoke/hub -> product**: exactly one clear, honest CTA per page into `/signup` — not a repeated or pushy call-to-action, and never claiming something the product doesn't actually do.

The landing page's own nav now links to `/learn`, closing the loop so the marketing content and the product pages reference each other in both directions.

## 9. No misleading SEO techniques — what this means concretely

- No hidden or off-screen text stuffed with keywords.
- No doorway pages (every `/learn` page is genuinely different content, not template-only variations of the same thin page).
- No fabricated structured data (FAQPage only for real FAQs, Article dates are the content's real publish/update dates, never backdated).
- No cloaking — what's sent to a crawler is exactly what a browser renders; there's no separate crawler-only code path anywhere in this codebase.
- The `/learn/money-worksheets` page explicitly states, in its own visible copy, that downloadable worksheet files aren't built yet, rather than implying they are to capture the search term dishonestly.

## 10. Honest gaps

- **Translation**: all `/learn` content is English-only. The routing genuinely works for all 9 locales (a Romanian visitor reaches a real, correctly-canonicalized `/ro/learn/saving-money-for-kids` URL), but `getLocalizedArticle()` currently falls back to English content for every locale — documented in that function's own comment as a deliberate, temporary state, matching exactly how curriculum and game content were handled during the multilingual build (English + Romanian complete, others structurally ready).
- **No OG image generator** yet (§7).
- **No downloadable worksheet files** yet — stated honestly on the worksheets page itself, not hidden.
- **Structured data has not been run through Google's Rich Results Test or Schema.org validator** as part of this build (no network access in this environment) — recommended as a pre-launch verification step.
