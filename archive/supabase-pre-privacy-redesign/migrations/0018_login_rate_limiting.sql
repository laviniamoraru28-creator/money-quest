-- Money Quest — 0018_login_rate_limiting.sql
--
-- Found during a security audit: zero application-level protection
-- existed against brute-force login attempts — the app relied entirely
-- on Supabase Auth's own infrastructure-level rate limiting, which is
-- real but not something application code controls or can be certain
-- is sufficient for this specific product. This table and its
-- accompanying application logic (src/lib/auth/login-rate-limit.ts)
-- add a genuine, in-app layer of defense.
--
-- Deliberately keyed by email, not by user id — a login attempt
-- happens BEFORE authentication succeeds, so there is no session/user
-- id to key against yet, and the entire point is to protect against
-- repeated guesses at a specific email's password regardless of
-- whether any of those guesses ever succeed.

create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

comment on table public.login_attempts is
  'Login attempt log for brute-force rate limiting only (src/lib/auth/login-rate-limit.ts). Never used to build a profile of a person''s behaviour beyond this narrow security purpose, and never exposed to any client — see the absence of RLS policies below.';

create index idx_login_attempts_email_time on public.login_attempts(email, created_at desc);

alter table public.login_attempts enable row level security;
-- No policy for `authenticated` OR `anon` — a login attempt happens
-- BEFORE authentication succeeds (there is no session yet to scope a
-- normal policy against), so this table is written and read
-- exclusively via the service-role client
-- (src/lib/auth/login-rate-limit.ts), the same reasoning already
-- applied to ad_impressions and anonymous_events: this data has no
-- per-row "owner" a normal policy could check, for a different but
-- related reason — here it's that the very check this table exists to
-- perform has to run before we know who, if anyone, is making the
-- request.

-- Old rows are not useful indefinitely — a lightweight cleanup
-- function, same pattern as delete_old_ai_coach_interactions()
-- (0012_data_retention.sql). Scheduling it is a deployment step, not
-- something this migration can guarantee on its own; see
-- money-quest-security-audit.md.
create or replace function public.delete_old_login_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.login_attempts where created_at < now() - interval '7 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_old_login_attempts() from public, authenticated;
