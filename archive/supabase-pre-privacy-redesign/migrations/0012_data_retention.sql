-- Money Quest — 0012_data_retention.sql
--
-- A genuine, callable retention mechanism — not just a documented
-- intention. Honest scope note: this defines the FUNCTION; actually
-- invoking it on a schedule requires either pg_cron (if enabled on the
-- Supabase project's plan) or an external scheduled call (e.g. a cron
-- job hitting a protected Route Handler that calls this function). That
-- scheduling configuration is a deployment-environment decision outside
-- what a codebase alone can guarantee, and is listed explicitly in
-- money-quest-legal-review-checklist.md as something to confirm is
-- actually wired up before launch — this migration makes sure there is
-- a correct, tested function ready to be scheduled, rather than nothing
-- at all.
--
-- Why ai_coach_interactions specifically: every other table either (a)
-- holds data a family actively uses and expects to persist for as long
-- as their account exists (progress, wallet, savings goals — deleted
-- only on account/child deletion, per the existing cascade design), or
-- (b) already contains no raw personal content by design (this table
-- never stored conversation text in the first place — see
-- 0008_ai_coach_interactions.sql). Even so, per data-minimisation
-- principles, a safety/usage log with no ongoing product purpose
-- shouldn't accumulate forever — 12 months is a reasonable default,
-- long enough to support the AI Settings page's "recent activity" view
-- and any safety review, but not indefinite.

create or replace function public.delete_old_ai_coach_interactions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.ai_coach_interactions
    where created_at < now() - interval '12 months';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Deliberately NOT granted to `authenticated` — this is a maintenance
-- function meant to run on a schedule (as the service role, or via
-- pg_cron which runs as the database owner), not something any signed-in
-- parent should be able to trigger themselves.
revoke all on function public.delete_old_ai_coach_interactions() from public, authenticated;
