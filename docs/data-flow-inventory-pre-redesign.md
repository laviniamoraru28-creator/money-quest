# Money Quest — Data-Flow Inventory (Before Privacy-First Redesign)

Written before any architectural change, as instructed. Covers every table in the live schema (16 tables — `ai_coach_interactions` was already dropped in an earlier session and is excluded as no longer existing).

| Data | Purpose | Where it goes | Stored? | Identifies a user? | Removable in the new architecture? |
|---|---|---|---|---|---|
| Parent email, password | Account login | Supabase Auth + `parents` table | Yes, until account deletion | Yes — directly | Yes — no accounts means no email is ever collected |
| Parent region (coarse) | Currency suggestion | `parents.region` | Yes | Indirectly (tied to the email above) | Yes — becomes a one-time local choice, never sent anywhere |
| Child nickname, age band, country/currency, avatar | Personalise the child's experience | `children` table | Yes, until deletion | Yes — a persistent profile tied to a parent account | Yes — becomes a local, unsaved interface preference |
| Learning progress, XP, level (`child_activity_progress`) | Track what's been completed | Supabase, RLS-scoped to the owning family | Yes | Yes (via `child_id`) | Yes — moves entirely to `localStorage`, never leaves the device |
| Wallet balance (`wallet_transactions`) | Fictional in-game currency for games/goals | Supabase | Yes | Yes (via `child_id`) | Yes — moves to `localStorage` |
| Savings goals (`savings_goals`) | A child's own goal-setting activity | Supabase | Yes | Yes (via `child_id`) | Yes — moves to `localStorage` |
| Badges earned (`badges`, `child_badges`) | Recognise demonstrated skill | Supabase | Yes | Yes (via `child_id`) | Yes — recomputed client-side from local progress, never stored server-side |
| Grown-up Mode PIN hash, lockout state | Separate parent settings from the child experience | `parents` table | Yes | Yes (tied to the account) | Yes — the concept of "parent settings separate from a child's device" doesn't apply once there's no account to gate |
| Login attempt log (`login_attempts`) | Brute-force protection on login | Supabase (service-role only) | Yes, 7 days | Weakly (email only) | Yes — no login means nothing to brute-force |
| Ad impressions (`ad_impressions`) | Aggregate ad reporting | Supabase | Yes | No (no identifier by design) | Yes — becomes moot once there's no account context to place a parent-facing ad zone against |
| Sponsors / world sponsorships | Static sponsor attribution | Supabase | Yes (metadata only, no live sponsors) | No | Yes — static content, can move to local data or be dropped entirely |
| Anonymous business/usage events (`anonymous_events`) | Aggregate, non-identifying analytics | Supabase | Yes | No — structurally no identifier of any kind | Removed anyway once the account/analytics layer it partly measured is gone — addressed in the redesign |
| Worlds, Activities (lesson/game/quiz content) | The actual educational content | Supabase (read-only reference data) | Yes | No — content has no personal data | Not personal data — but moved to static bundled content anyway, since Supabase becomes unnecessary once nothing else needs it |
| Currencies, currency regions | Currency display data | Supabase (read-only reference data) | Yes | No | Already static-compatible; moved to local data for the same reason as content above |

## What this inventory shows

Every row that identifies a user exists only because of the account/child-profile architecture. Once that architecture is removed, there is nothing left that identifies anyone — the remaining candidates (educational content, currency data) contain no personal data at all and can be served as static, bundled content with no database whatsoever.

**Conclusion driving the redesign below: Supabase is not technically required after this change.**
