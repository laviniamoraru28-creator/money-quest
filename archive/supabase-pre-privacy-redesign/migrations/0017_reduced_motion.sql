-- Money Quest — 0017_reduced_motion.sql
--
-- An in-app reduced-motion control, additive to the OS-level
-- `prefers-reduced-motion` CSS media query that has existed since the
-- original design-system build (src/app/globals.css) — that rule
-- already respects the device's own setting; what it can't do is help
-- a child whose device/browser doesn't expose that setting easily, or
-- whose parent wants to turn it on for them without changing anything
-- system-wide. Motion sensitivity (vestibular disorders, migraines,
-- some sensory-processing differences) is a genuinely individual need,
-- so this is per-child — same reasoning already applied to
-- ai_coach_enabled and screen_time_limit_minutes.

alter table public.children
  add column reduced_motion boolean not null default false;

comment on column public.children.reduced_motion is
  'In-app reduced-motion preference, independent of (and additive to) the OS-level prefers-reduced-motion media query already respected globally. See src/app/globals.css and money-quest-accessibility-audit.md.';

grant update (reduced_motion) on public.children to authenticated;
