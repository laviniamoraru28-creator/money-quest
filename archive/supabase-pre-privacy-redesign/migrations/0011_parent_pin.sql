-- Money Quest — 0011_parent_pin.sql
--
-- Adds a lightweight PIN specifically for the "Grown-up mode" barrier
-- between the Child Area and the Parent Dashboard — fixing a real,
-- previously-flagged gap: with no separate child authentication in this
-- architecture (a child never has their own login credentials), the
-- "Grown-up mode" link was, until this migration, just a direct,
-- unprotected navigation to /parent from within an already-authenticated
-- parent browser session. This migration and its accompanying
-- application code (src/lib/auth/pin.ts, src/app/[locale]/grown-up-gate)
-- close that gap.
--
-- Honest threat-model note: a 4-6 digit PIN is not cryptographically
-- strong against a determined attacker with direct database access —
-- that was never its purpose. Its purpose is to stop a child casually
-- tapping a link and landing on parent settings, which it does
-- effectively. The real security boundary protecting the data itself
-- remains Row Level Security and Supabase Auth, unchanged by this.

alter table public.parents
  add column parent_pin_hash text; -- nullable: null means no PIN set yet, see the gate page's bootstrap flow

comment on column public.parents.parent_pin_hash is
  'Salted hash (format "salt:hash", see src/lib/auth/pin.ts) of the Grown-up Mode PIN. NEVER the plaintext PIN. Null until the parent sets one, which the gate page requires proving account-password ownership to do the first time.';

-- Deliberately NOT added to the general client-update grant
-- (0010_lock_down_parents_columns.sql) — this column is only ever
-- written via the SECURITY DEFINER function below, called from
-- setParentPin() after independently re-verifying the account password,
-- the same pattern already used for gameplay-sensitive columns on
-- `children` (see complete_activity() in 0002_rls_policies.sql).

create or replace function public.set_parent_pin(p_new_pin_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.parents
    set parent_pin_hash = p_new_pin_hash
    where auth_user_id = auth.uid();
end;
$$;

revoke all on function public.set_parent_pin(text) from public;
grant execute on function public.set_parent_pin(text) to authenticated;
