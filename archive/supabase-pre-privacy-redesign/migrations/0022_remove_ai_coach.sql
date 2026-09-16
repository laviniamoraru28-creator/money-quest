-- Money Quest — 0022_remove_ai_coach.sql
--
-- Product decision, not a bug fix: the AI Coach (conversational AI
-- tutor feature) is removed from V1 scope entirely. This app now has
-- zero dependency on any AI API — the simplest, most reliable, lowest-
-- complexity version of this product doesn't need a conversational AI
-- feature to deliver real financial education (lessons, quizzes,
-- games, and progress tracking do that on their own).
--
-- Per the "create appropriate cleanup migrations" principle rather
-- than editing or deleting past migration files (0008, 0012 stay as
-- historical record — deleting them would break replay for anyone who
-- already applied them), this migration reverses exactly what they
-- added: the table, its retention function, and the one column on
-- `children` that toggled the feature per-child.

drop function if exists public.delete_old_ai_coach_interactions();
drop table if exists public.ai_coach_interactions;

alter table public.children drop column if exists ai_coach_enabled;

comment on table public.children is
  'One row per child profile, owned by a parent. No AI-related columns remain — see 0022_remove_ai_coach.sql for why.';

-- Note left deliberately: `parents.notification_preferences` (a jsonb
-- blob, 0009_notification_preferences.sql) may still contain an
-- `aiCoachFlagAlerts` key on existing rows from before this migration.
-- That key is simply ignored by application code going forward — a
-- harmless orphaned key in a jsonb blob is not worth a data migration
-- to strip out, unlike a real table/column that could be queried,
-- joined, or exposed.
