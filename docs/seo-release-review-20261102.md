# SEO release review, 2 November 2026

Scope: Money Quest website. Separate from navigation PR #11 and commerce PR #12. No deployment or main merge.

## Verified in main
- Six existing article slugs: saving-money-for-kids, budgeting-for-kids, needs-vs-wants, money-games-for-kids, money-worksheets, currency-education.
- Each article has locale-specific prose in `messages/<locale>.json` under `articles.<slug>`; templates provide canonical, hreflang, Open Graph, Article, Breadcrumb and conditional FAQ structured data.
- `src/i18n/config.ts` declares nine active locales; their public activation does **not** certify native editorial review.
- `src/app/sitemap.ts` generates static, discovery and article URLs with language alternates. Before this PR, it claimed every ordinary page was modified today on each build/request. This PR omits unverifiable lastmod for static pages while retaining editorial article dates.

## Content work still required
- [ ] Review all six existing articles in each of nine locales for real activity examples, accurate links, child-age appropriateness, natural grammar and no unsupported outcomes.
- [ ] Add evidence-grounded, useful articles about critical thinking, planning, entrepreneurship, leadership, creativity, digital safety and AI literacy **only where a corresponding real Money Quest activity exists**. Each new article requires actual prose for all active locales, a structure entry, links, review and date.
- [ ] Add appropriate primary sources for general educational statements; avoid claims that Money Quest itself has proven efficacy.
- [ ] Check that metadata descriptions, headings, OG text, FAQ JSON-LD and displayed FAQs agree. Do not assume rich-result eligibility.
- [ ] Validate each language's article content, navigation, alt text and structured data in a rendered build. Avoid invented translation-review signoff.
- [ ] Keep child-related privacy, SEND and psychology claims accurate. Do not advertise therapy, guaranteed improvements or universal accessibility.

## Technical SEO and launch evidence
- [ ] Run lint, typecheck, unit tests, build, sitemap/robots checks and desktop/mobile Playwright on this exact PR head. None are claimed here.
- [ ] Check sitemap and page canonicals/hreflang for every active locale; do not publish unfinished translations merely because locale keys exist.
- [ ] Check /play, checkout, download and other private routes are not accidentally indexable.
- [ ] Verify live HTTP status, redirects, indexability, OG images, structured-data validity and actual production domain after deployment.
- [ ] Submit sitemap in Google Search Console and review indexed/nonindexed URLs, coverage and performance. Requires site owner access and is not proven by code.
- [ ] Review and update editorial `updatedDate` only when article content actually changes.

This PR addresses one verifiable sitemap accuracy issue. It does not claim the SEO content programme, native-language review, search indexing or production tests are complete.
