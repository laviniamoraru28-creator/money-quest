# Money Quest — Final Pre-Launch Audit

## Verdict

**No known unresolved CRITICAL or HIGH code-level issue remains as of this audit.** Every CRITICAL/HIGH finding surfaced across this project's security, accessibility, and performance audits — and the 2 new findings this audit surfaced — has a real, verified fix in the codebase (see §3).

**This is still not the same as "ready to launch."** Code-level support for monitoring and error reporting has since been added (§10-11) — a working `/api/health` endpoint and a real error-reporting path, both functional the moment a human sets one environment variable or creates one monitoring account. What remains genuinely cannot be done by an AI assistant in an offline environment, no matter how much code is written: **a live penetration test against a real deployed instance, a qualified lawyer's sign-off on the legal checklist, an actual verified database backup with a real restore drill, and the human step of activating the monitoring/error-reporting now-built into the code.** Per this audit's own instruction, the application should not be declared ready for public launch until those four things are genuinely done — see `deployment-runbook.md` for exactly who does what.

---

## 1. Methodology

Entirely offline — no live browser, server, or database exists in this environment. Every finding is either (a) a real code-level issue found by reading source and, where possible, verified with an automated test, or (b) an operational/infrastructure item that is stated as unverified rather than assumed complete. This is the same standard applied throughout every prior audit in this project (security, accessibility, performance) — carried forward here, not relaxed for the final pass.

**Baseline confirmed at the start of this audit**: all 21 automated test suites pass (`npm run test:unit`), the application type-checks cleanly, 19 migrations remain balanced, 29 routes exist.

---

## 2. Persona walkthroughs — what's new or noteworthy this session

Full depth for each area lives in its own prior audit document (see the cross-references below); this section covers what changed or was newly found this session.

### As a 7-year-old child (Explorer)
Lesson content for this age band (`src/content/curriculum/`) uses short sentences, verified as measurably shorter than the Strategist band's sentences by an automated check, not eyeballed. Game mechanics remain tap-only (no drag-and-drop), confirmed in the accessibility audit. **New this session**: hitting a broken or mistyped link previously showed Next.js's raw, unbranded default error page — confusing for a young reader. Fixed (§3.1).

### As a 10-year-old child (Builder)
The "this week, try X" personalised challenge and the Savings Goals UI (`SavingsGoalsSection`) are both real, working features a child in this band would actually use — not placeholders. Badge criteria are all genuinely earned (checked against real quiz correctness), never decorative.

### As a 13-year-old child (Strategist)
Lesson content for this band explicitly separates factual content from advice — every lesson touching a genuinely personal decision states plainly it isn't financial advice. The AI Coach's age-band-specific system prompt (65 automated checks) still passes cleanly.

### As a parent
The Parent Dashboard's "What [child] is learning" section (built last session) is a genuinely new, real feature reading actual recent lesson content, not a static list. Grown-up Mode's PIN gate, account settings, data export, and account deletion were all re-verified this session — **account deletion had one real gap** (§3.2), now fixed.

### As an unauthorised attacker
Re-checked the two riskiest areas for regressions since the last full security audit: the gamification system (badges/streaks, built after that audit) and the curriculum content session. Both confirmed clean — `child_badges` already had the correct `ON DELETE CASCADE` and RLS scoping from the original schema; the new `children` columns (streak/reduced-motion) carry no separate access-control surface since they're just columns on an already-correctly-scoped table. The cross-family access journey (`e2e/journeys/07-cross-family-access.spec.ts`) remains the concrete, if unexecuted-in-CI, test of this system's core promise.

---

## 3. Fixes applied this audit

