# Money Quest — Security Audit

**This is not a claim that the system is secure.** Authentication existing, RLS existing, and even a clean audit pass are not the same thing as "secure" — new code, new dependencies, and new attack techniques can all introduce or reveal problems this audit didn't catch. What follows is a real, adversarial pass against the actual codebase — genuine attack paths traced, genuine code read line by line, genuine findings fixed — not a checklist marked complete by assumption. A professional penetration test against a live deployment, which this offline environment cannot perform, remains a prerequisite before launch (see the existing `legal-review-checklist.md` and this document's own closing section).

---

## Findings

### 1. Latent stored-XSS via unescaped JSON-LD injection

- **Severity:** High (latent — not currently exploitable, but a real vulnerable pattern)
- **Location:** `src/app/[locale]/learn/page.tsx`, `src/app/[locale]/learn/[slug]/page.tsx`
- **Problem:** Structured data was injected via `dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}`. `JSON.stringify()` does not escape `<`, so a value containing the literal sequence `</script>` would close the `<script>` tag early, letting an attacker-controlled string that follows be parsed as raw HTML/script.
- **Risk:** Today, every value flowing into this code is static, developer-authored content (`src/content/articles.ts`) — not exploitable by an external attacker right now. The risk is that this exact code becomes exploitable the instant any part of that content pipeline becomes dynamic (a CMS-driven article, crowd-sourced translations, a title pulled from any less-trusted source) with no visible change at the injection site — the kind of vulnerability that sits dormant until someone else's unrelated change activates it.
- **Fix:** Escape `<` before injection.
- **Implementation:** Added `src/lib/seo/safe-json-ld.ts` (`JSON.stringify(value).replace(/</g, "\\u003c")`), wired into both files in place of the raw `JSON.stringify()` calls. Tested with an actual `</script><script>alert(document.cookie)</script>` payload (`scripts/test-safe-json-ld.ts`), including a sanity check confirming the *old* code really would have left the payload intact — proving this wasn't a theoretical fix.

### 2. `/api/coach` had no CSRF protection

- **Severity:** Medium
- **Location:** `src/app/api/coach/route.ts`
- **Problem:** This is a plain Next.js Route Handler, not a Server Action — it does not get Next.js's automatic Origin-header CSRF checking, which only applies to Server Actions. The route relies purely on the Supabase session cookie for auth, with no additional CSRF defense.
- **Risk:** A malicious site could use the well-documented "`text/plain` form" technique to submit a JSON-shaped body cross-origin, riding a signed-in victim's session cookie. The blast radius is limited — the attacker cannot read the response (blocked by CORS), so no data exfiltration is possible — but the attacker could still trigger real side effects: consuming the victim's AI Coach rate limit, and causing an attacker-chosen message topic to appear in the victim's own interaction log.
- **Fix:** Explicit Origin-header validation before processing the request.
- **Implementation:** Added `src/lib/security/same-origin.ts` (`isSameOriginRequest()`), called at the top of the `POST` handler, returning `403` on mismatch. Deliberately extracted into its own small, dependency-free module (rather than left inline) so it could be genuinely unit tested — `scripts/test-csrf-origin-check.ts` covers same-origin, cross-origin, a subdomain-trick attempt, missing headers (fails closed on missing Host, accepts missing Origin since some legitimate same-site requests omit it), and malformed input. All 6 cases pass. Confirmed via direct inspection of `next.config.mjs` that Server Actions' own built-in protection remains unmodified — this fix specifically closes the gap for the one route that doesn't get that protection for free.

### 3. `/api/coach` missing runtime type validation on `message`

