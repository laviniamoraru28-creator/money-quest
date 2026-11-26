# Technical SEO + performance audit, 2026-11-25

Follow-up to `seobility-2026-11-21-audit.md`. Continues its guardrails: no production
deployment from this branch, no DNS/Namecheap changes, no tracking changes, no child data
collection, no claimed score improvement without a fresh measurement.

## 1. The real finding: `<title>`, `<meta name="description">` and canonical/hreflang were
   rendering outside `<head>` on every page

Verified live against `https://moneyquesteducation.com` with a real rendered browser
(Playwright + the same Chromium engine Lighthouse and Google's crawler use — not just a
`curl` of the raw response, which can look fine while the rendered DOM is wrong):

```
https://moneyquesteducation.com/en       -> description parent: BODY   head canonical count: 0
https://moneyquesteducation.com/en/museum -> description parent: BODY   head canonical count: 0
https://moneyquesteducation.com/ro       -> description parent: BODY   head canonical count: 0
```

`document.title` still read correctly (the DOM API falls back to any `<title>` in the
document), which is why this had gone unnoticed — and why the existing Playwright
regression tests (`multilingual-release.spec.ts`, `website-completion.spec.ts`) never
caught it: both used `page.locator('link[rel="canonical"]')` with no `head` scope, which
matches an element anywhere in the document, so the tests kept passing while the tag sat in
the wrong part of the page. Lighthouse's SEO audit does scope to `head`, which is how this
surfaced: `meta-description: 0` on a live Lighthouse run even though the raw HTML (as
`curl` sees it, buffered) clearly contains the tag.

**Root cause**: `src/app/[locale]/layout.tsx` has `generateStaticParams` (one entry per
locale) and an async `generateMetadata`, but never called next-intl's
`setRequestLocale(locale)`. Per next-intl's own static-rendering requirement, without that
call `requestLocale` is resolved via a per-request dynamic API regardless of
`generateStaticParams`, which opts the whole route out of static rendering. Confirmed via
the production response header itself: `Cache-Control: private, no-cache, no-store,
max-age=0, must-revalidate` on every page — the signature of a route that could have been
static but is being dynamically re-rendered per request. Under dynamic rendering, Next's
metadata streaming resolves the title/meta/canonical tags via a Suspense-style boundary
whose content is inserted into the live DOM through fragment parsing (not the main
document parser), so the HTML5 "foster metadata elements into `<head>`" rule never applies
— the tags land as literal children of `<body>` instead.

**Fix**: add `setRequestLocale(locale)` at the top of both `generateMetadata` and the
default layout export in `src/app/[locale]/layout.tsx` — next-intl's documented minimal
integration point. No other file needed to change: the root layout is the single place
every page's locale is resolved.

**Verified fixed**, same method, against a local production build (`npm run build && npm
run start`) with the fix applied:

```
http://localhost:3100/en        -> description parent: HEAD   head canonical count: 1
http://localhost:3100/en/museum -> description parent: HEAD   head canonical count: 1
http://localhost:3100/ro        -> description parent: HEAD   head canonical count: 1
```

Response headers also flipped from dynamic to genuinely static:

| | Before (production, and reproduced on an unfixed local build) | After (same local build, fix applied) |
|---|---|---|
| `Cache-Control` | `private, no-cache, no-store, max-age=0, must-revalidate` | `s-maxage=31536000` |
| `x-nextjs-cache` | _(absent)_ | `HIT` |
| `x-nextjs-prerender` | _(absent)_ | `1` |
| `ETag` | _(absent)_ | present |
| Lighthouse `meta-description` audit | 0 (fail) | 1 (pass) |

This also means every page can now be served from Next's prerendered cache and from a CDN
in front of Namecheap, instead of Node re-rendering React on every single request — a real
server-cost and latency reduction, not just a metadata fix, with no code elsewhere needing
to change.

**Regression guard added**: tightened the existing canonical assertions in
`multilingual-release.spec.ts` and `website-completion.spec.ts` to `head
link[rel="canonical"]` / `head meta[name="description"]` / `head title`, so this exact class
of bug (present but in the wrong part of the document) fails CI next time instead of passing
silently.