### 3.1 — HIGH — No custom error or not-found pages existed
- **Location**: `src/app/[locale]/` (missing `error.tsx`, `not-found.tsx`)
- **Problem**: Zero custom error boundaries or 404 pages existed anywhere in the app. Any unhandled exception or invalid route fell through to Next.js's generic, unbranded default pages.
- **Risk**: A confusing, unbranded, non-child-friendly experience for a child hitting a broken link or an in-flight error — genuinely likely to occur given typo-prone URLs and seeded content that changes over time. Not a security issue, but a real Child UX and Error Handling gap, both explicitly in scope for this audit.
- **Fix**: Added `not-found.tsx` (friendly 404, links home) and `error.tsx` (friendly error boundary with a "Try again" button, deliberately dependency-free so it has the best chance of rendering even when something else broke).

### 3.2 — MEDIUM — Account deletion left a residual email in the login rate-limit log
- **Location**: `src/app/[locale]/parent/settings/account/actions.ts`
- **Problem**: `login_attempts` (added during the security audit) is keyed by email with no foreign key to `parents` — by design, since it must work pre-authentication. Account deletion's cascade delete never touched it.
- **Risk**: Modest — the table already has a 7-day retention cleanup function, and the row contains only an email, a timestamp, and a success/fail boolean, nothing more sensitive. But "delete my account" should be complete immediately, not just eventually via a retention job.
- **Fix**: `deleteAccount()` now purges matching `login_attempts` rows by email before proceeding, as a best-effort, non-blocking step — a failure here can never stop the account deletion itself from completing.

---

## 4. Complete categorized issue log (all 26 areas)

Issues found in *prior* sessions are listed here for completeness, marked **[fixed previously]** with a pointer to where; only §3 above is new this session.

| # | Area | Severity | Issue | Status |
|---|---|---|---|---|
| 1 | Security (XSS) | HIGH | Unescaped JSON-LD injection in SEO pages | **[fixed previously]** — `money-quest-security-audit.md` §1 |
| 2 | Security (CSRF) | MEDIUM | `/api/coach` had no Origin check | **[fixed previously]** — same doc §2 |
| 3 | Security (input validation) | LOW-MEDIUM | `/api/coach` missing runtime type check on `message` | **[fixed previously]** — same doc §3 |
| 4 | Authentication | HIGH | No application-level brute-force protection on login | **[fixed previously]** — same doc §4 |
| 5 | Performance | High | Sequential (non-parallel) DB queries on Dashboard & Parent Hub | **[fixed previously]** — `money-quest-performance-audit.md` §1 |
| 6 | Performance | Low-Medium | Progress bars animated `width` instead of `transform` | **[fixed previously]** — same doc §2 |
| 7 | Accessibility | High | `gold` text color at 2.16:1 contrast (fails WCAG AA) | **[fixed previously]** — `money-quest-accessibility-audit.md` §1 |
| 8 | Accessibility | High | 88 instances of `ink/40`-`/60` failing AA contrast | **[fixed previously]** — same doc §1 |
| 9 | Accessibility | High-Medium | 5 "colour alone" violations in game mechanics | **[fixed previously]** — same doc §1 |
| 10 | Accessibility | Medium | 9 of 27 pages missing `<main>` landmark | **[fixed previously]** — same doc §1 |
| 11 | Educational content | Critical (pre-launch) | Only 3 placeholder lessons existed, with literally templated quiz text | **[fixed previously]** — `money-quest-curriculum-content.md` |
| 12 | Error handling | HIGH | No custom error/not-found pages | **[fixed this audit]** — §3.1 |
| 13 | Data/account deletion | MEDIUM | `login_attempts` email not purged on deletion | **[fixed this audit]** — §3.2 |
| 14 | Caching | Medium (deferred) | Reference data (Worlds/Activities) re-queried fresh every request | **Open** — needs a live Next.js runtime to verify `unstable_cache`'s cookie-restriction behaviour before shipping; see performance audit's "Identified but deliberately not implemented" section |
| 15 | Testing | Medium (deferred) | No automated RLS/accessibility/performance test suite (unit + manual audits only) | **Open** — see `money-quest-testing-strategy.md` §4 |
| 16 | Product UX | Low | No standalone "Log out" button anywhere in the app | **Open** — found while writing e2e tests; real but low-severity UX gap |
| 17 | Monitoring/Ops | HIGH (operational) | No error reporting or monitoring service configured | **Open — genuine launch blocker**, see §9-11 |
| 18 | Backups | HIGH (operational) | No backup schedule configured or verified | **Open — genuine launch blocker**, see §9 |
| 19 | Legal | HIGH (operational) | 14-item legal review checklist not signed off by a qualified lawyer | **Open — genuine launch blocker**, see `legal-review-checklist.md` |
| 20 | Security | HIGH (operational) | No live penetration test performed | **Open — genuine launch blocker**, see §7 |

