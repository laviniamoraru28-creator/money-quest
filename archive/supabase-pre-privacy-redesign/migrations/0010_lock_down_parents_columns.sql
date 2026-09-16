-- Money Quest — 0010_lock_down_parents_columns.sql
--
-- Fixes a real gap found during review: unlike `children` (which
-- 0002_rls_policies.sql deliberately restricts to specific
-- client-updatable columns via revoke+grant), `parents` never received
-- the same column-level lockdown — every column-specific grant added
-- since (0007's `locale`, 0009's `notification_preferences`) was
-- ADDITIVE on top of an already-wide-open table, not restrictive.
--
-- Concretely, this meant `email` was updatable via a raw client-side
-- table update — bypassing Supabase Auth's actual email-change/
-- verification flow entirely, and risking `parents.email` silently
-- drifting out of sync with the real login email in `auth.users`. Same
-- rationale, real severity, as why children.xp_total/level/
-- onboarding_completed_at are column-restricted: a value that must only
-- ever be changed through a specific trusted flow should not also be
-- reachable through a generic table update.

revoke update on public.parents from authenticated;

grant update (region, locale, marketing_opt_in, notification_preferences)
  on public.parents to authenticated;

-- email and auth_user_id are deliberately NOT in this grant:
--   - email must only change via Supabase Auth's own email-change flow
--     (which updates auth.users directly; parents.email should be kept
--     in sync by a trigger or application-level sync step in a future
--     increment — flagged here rather than silently left inconsistent).
--   - auth_user_id must never change after the row is created; it is
--     the entire basis every RLS policy in this project uses to prove
--     row ownership.
