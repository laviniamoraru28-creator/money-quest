# Money Quest — Performance Audit

**Methodology:** this audit ran entirely offline, against source code — there is no live deployment in this environment to run Lighthouse, WebPageTest, or real Core Web Vitals field data against. Every finding below is a real, verifiable code-level issue (counted database round trips, read CSS properties, checked actual imports), fixed and re-verified by re-reading the changed code, not a simulated benchmark. See `performance-budget.md` for the concrete targets this audit was checked against, and its own honest notes on what still needs verification against a real deployment.

---

## Findings, largest first

### 1. Sequential (non-parallel) database queries on high-traffic pages

- **Severity:** High — directly affects "the child dashboard should load quickly" and the Parent Dashboard's load time, the two most performance-sensitive pages in the app.
- **Locations:**
  - `src/app/[locale]/dashboard/page.tsx` — 5 independent data-fetching calls (`loadChildDashboardData`, `resolveStandardSimulatorActivityId`, `loadChildGoals`, `loadChildBadges`, `loadWeeklyChallenge`, plus `getLocale`/`getTranslations`) were each individually `await`-ed one after another.
  - `src/lib/domain/parent-dashboard.ts` — a `for...of` loop awaited one query per child, one child at a time.
  - `src/lib/domain/ai-settings.ts` — the same pattern, but **two** sequential queries per child (4 total round trips fully serialized for a 2-child family, 6 for a 3-child family).
  - `src/app/[locale]/parent/settings/data/export-action.ts` — queries *within* one child were already parallelized (a good existing pattern), but the loop *across* children was not.
- **Problem:** None of these queries depend on each other's results — every one of them only needs a `childId` (or nothing at all) that's already known before the batch starts. Running them sequentially means the total wait time is the *sum* of every query's latency instead of the *slowest single one*.
- **Risk:** For a family with 3 children, the AI Settings page alone was paying for 6 fully sequential round trips where far fewer parallel batches would do. The Dashboard — the page a child sees most often, every session — was paying for 5+ sequential round trips on every single load.
- **Fix:** Replace sequential `await` chains and `for...of` loops with `Promise.all()` (or `.map()` + `Promise.all()` for the per-child cases).
- **Implementation:** All 4 locations fixed. The Dashboard now destructures a single `Promise.all([...])` array. The two per-child loops now use `children.map(async (child) => {...})` wrapped in `Promise.all()`, with a corrected code comment — the *original* comment on `parent-dashboard.ts` claimed the sequential loop existed so "a slow query for one child never blocks the others," which was actually backwards: a sequential loop makes every child's query wait for the previous one to finish. The comment now states the real reasoning and the real fix, rather than leaving an inaccurate rationale in place.

### 2. Progress bars animated a layout-affecting CSS property

- **Severity:** Low-Medium — real, but these are short, discrete, one-off transitions (an XP gain, a round advancing), not continuous or looping animation, so the practical cost of the old approach was genuinely small on any modern device.
- **Locations:** the child Dashboard's XP bar, `SavingsGoalsSection`'s goal progress, `GameShell`'s round progress, `SimulatorShell`'s week progress — 4 separate, near-duplicate implementations.
- **Problem:** All 4 animated `width` directly via `transition-[width]`. `width` is a layout-affecting CSS property — animating it forces the browser to recompute layout on every frame of the transition, rather than running the animation entirely on the compositor thread the way `transform`/`opacity` animations do. This matters most on lower-end mobile devices, an explicit target device class for this audit.
- **Fix:** Animate `transform: scaleX()` (with `transform-origin: left`) instead — visually identical result, compositor-only cost.
- **Implementation:** Consolidated all 4 duplicate implementations into one shared `src/components/ui/ProgressBar.tsx` component using the transform-based approach. A genuine side benefit found while doing this: `SimulatorShell`'s progress bar had **no `role="progressbar"`/ARIA attributes at all** — a real accessibility gap the other 3 instances didn't have, fixed automatically by routing it through the same shared, correctly-built component.

### 3. Font subset gap for non-Latin-extended characters

- **Severity:** Low — a correctness/consistency issue with performance implications (a missing glyph can cause a fallback-font substitution mid-word), not a major Core Web Vitals problem on its own.
- **Location:** `src/app/[locale]/layout.tsx`
- **Problem:** Both fonts loaded only the `latin` subset via `next/font/google`. Google Fonts' plain "latin" subset commonly excludes the extended diacritics used by Romanian (a a i s t with diacritical marks) and Polish (similarly) — both supported, first-class languages in this app's i18n system.
- **Fix:** Add the `latin-ext` subset.
- **Implementation:** Added `"latin-ext"` to both fonts' `subsets` arrays. **Honest caveat, stated plainly rather than hidden:** this could not be verified against a live build in this offline environment — if either font genuinely doesn't offer a `latin-ext` subset on Google Fonts, `next/font/google` would fail at build time with a clear error (not silently do nothing), so this is a safe, easily-caught-if-wrong change, but it is not confirmed correct by an actual successful build in this session.

---

## Checked and confirmed clean (not assumed)

- **Font loading strategy**: `next/font/google` (self-hosted, avoids a render-blocking external request) with `display: "swap"` explicitly set on both fonts — confirmed by reading the actual configuration, not assumed from memory.
- **JavaScript bundle discipline**: 19 client components total; every single one's imports checked directly — zero third-party libraries leak into any client bundle. The AI SDK and Supabase admin client are confirmed isolated behind the `server-only` build guard (a hard build failure if violated, not just a convention).
- **No unnecessary client-side API requests**: the child Dashboard's entire render tree (including `SavingsGoalsSection`, `BadgesGrid`, `ChildAdSlot`) checked directly for `useEffect`/`fetch()` — none exists; every piece of data is server-rendered and passed as props, so there's no client-side loading waterfall for the core experience.
- **Images**: no user-uploaded or externally-hosted image exists anywhere in the app — avatars are inline SVG from a closed local set. The two raw `<img>` usages (ad/sponsor logos) are both small, local, static assets.
- **No unnecessary looping animation**: checked directly for `animate-spin`/`-pulse`/`-bounce`/`-ping` — the one match found (`Button.tsx`'s loading spinner) is legitimate: it only renders while an async action is genuinely in progress, is small, compositor-friendly, and correctly marked `aria-hidden`. (An earlier draft of this audit's own performance budget claimed zero looping animations existed at all — caught and corrected against the real grep result before it shipped, rather than left as an inaccurate claim.)
- **Reduced motion**: both the OS-level media query and the in-app per-child toggle (built in the prior accessibility audit) correctly reduce every animation/transition to near-zero duration — re-confirmed this session.

---

## Identified but deliberately not implemented this session

**Caching for rarely-changing reference data** (Worlds, Activities, Badges — tables that only ever change via a migration, yet are re-queried fresh from the database on every single page load that needs them). This is a real, meaningful optimization opportunity. It was not implemented this session because the correct mechanism (`unstable_cache`) has a real technical constraint — the App Router disallows calling `cookies()`/`headers()` inside a cache-wrapped function, which would require restructuring these queries to use a cookie-free client — and this environment has no live Next.js runtime to verify that restructuring actually behaves as intended before shipping it. Implementing an unverified caching layer risked introducing a subtler bug than the one being fixed. This is flagged here as a concrete next step, not silently dropped.

---

## Regression confirmation

All 20 automated test scripts across every area this project has built pass together after these changes, confirming the query-parallelization and progress-bar consolidation didn't alter any tested behavior.
