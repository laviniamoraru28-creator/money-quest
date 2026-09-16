# Money Quest — Data Lifecycle & Child Safety Implementation

**Status:** Engineering documentation of what is actually implemented in this codebase, as of this increment. This is a good-faith, privacy-by-design implementation — **it is not a legal compliance certification**. See `legal-review-checklist.md` for what still requires a qualified lawyer before launch.

---

## 1. Data minimisation — what we collect, and what we deliberately never ask for

### Collected (children)
| Field | Table.column | Notes |
|---|---|---|
| Nickname (child-chosen) | `children.display_name` | Never the child's real/legal name — nothing in the schema or UI ever asks for one |
| Age band | `children.age_band` | `explorer` / `builder` / `strategist` — a 3-year range, not a birthdate |
| Country (coarse) | `children.country_code` | Sets currency defaults only — see the currency architecture doc |
| Currency preference | `children.currency_code` | Fictional currency only, see §2 |
| Interface language | `children.locale` | Independent of currency — see the i18n architecture doc |
| Avatar (closed set) | `children.avatar_config` (jsonb) | References a fixed set of local SVG parts (`src/data/avatar-options.ts`) — never a photo or externally-hosted image |
| XP / level / progress | `children.xp_total`, `.level`, `child_activity_progress` | Gameplay state only |
| Fictional wallet | `wallet_transactions` | Play-money only, see §2 |
| AI Coach topic log | `ai_coach_interactions.topic_category`, `.was_flagged`, `.flag_reason` | Never the conversation text — see §3 |

### Collected (parents)
Email + password (via Supabase Auth), coarse region, interface locale, marketing opt-in, notification preferences, and (optionally) a Grown-up Mode PIN hash (`parents.parent_pin_hash` — a salted hash, never the PIN itself, see `src/lib/auth/pin.ts`).

### Explicitly never collected — verified against the actual schema and code, not assumed
A repository-wide search (`grep` across every migration and every source file) as of this increment confirms **zero** occurrences of: real/full name fields, street or postal address fields, precise geolocation (no `navigator.geolocation` call anywhere in the codebase), school name fields, phone number fields, or any payment/card/bank account field. `country_code` and `region` are coarse, country-level values only — nothing in this codebase requests a precise location at any resolution finer than that.

The one place PII *could* enter the system — free-text messages to the AI Coach — is actively **blocked**, not just discouraged: `src/lib/ai/input-validation.ts` pattern-matches for phone numbers, email addresses, and phrases indicating an address, school name, password, or bank information, and refuses to forward the message to the AI provider or log anything but a generic flag reason. This was tested with adversarial inputs (`scripts/test-input-validation.ts`), including catching a real false-positive bug (large fictional coin counts misread as phone numbers) during development.

---

## 2. Money is entirely fictional

Every amount anywhere in the child experience — wallet balance, prices, the Money Life Simulator, savings goals — is a fictional in-app number with no connection to any real payment rail, bank account, or currency exchange. There is no payment processor integration anywhere in this codebase (verified: no Stripe/PayPal/payment-gateway references exist). A child never enters, and the system never requests, any real financial account or payment information.

---

## 3. The AI Money Coach's data handling

This is the one feature in the product that involves a third-party processor (the AI model provider) seeing user-submitted text, so it gets its own section.

