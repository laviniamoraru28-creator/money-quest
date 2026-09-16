# Money Quest — V1 Simplification: Final Report

## Verification performed before writing this report

Full app type-check: clean. Full automated test suite: 19/19 passing (down from 22 — the 3 AI-specific test files were removed along with the feature they tested; every other suite, unrelated to AI, still passes unchanged). All 22 database migrations structurally balanced. Route count: 27 (25 pages + 2 API routes), verified by direct listing, not estimated. Fresh sweeps this session found zero hardcoded secrets, zero debug/temp code, zero remaining AI integration in source code, zero unused environment variables (every var in `.env.local.example` is referenced in code, and vice versa), zero third-party tracking/analytics/ad SDKs, and exactly one application-set cookie (matching the documented Cookie Policy).

---

## SECTION 1: COMPLETED

AI removed entirely, verified by compilation and tests, not just deletion:
- Deleted: the AI Coach feature, its 7-file library (`src/lib/ai/`), its chat component, its page, its API route, its Parent Settings page, its two domain loaders, its 3 test scripts, its e2e spec, its dedicated policy document.
- Removed via a proper cleanup migration (`0022_remove_ai_coach.sql`) rather than editing history: the `ai_coach_interactions` table, its retention function, and the `ai_coach_enabled` column.
- Removed the `@anthropic-ai/sdk` dependency from `package.json` and `ANTHROPIC_API_KEY` from the environment template.
- Fixed every downstream reference this broke: middleware's route list, the Server Actions layer (including catching an orphaned comment block that would have referenced a deleted function), notification preferences, the data export shape, the Privacy Centre, the Child Detail page, the Dashboard's nav link, the analytics event catalog, `robots.ts`, and both translation files.

API surface minimized: converted `/api/report-client-error` into a Server Action (gets Next.js's built-in CSRF protection for free, one fewer endpoint to secure). Down to exactly 2 API routes, both audited and justified: `/api/health` (external monitoring needs a plain HTTP endpoint; can't be a Server Action) and `/api/export-data` (a native browser file download; the right tool for that specific job).

External services minimized: exactly one remains — Supabase. Documented in a new `external-services-audit.md` with the exact table format requested (service / purpose / data received / why needed / removable / simplifiable).

Documentation brought back in sync with the actual implementation (not left stale): `dpia.md`, `subprocessor-register.md`, `childrens-code-self-assessment.md`, `childrens-privacy-notice.md`, `parent-privacy-notice.md`, `retention-and-deletion-policy.md`, `deployment-runbook.md` (including a smoke-test step that would have literally failed on day one — "send a message to the AI Coach"), and `testing-strategy.md`.

Feature-necessity review, as explicitly requested (documented judgement, not silent action):
- Gamification (XP, levels, badges, streaks, goals) — reviewed and kept. Badges are gated on demonstrated quiz correctness, not engagement volume; this is exactly the "simple rewards/progress indicators when they support learning" the brief asked to preserve, not an unnecessary addition.
- Sponsorship system — reviewed. Zero external calls, two mostly-empty tables, no live sponsors. It doesn't serve the stated advertising model (house creatives) and wasn't part of the original request. Not removed this session (a full subsystem removal carries real risk of breaking something under time constraints, and it costs nothing while dormant), but flagged explicitly below as a candidate for actual removal if you want the absolute minimum V1 — see SECTION 3.

---

## SECTION 2: MY ACTIONS

Only items that genuinely require your account access, payment, credentials, or physical action — carried over unchanged from the prior deployment runbook, since none of this session's work touched them:

1. Commission a live penetration test — needs a paid engagement with a real security firm/tester against a live deployment.
2. Get a lawyer to review the Privacy Policy, ToS, and legal checklist — needs a qualified lawyer; I am not one.
3. Enable Point-in-Time Recovery in Supabase and run one real restore drill — needs your Supabase dashboard access; may require a paid tier.
4. Create an UptimeRobot (or similar) account and point it at `/api/health` — free tier available, but needs an account only you can create.
5. Set the 5 real environment variables on your hosting platform and deploy — see `deployment-runbook.md` for the exact list (now 5, not 6 — `ANTHROPIC_API_KEY` is gone).
6. Schedule the login-attempt retention function (`delete_old_login_attempts()`) to run periodically — a cron job or scheduled function in your actual hosting setup; the function itself is written and correct.
7. Confirm Supabase's Data Processing Agreement terms and hosting region meet your regulatory requirements — a contract question only you can answer for your account.

---

## SECTION 3: OPTIONAL (safe to defer past launch)

- Remove the sponsorship system entirely if you want the absolute minimum V1 rather than a dormant, zero-risk subsystem. Not done this session; flagged for your decision rather than removed unilaterally.
- Automated accessibility (`@axe-core/playwright`) and performance (Lighthouse CI) regression testing.
- The deferred reference-data caching (Worlds/Activities) — a real optimization, needs a live environment to verify safely first.
- A standalone "Log out" button (a minor UX gap found while writing e2e tests in an earlier session).
- Deeper curriculum content (currently one lesson per topic per age band — a genuine, deliberate v1 scope).

---

## SECTION 4: TRUE BLOCKERS

Only things that genuinely prevent public launch — not "nice to have":

1. No live penetration test has been performed. Everything in this codebase has been verified by static analysis and automated tests run in an offline environment. A real attacker testing a real deployed instance is a fundamentally different kind of test that cannot be substituted by more code review. This is a security question that cannot be verified without testing the actual deployed environment — no amount of additional engineering work changes that.
2. No lawyer has reviewed the Privacy Policy, Terms of Service, or the legal checklist. This app processes children's data. Confirming the correct UK GDPR lawful basis, and confirming Supabase's contractual terms meet your specific obligations, are legal determinations — not engineering questions a technical implementation can resolve on its own, regardless of how privacy-conscious the code is.
3. No verified database backup exists. The mechanism is documented and the steps are exact, but until Point-in-Time Recovery is actually enabled in your real Supabase project and a real restore has been tested, real family data has no recovery path if something goes wrong.

Everything else that could plausibly have been called a blocker — AI complexity, unnecessary APIs, excess external services, unused code, hardcoded secrets, unscheduled retention jobs — has been resolved directly in this session's work and verified by the test suite, not left as a recommendation.
