-- Money Quest — 0021_pin_attempt_lockout.sql
--
-- Found during the privacy/security architecture review: the
-- Grown-up Mode PIN check (verifyGrownUpPin, grown-up-gate/actions.ts)
-- had zero rate limiting on guesses. A 4-digit PIN is only 10,000
-- combinations — trivial to brute-force with an unthrottled script,
-- which is a materially different threat than the "stop a child
-- casually clicking around" scenario pin.ts's own comment describes.
--
-- Implemented as columns on `parents` directly (not a separate table
-- like login_attempts) because this check only ever runs for an
-- ALREADY-authenticated user — there's a real user.id to scope
-- against from the start, so the "must work pre-auth" reasoning that
-- justified a separate admin-only table for login_attempts doesn't
-- apply here. A simple lockout counter on the parent's own row,
-- writable only by the normal RLS-scoped client acting as that same
-- parent, is the more proportionate design.

alter table public.parents
  add column pin_failed_attempts smallint not null default 0,
  add column pin_locked_until timestamptz;

comment on column public.parents.pin_failed_attempts is
  'Consecutive failed Grown-up Mode PIN attempts since the last success. Reset to 0 on a correct PIN entry.';
comment on column public.parents.pin_locked_until is
  'If set and in the future, PIN entry is locked out until this time — set after 5 consecutive failures (see verifyGrownUpPin in grown-up-gate/actions.ts).';

grant update (pin_failed_attempts, pin_locked_until) on public.parents to authenticated;