- **What's sent to the AI provider:** the child's message text and the current session's conversation history (browser memory only — see below), plus the system prompt (age-band-specific safety rules, the child's currency and language, never any PII).
- **What's stored server-side:** `ai_coach_interactions` stores only a classified **topic category** (e.g. `"saving"`, `"needs_wants"` — derived by local keyword matching in `src/lib/ai/topic-classifier.ts`, not by asking the AI provider to summarise) and, if a safety rule was triggered, a short **reason code** (e.g. `"requested_pii"`) — never the message text, never the AI's response text. This is enforced structurally: `src/app/api/coach/route.ts`'s `logInteraction()` function is the *only* code path that writes to this table, and its function signature doesn't accept a raw-text parameter at all.
- **What's never stored anywhere:** the actual conversation. `src/components/coach/CoachChat.tsx`'s message history lives in React state — gone on page refresh or navigation, by design, never sent to a persistence layer.
- **Retention:** `ai_coach_interactions` rows older than 12 months are eligible for deletion via `delete_old_ai_coach_interactions()` (`0012_data_retention.sql`) — see §5 for the honest caveat about scheduling this.
- **Safety enforcement:** input validation (before the provider call), output moderation (after — `src/lib/ai/output-moderation.ts` blocks real-financial-product mentions, PII requests, and "I am human" claims before a response ever reaches the child), rate limiting, and an abuse-escalation cooldown (`src/lib/ai/rate-limit.ts`). The complete system prompt is mechanically validated (`scripts/validate-coach-prompts.ts`) against every one of the brief's explicit prohibitions, for all three age bands.
- **Parental control:** `children.ai_coach_enabled` — toggleable per child from the Parent Dashboard, checked server-side on every request to `/api/coach` (not just hidden client-side).

---

## 4. Features that do not exist, by design