**Nothing in this table is CRITICAL and unfixed at the code level.** Items 14-20 are real, honestly-stated gaps — several of them (17-20) are exactly the kind of thing this audit's own instruction means when it says not to declare the app ready while critical gaps remain, even though they're operational rather than code bugs.

---

## 5. Final architecture

```
Next.js 14 (App Router) -- Vercel or equivalent Node hosting
        |
        +-- Server Components (default) -- most pages, zero client JS shipped
        +-- Client Components (19 total, audited) -- game engine, Simulator,
        |     forms needing interactivity
        +-- Server Actions -- all mutations (goals, badges, settings, deletion)
        +-- 2 custom Route Handlers -- /api/coach (AI), /api/export-data
        |
        +-- Supabase (Postgres + Auth)
        |     +-- RLS on every table -- owns_child() the single ownership check
        |     +-- 6 SECURITY DEFINER functions for trusted server-side logic
        |     +-- Admin (service-role) client -- 5 justified, documented uses
        |
        +-- Anthropic API -- AI Money Coach only, key isolated via server-only
```

No file uploads, no other third-party integrations. Advertising and sponsorship ship with first-party-only providers (no live ad network integrated) pending a separate review. Analytics is first-party-only, structurally firewalled from child data.

## 6. Database structure (summary)

19 migrations, in order: core schema + RLS (0001-0002) -> currency/world/game/simulator seed data (0003-0006) -> locale columns (0007) -> AI Coach logging (0008) -> notification prefs (0009) -> parents column lockdown (0010) -> Grown-up Mode PIN (0011) -> data retention (0012) -> ad impressions (0013) -> sponsorships (0014) -> analytics (0015) -> gamification (0016) -> reduced motion (0017) -> login rate limiting (0018) -> real lesson content (0019).

Every table has RLS enabled; every child-scoped policy uses the single `owns_child()` helper; tables with no per-row owner (aggregate analytics, ad impressions, login attempts) have zero client-facing policies by design and are written exclusively via the service-role client.

## 7. Environment variables

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | RLS-scoped client key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret, server-only** | Bypasses RLS -- 5 justified uses only |
| `ANTHROPIC_API_KEY` | **Secret, server-only** | AI Coach |
| `GROWNUP_GATE_SECRET` | **Secret, server-only** | Signs the Grown-up Mode session token |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical URL for SEO/sitemap |

All three secret variables are confirmed isolated behind `server-only` import guards -- a build failure, not just a convention, if ever imported into client code. A live penetration test against the deployed environment (item 20 above) has not been performed and is a genuine prerequisite before this application should be considered launch-ready.

## 8. Deployment steps

