# Money Quest — Legal and Privacy Readiness Report

**This report does not declare the application legally compliant.** It describes what was actually implemented and verified this session, against the ICO's Children's Code and UK GDPR as the primary reference, and states plainly what still requires a qualified lawyer's independent judgement.

## What changed this session (real code, not just documents)

1. **Removed `children.birth_year`** — an unused column capable of holding more identifying data than the app needs. Migration `0020`.
2. **Added rate limiting to the Grown-up Mode PIN** — previously zero throttling on a 4-digit PIN. Migration `0021` + `pin-lockout-logic.ts` (9 tests).
3. **Added a rectification mechanism** — a parent can now correct a child's nickname/age band; previously impossible despite RLS already permitting it.
4. **Purged the login-attempt log on account deletion** (from the prior session, re-confirmed working this session).
5. **Expanded the in-app Privacy Centre** with AI Coach, cookies, and rights sections.
6. **Added just-in-time privacy copy** at the child nickname field.
7. Wrote 12 new/updated documents: `childrens-code-self-assessment.md`, `dpia.md`, `subprocessor-register.md`, `retention-and-deletion-policy.md`, `data-breach-response-procedure.md`, `data-subject-rights-procedure.md`, `ai-coach-safety-privacy-policy.md`, `childrens-privacy-notice.md`, `parent-privacy-notice.md`, `cookie-policy.md`, and updated `privacy-policy-DRAFT.md` / `terms-of-service-DRAFT.md`.

Verification: full app type-check clean; automated test suite now at 22/22 (was 21); all 21 database migrations balanced; fresh sweeps this session for hardcoded secrets, debug endpoints, test credentials, and third-party trackers all came back clean.

## Can Money Quest launch without storing children's personal data at all, or with only a minimal pseudonymous profile?

**A fully anonymous launch is not realistically possible for this product** — a learning app that tracks a specific child's progress over time, lets them return to their own saved state, and lets a parent see what their own child has learned, inherently needs some persistent, distinguishable profile per child. That's not a limitation of this implementation; it's a structural requirement of the feature itself.

**But the architecture already is, and after this session more clearly is, the minimal pseudonymous version of that**: a child's profile consists of a random UUID (never derived from or containing any real identifier), a self-chosen nickname, an age band, a country/currency code, and an avatar built from a closed set of options. None of these, individually or combined, constitutes a real name, exact birth date, address, or any of the identifiers the original request explicitly asked to avoid. The profile is linked to a parent's account (itself identified only by email), not to any external identity system. This session's removal of the unused `birth_year` column was specifically about closing the gap between "the architecture is already minimal" and "the architecture cannot even latently hold more than it needs" — the two are different guarantees, and the schema now provides the stronger one.

**What this session did not do**: hash or further pseudonymise the nickname itself, or introduce a second layer of indirection between a child's profile and the parent's account. Those are real additional-hardening options a lawyer or security reviewer might recommend, not implemented here because the current design (a nickname visible only to the owning parent, under RLS) already meets a reasonable minimisation bar without them — adding complexity beyond that should be a deliberate decision made with the trade-offs it brings (e.g. a hashed nickname is harder for a parent to recognise their own child by).

## What Still Requires Human Legal Judgement

This section contains only items that cannot be resolved through code, configuration, documentation, or further engineering-level risk reduction — not ordinary engineering work.

1. **Confirmation that "contract" is the correct UK GDPR lawful basis** for processing a child's data via the parent's agreement, as actually implemented — a legal determination, not an engineering one.
2. **Confirmation of Anthropic's API-specific data-training terms** as configured on your actual account, and whether they meet your regulatory obligations for children's data specifically — a contract-review question, not a code question.
3. **Confirmation of Supabase's Data Processing Agreement terms and hosting region** against your specific regulatory obligations (e.g. data residency requirements) — an infrastructure-contract question.
4. **A determination of whether any specific future incident is an ICO-notifiable breach** — the procedure for this is written (`data-breach-response-procedure.md`); the judgement call on any real incident is not something a procedure document can make for you.
5. **Whether COPPA (if operating in/marketing to the US) requires a different consent mechanism** than the "parent is the account holder" model already implemented — the UK Children's Code and COPPA are related but distinct frameworks with different specific mechanics; this report used the ICO framework as instructed, and a US-specific legal review is a separate, genuinely necessary step if the US is a target market.
6. **A live penetration test's findings**, whatever they turn out to be — cannot be pre-judged by this report.
7. **Whether the AI Coach's residual prompt-injection risk (stated in `ai-coach-safety-privacy-policy.md`) is acceptable for your risk tolerance and regulatory obligations** — engineering can reduce this risk, and has (input/output moderation, age-banded prompts), but cannot mathematically eliminate it, and whether the remaining risk is acceptable to launch with is a judgement call, not a bug to fix.

## Deployment Checklist

### GREEN — completed and verified by code/tests
- Data minimisation: unused `birth_year` column removed
- Grown-up Mode PIN rate limiting (9 tests)
- Right to rectification (child nickname/age band correction)
- Right to erasure (per-child and full-account, both tested)
- Right to access/portability (data export)
- Cross-family and cross-child RLS isolation (re-verified, `owns_child()` consistently applied)
- AI Coach cross-user isolation (RLS-verified)
- AI Coach never stores conversation text (schema-verified)
- No third-party trackers, ad SDKs, or hardcoded secrets (fresh sweep this session)
- Retention mechanisms for the two time-bound logs (functions exist and are correct)
- Full document set: DPIA, Children's Code self-assessment, subprocessor register, retention policy, breach response procedure, data subject rights procedure, AI Coach safety policy, Children's/Parent privacy notices, cookie policy, updated Privacy Policy/ToS drafts
- Full regression suite: 22/22 passing; type-check clean; 21 migrations balanced

### YELLOW — requires your account access, configuration, payment, or manual action
- Scheduling the two retention-deletion functions (they exist; nothing currently calls them on a timer) — needs a cron job or scheduled function in your actual hosting/Supabase setup
- Confirming Anthropic's API training-data terms for your account
- Confirming Supabase's DPA and hosting region for your account
- Everything already listed in `launch-audit.md`'s four blockers (live pentest, lawyer sign-off, backup verification, monitoring activation) — unchanged by this session, still open, still genuinely requiring you

### RED — genuinely requires independent professional legal or security judgement
- All 7 items in "What Still Requires Human Legal Judgement" above.

## What was not built, stated honestly

Distinct "restriction of processing" and "objection" mechanisms remain partial, not full (see `data-subject-rights-procedure.md`). A "best interests of the child" standing review process for future features is not yet formalised as its own document (see the Children's Code self-assessment, Standard 1). Neither was silently skipped — both are named explicitly here rather than implied as done.