No child-to-child messaging, no public profiles, no public leaderboards or rankings, no social networking features of any kind, no public comments, and no advertising system reachable from any child-facing route. This was verified this increment by searching the codebase for each of these categories rather than simply asserting it — see the accompanying audit notes. The one place children are ever compared to *anything* is against their own past activity (the Parent Dashboard's skill breakdown and weekly report) — `src/lib/domain/progress-analysis.ts` structurally never joins or computes across sibling children, let alone across families.

Advertising, where it exists at all (the product is ad-supported for free access), is parent-facing only, per the product architecture — nothing in the child-facing routes (`/dashboard`, `/world`, `/coach`, `/simulator`, the game engine) renders any ad content or third-party ad script.

---

## 5. Account separation and access control

### Parents and children are not separately authenticated
There is deliberately no separate child login — a child never has their own password or session. This is a considered architectural choice (matching, e.g., how the UK ICO's Age Appropriate Design Code discusses "if you offer separate profiles for children, consider how a child accesses the service" — see the legal review checklist for why this still needs professional review), not an oversight, but it means the *real* boundary protecting parent settings from casual child access is:

1. **Row Level Security** (all 12 tables, every one verified this increment to have RLS enabled with at least one policy — see the audit notes) — this is the boundary between **families**, and it is enforced at the database level, not just in application code. A compromised or buggy page could not read another family's data even if it tried, because Postgres itself refuses the query.
2. **The Grown-up Mode PIN gate** (`0011_parent_pin.sql`, `src/lib/auth/pin.ts`, `src/lib/auth/grownup-session.ts`) — this is the boundary between the **child experience and parent settings within the same family's session**, added this increment to close a real, previously-flagged gap. Concretely:
   - The "Grown-up mode" link routes through `/grown-up-gate`, which requires a PIN (salted + hashed, `scrypt`-derived, never stored or logged in plaintext).
   - First-time PIN setup requires the account **password**, re-verified via a real Supabase Auth sign-in call — not a separate, weaker check — so a child in the same browser session cannot bootstrap their own PIN.
   - Critically, **this is enforced in `src/middleware.ts` for every request to `/parent/*`**, not only when the link is clicked — a child typing `/parent` directly into the address bar is redirected to the gate exactly the same as one who clicked the link. This was a gap in an earlier increment (a direct, unprotected link) that is now closed.
   - The gate pass is a signed, HMAC-verified, 30-minute token (`src/lib/auth/grownup-session.ts`) — not a plain flag a child could set via devtools. This logic was executed and tested for real (`scripts/test-pin-and-session.ts`, 17 checks including tampering and forgery attempts), not only type-checked.
   - **Honest limitation:** a PIN is not cryptographically strong against a determined attacker with direct database access — that was never its purpose, and the migration's own comment says so plainly. Its purpose is exactly what it does well: stop a child from casually navigating into parent settings during ordinary use.

### One family cannot access another family's data
Every child-scoped table's RLS policy resolves ownership through `owns_child(child_id)` (`0002_rls_policies.sql`), which checks `child_id`'s parent against the signed-in user's own `parents` row via `auth.uid()`. This was verified this increment across all 9 child-scoped policies with an automated, multi-line-aware check (not a manual read-through) — all 9 consistently use the same ownership function; none use a weaker or divergent check.

---

## 6. Data lifecycle, stage by stage

### Collection
Every field a parent or child provides is entered directly through the app's own forms — never inferred, scraped, or purchased from a third party. Onboarding collects only what's listed in §1.

### Storage
Postgres via Supabase, with RLS as the primary access-control layer (§5). Secrets (Supabase service-role key, AI provider API key, the Grown-up Mode signing secret) are read only in server-only-guarded modules (`src/lib/supabase/admin.ts`, `src/lib/ai/provider.ts`, `src/lib/auth/grownup-session.ts`), never sent to the browser.

### Processing
- Gameplay progress: processed entirely server-side via the `complete_activity()` SECURITY DEFINER function — the single, audited path that can award XP/coins, preventing client-side tampering.
- AI Coach messages: processed by the AI provider per the system prompt's rules (§3), with input/output filtering on both sides of that call.
- Parent Dashboard analytics (skill breakdown, weekly report): computed from the family's own data only, on request, server-side — never pre-aggregated into any cross-family dataset.

### Retention
- Gameplay/progress/wallet/savings-goal data: retained for as long as the child's profile exists (no arbitrary expiry — this is data the family actively uses).
- AI Coach interaction log: 12-month rolling deletion via `delete_old_ai_coach_interactions()` — **see the honest caveat in §7: this function exists and is tested, but actually scheduling it (pg_cron or an external scheduled job) is a deployment-configuration step not yet wired up in this codebase.**
- No raw AI conversation text is ever stored in the first place, so there is nothing to retain or expire for that specific category.

### Deletion
Two deliberately different flows, proportionate to their blast radius:
- **Removing one child profile** (`removeChild` in `src/app/[locale]/parent/actions.ts`): a single RLS-scoped delete on `children`, cascading via `ON DELETE CASCADE` foreign keys to that child's progress, wallet history, savings goals, badges, and AI interaction log. Confirmed via a native `window.confirm()` step.
- **Full account deletion** (`src/app/[locale]/parent/settings/account/actions.ts`): requires typing the exact confirmation phrase, verifies identity via the normal RLS-scoped client first, then uses the service-role client for exactly two operations — deleting the `parents` row (cascading to everything, transitively, the same way) and calling Supabase's Auth Admin API to remove the actual login credential (something no RLS policy could ever do, since RLS governs table rows, not `auth.users`). This is the one narrow, documented, justified use of the elevated-privilege client in the entire codebase.
- **Data export**: `/api/export-data` — a real, working endpoint producing a downloadable JSON file of everything the account holds, fetched per-child so one child's slow query never silently drops another's data from the export.

---

## 7. Honest gaps and open items (not claimed as solved)

- **Retention scheduling**: `delete_old_ai_coach_interactions()` is a real, tested function, but nothing in this codebase currently *invokes* it on a schedule. This needs either Supabase's `pg_cron` extension (if available on the project's plan) or an external scheduled call.
- **Badges and Savings Goals**: the database schema and RLS policies for these exist and are correctly scoped, but no child-facing UI to *create* a savings goal or *earn* a badge has been built yet — the Parent Dashboard shows honest empty states for these, not fabricated data.
- **Grown-up Mode PIN recovery**: currently requires the account password (a reasonable design), but there's no separate "forgot everything" flow beyond normal Supabase Auth password reset.
- **No formal age-verification mechanism**: the parent creates the account and enters the child's age band themselves — there is no independent age verification of either the parent or the child, which is a known, common limitation across this category of product and is explicitly called out in the legal review checklist.
- **No cookie/consent-banner infrastructure**: this codebase does not yet implement a cookie consent mechanism, because it currently sets no non-essential cookies (the Supabase Auth session cookie and the Grown-up Mode token are both strictly necessary for the service to function) — but this should be re-confirmed if analytics or advertising scripts are added later.