1. Provision a Supabase project; run all 19 migrations in order via the Supabase CLI.
2. Configure Supabase Auth settings directly in the dashboard (password minimum should be set to at least 8, matching the application-level check; confirm Supabase's own rate-limiting defaults are acceptable given this app now adds its own layer on top).
3. **Set up automated daily database backups with point-in-time recovery** -- Supabase supports this natively; it must be explicitly enabled and verified with a real test restore before launch. Not yet done.
4. Set all 6 environment variables (§7) in the hosting platform, never committed to source.
5. Run `npm run build` and deploy.
6. Run `npm run test:e2e` against the real deployed URL -- these specs have never executed against a live environment; this is a required step, not optional.
7. Configure DNS, TLS (should be automatic on most modern hosts).

## 9. Backup strategy

**Not yet configured -- a genuine launch blocker.** Required before launch: daily automated Postgres backups via Supabase's native backup feature, point-in-time recovery enabled, and at least one full restore drill performed and verified against a staging project before this is trusted for real family data.

## 10. Monitoring

**Code-level support now exists; account/activation is still a human step.** `/api/health` checks a real Supabase query (not just "the process is up") and returns 503 on database failure — point any uptime monitor (UptimeRobot, Better Stack, your host's own monitor) at it. **[HUMAN]** actually creating that monitor account and configuring the alert is not something this audit can do — see `deployment-runbook.md` §1.7.

## 11. Error reporting

**Code-level support now exists; a webhook or Sentry account is still a human step.** Both the server (`src/lib/monitoring/report-error.ts`) and client (`error.tsx` → `/api/report-client-error`) error paths now report to `ERROR_REPORTING_WEBHOOK_URL` if set, and still safely log to console if it isn't — never worse than before, genuinely better once configured. **[HUMAN]**: either set that env var to a webhook (Slack, Better Stack, etc.) or install `@sentry/nextjs` for richer tracking — see `deployment-runbook.md` §3.

## 12. Privacy checklist

- [x] No PII collected from children beyond a self-chosen nickname and age band
- [x] Parent's email is the only real PII collected from an adult
- [x] Analytics structurally firewalled from child data (verified: 15 automated checks)
- [x] Data export and account deletion both real and working
- [x] AI Coach interaction log stores safety metadata only, never conversation text
- [ ] **Legal review checklist (14 items) signed off by a qualified lawyer -- not done**
- [ ] **Live verification that Supabase's own data-residency/processing terms meet your jurisdiction's requirements -- not done, cannot be verified from this environment**

## 13. Child safety checklist

- [x] No chat with other users, no user-generated content, no strangers
- [x] AI Coach has input/output moderation and a hard-coded safety system prompt (65 automated checks)
- [x] No gambling mechanics, loot boxes, or random rewards anywhere in the gamification system
- [x] No advertising targets children with anything beyond house creatives (no live ad network integrated)
- [x] Parent-gated settings (Grown-up Mode PIN) separate from the child experience
- [x] Never shames a child for a wrong answer or a financial decision -- checked directly in lesson content and game feedback
- [ ] **A live safety review by someone outside this project, ideally including input from child-development or online-safety expertise -- not done, cannot be performed by this audit alone**

## 14. Advertising checklist

- [x] Child-facing ad zone disabled by default in `AD_ZONE_CONFIG`, pending a separate review
- [x] `ChildAdRequest` type structurally carries no targeting fields
- [x] `validatePlacement()` re-validates every ad response regardless of provider
- [x] No live third-party ad network integrated -- house creatives only
- [ ] **Before enabling the child zone or any live provider: a dedicated review of that specific provider's data practices and targeting capabilities -- not done, and shouldn't be rubber-stamped by this audit**

## 15. Post-launch roadmap

1. Close the 4 operational launch blockers (§9-11, legal sign-off) -- these come first, before anything else.
2. Run the 13 e2e journeys against the real production environment for the first time.
3. Expand curriculum depth (currently one lesson per topic per age band -- a real, deliberate v1 scope, not a hidden gap).
4. Add automated accessibility (`@axe-core/playwright`) and performance (Lighthouse CI) regression testing, closing the two testing-strategy gaps.
5. Implement the deferred reference-data caching once a live environment exists to verify it safely.
6. Add a standalone "Log out" UI (found missing while writing e2e tests).
7. Revisit the advertising/sponsorship child-zone decision only after a dedicated, separate safety review -- never as a routine feature toggle.
