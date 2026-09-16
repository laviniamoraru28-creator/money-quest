-- Money Quest — 0009_notification_preferences.sql
--
-- Notification preferences are account-level (a parent decides whether
-- THEY want a weekly email, not something that varies per child), so
-- this lives on `parents`, not `children` — distinct from
-- screen_time_limit_minutes (0001_init_schema.sql), which is correctly
-- per-child since different children in the same family may have
-- different screen-time rules.

alter table public.parents
  add column notification_preferences jsonb not null default '{
    "weeklyReportEmail": true,
    "aiCoachFlagAlerts": true,
    "productUpdates": false
  }'::jsonb;

comment on column public.parents.notification_preferences is
  'Account-level notification settings. weeklyReportEmail: the auto-generated weekly report; aiCoachFlagAlerts: notify promptly when an AI Coach interaction is flagged (kept default-on — this is a safety notification, not marketing, see money-quest-parent-dashboard.md); productUpdates: optional marketing/product-news email, default off.';

grant update (notification_preferences) on public.parents to authenticated;