**A second, genuine regression this same fix introduced, found via CI and fixed before
merge**: essential-profile CI caught `parent-bonus.spec.ts`'s "unverified or legacy orders do
not expose the parent guide" test failing on both `desktop-chrome` and `mobile-chrome` -
`GET /Little_Minds_Smart_Money_Illustrated.pdf` (a path with no matching file or route,
checking that the bonus PDF isn't directly web-accessible) returned 500 instead of the
expected 404. Reproduced locally and confirmed, by building the commit *before* this fix in a
separate worktree, that this is new: unfixed, the same request cleanly 404s. The server's own
log named the exact cause: `Error: Page changed from static to dynamic at runtime
/Little_Minds_Smart_Money_Illustrated.pdf, reason: headers`, inside next-intl's own
`requestLocale` resolution. Root cause: `/Little_Minds_Smart_Money_Illustrated.pdf` has no
path separator, so it syntactically matches the single-segment `[locale]` route (the
middleware's matcher deliberately excludes `.pdf` paths - see its own comment - so this
request reaches the App Router with no locale pre-validation at all). Before this fix, the
whole route was dynamic anyway, so landing on an unsupported "locale" value just hit this
layout's own `isSupportedLocale` → `notFound()` check cleanly. After making the route
genuinely static, Next attempts to resolve an unlisted param as a static-generation candidate
*before* that check runs, and next-intl's internal locale resolution calling `headers()`
mid-way through trips Next's hard "static→dynamic at runtime" error - a 500, not a graceful
404. Fixed with `export const dynamicParams = false` alongside `generateStaticParams`, which
is also the more correct behavior: an unlisted locale value is now rejected before any render
is attempted at all, rather than relying on this layout's own runtime check to catch it after
the fact. Re-verified: the bonus-PDF request now 404s again, and all 9 real locale routes
still return 200.

## 2. `X-Powered-By` header

Already fixed on the `fix/seobility-audit-2026-11-21` branch (`poweredByHeader: false`),
carried into this branch unchanged. **Still present on production** (`x-powered-by:
Next.js` observed live) because that fix has not been deployed yet — this is a Namecheap
deployment dependency, not a code gap. No LiteSpeed-level configuration is needed on top of
this: `poweredByHeader: false` is a Next.js application-level setting and takes effect as
soon as the rebuilt app is deployed; LiteSpeed's own headers (`server: LiteSpeed`,
`x-turbo-charged-by: LiteSpeed`) are unrelated to Next.js and disclose the edge/web server
rather than the framework — removing those is a hosting-level decision for the owner, not
assumed here.

## 3. Mobile/desktop Core Web Vitals and TTFB — real Lighthouse measurements

Run with `lighthouse@12.8.2` + the pre-installed Chromium, against the real production
homepage first (read-only GETs only, same method the 2026-11-21 audit used — `/en`,
mobile-throttled default preset and `--preset=desktop`):

| | Mobile (production) | Desktop (production) |
|---|---|---|
| Performance | 85 | 99 |
| Accessibility | 100 | 100 |
| SEO | 92 (`meta-description` fail) | — |
| Best Practices | 100 | 100 |
| TTFB | 89 ms | 123 ms |
| LCP | 3.6 s | 0.75 s |
| CLS | 0 | 0 |
| TBT | 247 ms | 3.5 ms |

TTFB itself is already fast on both — the 2026-11-21 audit's 1.64 s "HTML response time"
figure was Seobility's own tool measuring full document download, not server TTFB. Mobile
LCP (3.6 s) and TBT (247 ms) are the two real opportunities Lighthouse flags, both normal
symptoms of the CPU/network throttling Lighthouse's mobile preset simulates on a
JS-framework site, not of anything obviously wrong in this codebase.

Same-hardware, same-build before/after comparison (local `npm run build && npm run start`,
mobile preset, `/en`, fix only changes `src/app/[locale]/layout.tsx`):

| | Before (unfixed) | After (fix applied) |
|---|---|---|
| TTFB | 58 ms | 17.5 ms |
| LCP | 5.1 s | 5.1 s (no measurable change) |
| TBT | 120 ms | 105 ms (no measurable change) |
| SEO: `meta-description` | 0 | 1 |
| SEO: `canonical` | pass | **fails only because the canonical correctly points at
  `https://moneyquesteducation.com/...` while the page is served from `localhost` during
  this test** — a testing artifact, not a real regression; confirmed by the production run
  above (same canonical, no localhost mismatch) already passing before this fix |

LCP/TBT are unaffected by this fix, as expected — it changes caching/metadata, not
client-side rendering cost. The TTFB improvement is real and reproducible; once deployed,
production should go from `meta-description: 0` to passing it (92 → 100 on the SEO
category, since that was the only failing SEO audit on the real production run), plus the
caching benefit in §1.

## 4. Caching, image delivery, video loading, JS, static rendering

