# Money Quest — Testing Strategy

**Honesty first, since it governs how to read everything below:** this document and the tests it describes were built entirely offline — no live browser, no running Next.js server, no live Supabase project exist in this environment. Two genuinely different classes of test result follow from that:

- **Unit tests (pure logic): actually run, actually passing, right now.** `npm run test:unit` executes all 20 suites in `scripts/` and was run during this session — 20/20 passed. These are real results, not projected ones.
- **End-to-end tests (`e2e/`): real, complete, structurally-verified Playwright specs that have never been executed.** Every selector was checked against this codebase's actual component markup (grepped from real source, several corrected after an initial wrong guess — see `e2e/support/onboarding-flow.ts`'s own comment). The specs pass TypeScript structural verification against a faithful API stub. They have not been run against a real browser or a real deployment. Treat `npx playwright test` against a real environment as a required step before trusting these as passing — this document does not claim otherwise.

---

## 1. The test pyramid, and what lives at each level

```
        /\
       /e2e\          13 user journeys (e2e/journeys/) — slow, few, highest confidence
      /------\
     /integr. \       RLS/database behavior — see section 4's honest gap
    /----------\
   / unit (pure \     20 suites, scripts/*.ts — fast, many, run on every change
  /--------------\
```

**Unit tests** verify pure logic in isolation — no database, no network, no browser. This is where the large majority of this project's automated coverage lives, and deliberately so: a pure function's test runs in milliseconds and can never be flaky for environmental reasons. Every non-trivial pure function built across this project's development has one (badge mastery thresholds, streak day-arithmetic including leap-year and month-boundary cases, CSRF origin-checking, login rate-limit thresholds, PIN lockout thresholds, JSON-LD escaping, translation completeness, currency formatting, and more).

**Integration tests** verify that pieces work together against a real (or realistically faked) database — this is where Row Level Security itself, and the `SECURITY DEFINER` functions built on top of it, actually need to be exercised against a real Postgres instance to be genuinely confirmed, not just read and reasoned about. See section 4 for the honest gap here.

