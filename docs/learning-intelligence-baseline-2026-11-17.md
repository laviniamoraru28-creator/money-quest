# Money Quest Learning Intelligence: verified baseline (2026-11-17)

## Verified findings
- The main-branch navigation registry contains **21 distinct route entries**, not 21 lessons. Source: [src/content/nav-menu-structure.ts](https://github.com/laviniamoraru28-creator/money-quest/blob/main/src/content/nav-menu-structure.ts).
- The website already has a separate quality audit workflow with monthly broad auditing. Source: [.github/workflows/website-quality.yml](https://github.com/laviniamoraru28-creator/money-quest/blob/main/.github/workflows/website-quality.yml).
- The package manifest currently declares Next.js `^15.5.28`. Source: [package.json](https://github.com/laviniamoraru28-creator/money-quest/blob/main/package.json).

## Search demand: not yet measured
No authorized Google Search Console export, Google Trends data, or Google Analytics dataset was available to this MVP. **There is no evidence-based ranking of course demand yet.** The tool must explicitly say so rather than generate fictitious figures.

## Research opportunities to validate, not proven market demand
- Financial education and saving goals: check existing Money Quest lessons first.
- Entrepreneurship and leadership: check existing Quest sections first.
- Digital literacy and AI: inspect Future Skills coverage before proposing anything.
- Emotional learning and inclusion: compare with existing Mind Lab and Inclusive Learning content.

## Next evidence step
Obtain a site-owned Google Search Console Performance > Queries export, or configure a restricted read-only Search Console API integration in a future approved change. Keep raw exports out of GitHub. Analyze impressions as *site search visibility*, not total search volume. Add separate source-dated research evidence before recommending a new course.

## Validation status
Static repository inspection completed. GitHub-hosted unit test result is pending; this document does not assert that the tests passed.