- **Severity:** Low-Medium
- **Location:** `src/app/api/coach/route.ts`
- **Problem:** `childId` had an explicit `typeof childId !== "string"` runtime check; `message` did not. Since `request.json()` returns `any` at runtime, the `CoachRequestBody` TypeScript annotation is not actually enforced — a request body like `{"message": 12345}` would reach `validateInput()`'s `rawMessage.trim()` and throw an unhandled exception.
- **Risk:** Not a data leak — the failure mode is an unhandled exception (likely surfacing as a generic 500). Still a real input-validation gap and a minor availability/robustness issue: every field from an external request body needs its own runtime check, not just the ones that happened to get one.
- **Fix:** Explicit runtime type check on `message` before use, matching the existing pattern for `childId`.
- **Implementation:** `message` is now derived as `typeof body.message === "string" ? body.message : null`, with an explicit `400` response when `null`.

### 4. No application-level brute-force protection on login

- **Severity:** High
- **Location:** `src/app/[locale]/login/actions.ts`
- **Problem:** The login Server Action called `supabase.auth.signInWithPassword()` directly, with zero application-level rate limiting, account lockout, or escalating delay. Protection relied entirely on Supabase Auth's own infrastructure-level rate limiting — real, but not something this codebase configures, verifies, or can be certain is sufficient for this specific product.
- **Risk:** For a product holding real family accounts (and, through them, children's data), the absence of any application-controlled defense against credential stuffing or brute-force password guessing is a genuine gap — not because Supabase's platform-level protection is absent, but because relying solely on an external platform's default configuration, with no visibility into its exact thresholds from this codebase, is not a defensible security posture for the audit to simply wave through.
- **Fix:** A genuine, in-app rate limiter, checked before every login attempt and updated after every attempt regardless of outcome.
- **Implementation:** New `login_attempts` table (`0018_login_rate_limiting.sql`, email + succeeded + timestamp, zero RLS policies for any client role since this must work pre-authentication — service-role-only, the fifth and final legitimate use of the admin client, documented in `admin.ts`'s own comment). Decision logic extracted into a pure, tested function (`src/lib/auth/login-rate-limit-logic.ts`) with two thresholds — a burst limit (5 failures/15 minutes, catches fast automated guessing) and a longer-window limit (15 failures/24 hours, catches a slower, patient brute force that stays under the burst threshold) — verified with 7 test cases (`scripts/test-login-rate-limit.ts`), including specifically confirming a real person mistyping their password twice is never blocked, and that the slow/patient attack pattern is caught even though a burst-only limiter would miss it. The check fails open on its own internal errors (a database hiccup degrades to "no extra protection this request," never "nobody can sign in") — a deliberate choice, since this is one defense-in-depth layer on top of Supabase's own protection, not the only thing standing between the app and an attacker.

---

## Checked and confirmed clean (not assumed)

- **Row Level Security — every policy re-read in full**, including the `owns_child()` helper itself, and specifically checked for the subtlest realistic IDOR: does `contribute_to_goal()` verify the *goal* belongs to the *specified child*, not just that the caller owns *some* child? It does (`where id = p_goal_id and child_id = p_child_id`, raising an explicit "Goal not found for this child" otherwise).
- **All 9 child-scoped RLS policies** confirmed to consistently use `owns_child()` — no weaker or divergent check anywhere (re-verified this session, originally checked with an automated multi-line-aware script in an earlier session).
- **Every `SECURITY DEFINER` function** re-read for ownership checks (`complete_activity`, `contribute_to_goal`, `check_and_award_badges`, `record_daily_streak`, `set_parent_pin`) — all present and correct.
- **SQL injection**: grepped every migration for dynamic SQL construction (`EXECUTE` on a built string) — zero instances. Every function uses static, parameterized `plpgsql`. The one place that builds a string at all (`check_and_award_badges()`'s `LIKE` pattern) concatenates only from a fixed, hardcoded `case` statement, never from attacker-controlled input.
- **Account deletion** (`deleteAccount()`): the parent row being deleted is derived server-side from the verified session (`auth.getUser()`), never from client-supplied input — cannot be tricked into deleting a different account.
- **Data export** (`exportAccountData()`): uses the RLS-scoped client throughout, not the admin client — every query is protected by RLS regardless of the function's own manual filtering.
- **Password minimum length**: genuinely enforced server-side inside the `signUp()` Server Action itself (`password.length < 8`), not merely a client-side HTML attribute a malicious client could bypass. (Initially suspected otherwise; confirmed wrong by direct reading before reporting it — worth stating plainly rather than silently correcting.)
- **CSRF on Server Actions**: Next.js's built-in Origin-checking confirmed unmodified — no `experimental.serverActions.allowedOrigins` override exists in `next.config.mjs`.
- **`/api/export-data`**: a GET request; assessed for GET-based CSRF and found not exploitable for exfiltration — no permissive CORS headers exist, so a cross-origin request cannot read the response even if triggered. No fix needed; documented as assessed, not silently skipped.
- **Environment variable exposure**: every `NEXT_PUBLIC_`-prefixed variable is genuinely meant to be public (Supabase URL/anon key, the site's own public URL); `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROWNUP_GATE_SECRET` are only ever read in files carrying the `server-only` import guard. (A flawed diagnostic script of my own initially flagged false positives here — caught and corrected before reporting, rather than reported as findings.)
- **XSS via React's default rendering**: React auto-escapes all interpolated JSX content by default; the only `dangerouslySetInnerHTML` usage in the entire codebase is the JSON-LD structured data addressed in Finding 1 — no other instance exists.
- **File uploads**: none exist anywhere in the application (`grep` for `type="file"`, `multipart/form-data` — zero matches).
- **Third-party integrations**: the AI provider (Anthropic) is the only one, and its key is isolated behind `server-only` (see above). The advertising and sponsorship systems have no live third-party integration at all — both ship with only a null/first-party implementation, by design, pending a separate review before any real provider is registered (see `advertising-architecture.md` and `sponsorship-architecture.md`).
- **Analytics child-data firewall**: re-confirmed `anonymous_events` (business + usage streams) carries no identifier of any kind, and `recordLearningMetric()` never writes to it — the structural separation between a child's own data and anonymous aggregate analytics remains intact (originally verified with a 15-check automated script, `scripts/test-analytics-child-firewall.ts`, re-run clean this session).
- **Session cookie security flags**: delegated to `@supabase/ssr`'s own cookie handling rather than hand-rolled — a reasonable, defensible choice to rely on a well-maintained official library's defaults for this, the same way this codebase doesn't reimplement password hashing itself.

---

## Full regression confirmation

All 20 automated test scripts across every area this project has built — this audit's 3 new suites, plus every prior session's coverage (RLS-adjacent logic, the AI Coach's safety layers, the advertising/sponsorship/analytics firewalls, translation completeness, the game and simulator engines) — pass together after these fixes, confirming nothing was broken in the process of closing these gaps.

---

## What this audit does not cover, and what still needs a professional pass

- **No live penetration test** — everything here is static analysis and code-level reasoning against an offline environment with no running deployment, no real network, and no ability to actually fire a request at a live server. A genuine pentest (automated scanning plus a human attacker) against a staged deployment is a hard prerequisite before launch.
- **No dependency/supply-chain audit** — this audit did not check `package.json`'s dependencies for known CVEs (no network access to query an advisory database from this environment).
- **Infrastructure-level configuration** (Supabase project auth settings, actual rate-limit thresholds on the platform side, database connection security, backup encryption) is outside what application source code can verify — the login rate-limiting fix in this audit is explicitly a defense-in-depth *addition* on top of that infrastructure layer, not a replacement for verifying it directly in the Supabase dashboard.
- **This document should be read alongside** `legal-review-checklist.md` (data protection/compliance) and `data-lifecycle-and-privacy.md` (what's collected and why) — security, privacy, and legal compliance are related but distinct concerns, and a clean pass on this document alone does not imply either of the others.