**End-to-end tests** verify a real user journey through a real browser against a real running app — slowest, fewest, but the only level that can catch an integration mistake between the frontend and the actual deployed backend (a wrong RLS policy, a broken redirect, a CSS class that silently didn't apply). `e2e/journeys/` covers the 13 named journeys.

## 2. Test categories and where they're covered

| Category | Where |
|---|---|
| Unit tests | `scripts/*.ts` (20 suites) — run via `npm run test:unit` |
| Integration tests | Honest gap — see section 4 |
| End-to-end tests | `e2e/journeys/*.spec.ts` (12 journeys — AI Coach interaction removed along with the feature itself; written, not yet run — see header) |
| Database tests | Every migration's RLS policy and `SECURITY DEFINER` function was re-read line-by-line during the security audit (not automated — see section 4) |
| Authentication tests | `e2e/journeys/01-onboarding.spec.ts` (signup), `test-login-rate-limit.ts` + e2e login flows (brute-force protection), `test-pin-and-session.ts` (Grown-up Mode PIN + session token, real executed crypto checks) |
| Authorization tests | `e2e/journeys/07-cross-family-access.spec.ts` — the most important spec in this repository |
| AI safety tests | Not applicable — V1 has no AI feature of any kind; the AI-specific test scripts (`validate-coach-prompts.ts`, `test-input-validation.ts`, `test-output-moderation.ts`) were removed along with the feature they tested |
| Child privacy tests | `test-analytics-child-firewall.ts` (15 checks — business/usage analytics structurally cannot reach child data), `test-sponsorship-decoupling.ts` (46 checks) |
| Accessibility tests | Manual audit only so far (`money-quest-accessibility-audit.md`) — see section 4 for why this is a real gap worth naming, not silently declared "done" |
| Responsive tests | `playwright.config.ts` runs every journey across 3 device profiles (`mobile-chrome`, `tablet-safari`, `desktop-chrome`) — real device-matrix coverage once run |
| Performance tests | Honest gap — see section 4; the prior performance audit was static-analysis only |

## 3. The 13 user journeys

| # | Journey | Spec file |
|---|---|---|
| 1 | Child onboarding | `01-onboarding.spec.ts` |
| 2 | Currency selection | `01-onboarding.spec.ts` (dedicated second test) |
| 3 | Avatar creation | `01-onboarding.spec.ts` |
| 4 | Completing a lesson | `02-learning.spec.ts` |
| 5 | Playing a game | `02-learning.spec.ts` |
| 6 | Earning XP | `02-learning.spec.ts` (verified as the observable outcome of 4/5, not a separate action) |
| 7 | Creating a savings goal | `03-savings-goals.spec.ts` |
| 8 | Completing a savings goal | `03-savings-goals.spec.ts` |
| 9 | Parent viewing progress | `04-parent-access.spec.ts` |
| 11 | Account deletion | `06-account-deletion.spec.ts` — includes a "fail safely" negative case (wrong confirmation phrase must never enable the delete button) |
| 12 | Parent accessing child data | `04-parent-access.spec.ts` |
| 13 | Attempted cross-family data access | `07-cross-family-access.spec.ts` — two fully independent browser contexts, three distinct attack surfaces (parent child-detail page, child dashboard's `?child=` param, AI settings page), plus a positive control proving the negative results are real RLS discrimination and not just a broken app showing nobody anything |

## 4. Honest gaps

- **No automated RLS/database integration test suite exists yet.** The correct tool for this is `pgTAP` (SQL-native test assertions) run against a real local Supabase/Postgres instance via the Supabase CLI, or a Node-based integration harness that spins up real test accounts and asserts on real query results. This environment has neither a Postgres instance nor network access to provision one. What exists instead: every RLS policy and `SECURITY DEFINER` function was manually re-read during the security audit, and the e2e cross-family journey (#13) exercises RLS indirectly through the browser — real coverage, but not the same as a fast, dedicated database test suite that runs on every commit.
- **No automated accessibility test suite** (e.g., `@axe-core/playwright` wired into the e2e specs) exists yet — the accessibility work so far is a real, thorough manual audit, not an automated regression guard. Adding `axe` assertions to each journey spec is a natural, low-effort next step once Playwright is actually running.
- **No automated performance test** (Lighthouse CI, or Playwright's own tracing/timing assertions) exists yet — the prior performance work was static code analysis (counting database round trips, checking CSS properties), not measured timings. This is the same honest limitation stated in `money-quest-performance-audit.md`.
- **A real product gap found while writing these tests, not by design**: there is no standalone "Log out" UI anywhere in the app — `supabase.auth.signOut()` is only ever called inside account deletion. The cross-family journey worked around this by using independent browser contexts (arguably the more realistic test design anyway), but the missing logout affordance is a real, separate UX gap worth fixing.

## 5. Fail-safe and privacy principles, tested directly

- **"The system should fail safely"**: journey 11 asserts the delete button is provably `disabled` for a wrong, near-miss, and empty confirmation input — not just that it "usually" requires the right phrase. Journey 13's core assertion is the same shape: a failure mode that shows *nothing* is acceptable; a failure mode that shows the *wrong family's* data is the one thing tested as strictly forbidden.
- **"Do not expose sensitive test data"**: every fixture (`e2e/fixtures/test-data.ts`) uses the `.test` TLD (RFC 2606-reserved, can never resolve to a real domain), tagged with a journey name and timestamp so any leftover test account is self-evidently synthetic in any real database view, log, or screenshot. No fixture anywhere uses a real-sounding name, address, or any value that could be mistaken for genuine PII.

## 6. Running these tests

```bash
npm run test:unit   # 20 pure-logic suites — runs today, no external dependencies
npm run test:e2e    # 12 journeys x 3 device profiles — requires a running app + Supabase project; not yet executed anywhere
```