- **Static rendering**: fixed in §1 — the single biggest item in this category.
- **Static asset caching**: already excellent, unrelated to the bug above —
  `/_next/static/media/*` serves `Cache-Control: public, max-age=31536000, immutable` with a
  real `ETag`/`Last-Modified`. No change needed.
- **Images**: every `<Image>` in the codebase uses `unoptimized` (confirmed: all 24 image
  call sites). This disables Next's on-demand resizing/format-negotiation server, which also
  means it never runs `sharp` at request time — consistent with the existing, carefully
  reasoned `next.config.mjs` comment about the Namecheap host's 1 GB RAM constraint
  (`experimental.cpus: 1`, `workerThreads: false`, both there specifically because an
  under-provisioned build/runtime OOMs). Every image asset is already a hand-produced
  `.webp` at a sensible fixed size for where it's used, with explicit `width`/`height` to
  avoid layout shift (confirmed: CLS is 0 in every Lighthouse run above). **Not changed**:
  flipping `unoptimized` off would add a per-request image-resizing server process on a host
  already memory-constrained enough to need single-threaded builds — a real risk of
  production OOM for a benefit (automatic resizing) the app doesn't need, since it has no
  user-uploaded or variable-size images. Documenting this as verified-intentional rather
  than silently leaving it unexplained.
- **Video** (`CinematicScene.tsx`): already thorough — respects
  `prefers-reduced-motion`, the Save-Data/`connection.saveData` signal, this app's own focus
  mode and "calm" presentation setting; pauses via `IntersectionObserver` when scrolled out
  of view; `preload="metadata"` (not full eager preload); falls back to a static poster
  image entirely rather than loading any video at all when motion should be reduced. No
  change needed.
- **JS bundle**: 103 kB shared first-load JS across the whole site per the build output —
  reasonable for a Next.js app of this size with next-intl, Zustand-style local state and no
  heavy third-party libraries in the critical path.

## 5. Internal links, anchor text, external links, canonical, hreflang

- Canonical and hreflang: correct in content (absolute URLs, `x-default`, one entry per
  locale) — the only defect was the placement bug fixed in §1, not the content of these
  tags.
- Anchor text: spot-checked across the homepage, world cards, library shelves and book
  reader — every link's accessible name comes from real, specific content (a lesson title, a
  book title, a world name), not a repeated generic phrase like "Learn more" or "Click
  here" (grepped the whole `src/i18n/` and `messages/en.json` for that literal pattern:
  no hits). No changes needed.
- External links: none found hard-coded into page content beyond what the 2026-11-21 audit
  already covered (one reported backlink, not something this app's own code controls).

## 6. Sitemap and robots.txt

Fetched live and checked directly:
- `sitemap.xml`: one `<url>` entry per locale per content page, each carrying a full set of
  per-locale `hreflang` alternates plus `x-default`, `changefreq` and `priority` — already
  complete and correctly structured.
- `robots.txt`: `Allow: /` with explicit `Disallow` for the interactive/child-facing routes
  (`/*/play`, `/*/entrepreneur-quest`, `/*/leadership-quest`, `/*/real-life-quests`), plus
  checkout/moderation/offline pages and `/api/`. This matches the 2026-11-21 audit's own
  flag ("audit search-intent and child-safety implications before allowing indexing") —
  it was already resolved deliberately in that direction before this pass, not an oversight.
  No changes made.

## 7. GSC / GA4 integration

Unchanged by this branch — tracked separately in PR #133 (draft, not touched here). As of
that PR: GSC is connected and returning real data; GA4's Data API call succeeds with real
credentials but returns 0 rows because no client-side GA4 tag is installed on the site,
which PR #133 explicitly leaves as an owner decision (consent/privacy, not a code fix) and
does not add. Nothing in this branch adds, removes, or changes any tracking.

## 8. SEO/growth agent workflows

No new blockers found beyond what PR #133 already documents (the GA4-tracking-not-installed
item above). Not re-investigated further here to avoid duplicating or conflicting with that
PR's own in-progress work.

## 9. Preserved

No change to educational content, translations, accessibility behavior, or cinematic
design in this branch — the only source changes are `src/app/[locale]/layout.tsx` (the
`setRequestLocale` fix) and tightened assertions in two existing Playwright specs.

## 10. Regression and CI

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean.
- `npm run test:unit`: 77/77.
- Local production build + start, re-verified head placement and Lighthouse scores as
  above.
- Essential and broad CI profiles: run on the PR before merge (see PR description for
  results).

## Guardrails

Same as the 2026-11-21 audit: no production deployment, no DNS/Namecheap changes from this
branch, no tracking changes, no child data collection, no claims of a production score
improvement until the fix is actually deployed and re-measured live.
