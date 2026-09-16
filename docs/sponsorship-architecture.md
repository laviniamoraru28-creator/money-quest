# Money Quest — Sponsorship Architecture

**Status: architecture only, per the brief's explicit instruction.** No real sponsor exists in this codebase — `sponsors` and `world_sponsorships` (migration `0014_sponsorships.sql`) are both empty. Every World renders with no sponsorship credit today. This document describes what's built and what governs it once a real sponsor is ever added.

---

## 1. The core design decision: sponsorship is static attribution, not a live integration

Money Quest's advertising system (see `advertising-architecture.md`) needs a live request/response relationship with a provider — an ad has to be fetched per page view. Sponsorship doesn't work that way, and modeling it as if it did would be over-engineering that also happens to create unnecessary risk surface. A sponsorship is a fixed, staff-approved fact: "Organisation X is the educational partner for World Y, credited with this exact line." It doesn't change per request, doesn't need real-time fetching, and critically, **a sponsor never has an account, an API key, or any access to this system at all.**

This single decision is what makes several of the brief's prohibitions true by construction rather than by policy:

| Requirement | Why it's structurally true |
|---|---|
| Sponsors must not receive children's personal data | There is no code path — no API, no webhook, no export — by which a sponsor could receive anything. The entire relationship is: staff write two rows in a database, off-platform, using the service-role client. |
| Sponsors must not directly communicate with children | No sponsor account, no sponsor login, no messaging table connects `sponsors` to `children` in any way. |
| Sponsors must not create child profiles | Sponsors have zero write access to anything — see §3. |

## 2. Data model

```
sponsors                          world_sponsorships
├── id                            ├── id
├── organisation_name             ├── world_id  -> references worlds(id)
├── logo_asset_path (local only)  ├── sponsor_id -> references sponsors(id)
├── website_url                   ├── display_credit_line  (exact, pre-approved text)
├── description                   ├── starts_at
├── category                      └── ends_at (null = ongoing)
├── status (pending/approved/
|           rejected/suspended)
├── review_notes
└── reviewed_at
```

`world_sponsorships` references **only** `worlds` — never `activities`, never `child_activity_progress`, never anything more granular than the largest content grouping in the product. `scripts/test-sponsorship-decoupling.ts` verifies this holds against the actual schema and scans all 39 files in the content-authoring and scoring code paths (`src/game-engine/`, `src/simulator/`, `LessonPlayer.tsx`, the `complete_activity()` RPC) confirming none of them import anything from the sponsorship module. This is checked, not asserted.

A World can have at most one **active** sponsorship at a time (enforced by a partial unique index on `world_sponsorships.world_id where ends_at is null`) — a schema-level guarantee against confusing double-attribution, not something the application layer has to remember to check.

## 3. Who can write sponsorship data

**Nobody, via the normal client.** Both tables have RLS enabled with a read policy for signed-in users (a sponsorship credit is public, family-facing text — the same visibility as a World's own name) but **no insert, update, or delete policy for `authenticated` at all**. The only way a sponsorship record is ever created is via the service-role client, as part of an internal staff process, exactly like the account-deletion and ad-reporting use cases already documented in `src/lib/supabase/admin.ts`.

This means there is currently no admin UI in this codebase for staff to manage sponsorships — that's a deliberate scope boundary for this increment, not an oversight. Building a full internal CMS wasn't asked for; the data model and its access-control guarantees were. A minimal internal tool (or direct database access by an authorised engineer) is sufficient to populate these tables when the first real sponsorship is approved.

## 4. Visibility rules

- `sponsors_read_approved_only`: a sponsor row is invisible to every signed-in family unless `status = 'approved'`. A `pending` or `rejected` sponsor cannot be discovered by any client query, regardless of application-layer filtering — this is enforced by Postgres itself.
- `world_sponsorships_read_active`: a sponsorship is invisible unless both its own `ends_at` window is current AND its linked sponsor is approved. An expired or unapproved sponsorship simply doesn't exist from any signed-in user's point of view.

## 5. Sponsors must not control educational conclusions — the concrete mechanism

Beyond the structural separation in §2 (a sponsor literally cannot reach activity or content data), `src/lib/sponsorship/eligibility-rules.ts` implements one specific, real rule: a `financial-institution`-category sponsor is ineligible to sponsor any World whose activities substantially cover borrowing, debt, risk, investing, interest, or scam/phishing awareness — the exact topics where a real financial institution has a direct commercial stake in which conclusion a child reaches. This is checked with real test cases (`scripts/test-sponsor-eligibility.ts`, 11 checks) confirming both that the restriction fires for conflict topics and that it doesn't over-apply to unrelated topics or other sponsor categories.

This is deliberately narrow rather than a blanket restriction on any category — the goal is preventing a specific, identifiable conflict of interest, not making entire categories of legitimate educational partner unusable everywhere.

Two things this rule does **not** claim to solve, stated honestly:
- It doesn't catch every conceivable subtler influence (e.g. a general "brand awareness" sponsor whose mere presence might make an editor unconsciously softer on a related topic) — that's an editorial-process question, not something a category-matching rule can fully guarantee.
- The `display_credit_line` itself is free text, reviewed and approved by staff per sponsorship, not validated by any automated rule here — the wording review is a human editorial responsibility, matching how the exact wording is stored verbatim rather than auto-generated (§2).

## 6. Clear labelling

`SponsorCredit.tsx` renders every credit with an explicit "EDUCATIONAL PARTNER" label above the credit line, visually distinct (bordered box, muted background) from the World's own content. It is deliberately non-interactive for every audience — no link, no button — which is a stronger and simpler guarantee than the advertising system's audience-specific split (`ParentAdSlot` vs `ChildAdSlot`): since a sponsor credit is attribution rather than a commercial call-to-action, there's no version of it that needs to be clickable at all, for anyone.

## 7. Before a real sponsor is added

1. A minimal internal process (even a documented manual runbook is sufficient to start) for reviewing and approving a proposed sponsor and its exact credit line — this codebase provides the data model `status` field and `review_notes` column for this, not a full workflow UI.
2. Legal review of the sponsorship arrangement itself (a commercial relationship, distinct from the advertising provider review already listed in `legal-review-checklist.md` — worth adding as its own item there).
3. A decision on whether `eligibility-rules.ts`'s conflict-of-interest list should be extended to any category beyond `financial-institution` as real proposals come in — the current rule reflects the most obvious conflict for a financial-literacy product specifically, not an exhaustive list.
