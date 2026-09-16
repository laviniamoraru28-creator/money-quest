-- Money Quest — 0002_rls_policies.sql
--
-- Security model summary:
--   1. Row Level Security is ON for every table containing parent or
--      child data. The anon/authenticated Supabase keys used by the
--      Next.js app have NO special privilege — RLS is what actually
--      protects data, not "the app knows not to ask for it."
--   2. A parent can only ever see/modify rows belonging to their own
--      children. There is no child-level auth (per the product
--      architecture), so "is this the right child" is enforced by the
--      application always scoping queries to a child_id the signed-in
--      parent owns — and RLS independently double-checks that same
--      ownership at the database layer, so a bug in the application
--      code cannot leak another family's data.
--   3. Gameplay actions that change XP, coins, or wallet balance are
--      NEVER done via a direct client-side UPDATE/INSERT. They go
--      through SECURITY DEFINER functions (bottom of this file) that
--      validate ownership, apply business rules server-side, and are
--      the only code path allowed to touch those columns. This closes
--      off the obvious attack of a modified client simply setting
--      xp_total = 999999 via a raw table update.
--   4. Reference/curriculum data (currencies, worlds, activities,
--      badges) is read-only for the authenticated role and has no
--      client-facing write path at all — it is maintained only via
--      migrations and the service role.

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.currencies enable row level security;
alter table public.currency_regions enable row level security;
alter table public.worlds enable row level security;
alter table public.activities enable row level security;
alter table public.child_activity_progress enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.badges enable row level security;
alter table public.child_badges enable row level security;

-- ============================================================
-- Helper: does the signed-in user own this child?
-- STABLE + SECURITY DEFINER so it can be used inside policies without
-- each policy re-deriving the parent_id -> auth_user_id join itself.
-- ============================================================
create or replace function public.owns_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.children c
    join public.parents p on p.id = c.parent_id
    where c.id = p_child_id
      and p.auth_user_id = auth.uid()
  );
$$;

-- ============================================================
-- PARENTS — a parent can only see/update their own row
-- ============================================================
create policy "parents_select_own" on public.parents
  for select using (auth_user_id = auth.uid());

create policy "parents_update_own" on public.parents
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Parent row creation happens via a server-side handler immediately
-- after Supabase Auth sign-up (src/app/signup/actions.ts), using the
-- authenticated user's own auth.uid() — so an INSERT policy scoped the
-- same way is safe and does not need the service role for this step.
create policy "parents_insert_self" on public.parents
  for insert with check (auth_user_id = auth.uid());

-- No delete policy: account deletion is a dedicated, audited server-side
-- flow (Data Management, a later feature), not a raw client-side DELETE.

-- ============================================================
-- CHILDREN — a parent can fully manage their own children
-- ============================================================
create policy "children_select_own" on public.children
  for select using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_insert_own" on public.children
  for insert with check (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_update_own" on public.children
  for update using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  )
  with check (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_delete_own" on public.children
  for delete using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

-- Column-level privilege split (Section design note above): gameplay
-- columns are excluded from the general UPDATE grant and can only be
-- changed by the SECURITY DEFINER functions below, which run with
-- elevated privilege regardless of the calling role's column grants.
revoke update on public.children from authenticated;
grant update (
  display_name, age_band, country_code, currency_code, avatar_config,
  ai_coach_enabled, screen_time_limit_minutes
) on public.children to authenticated;
-- xp_total, level, onboarding_completed_at deliberately NOT granted —
-- only public.complete_activity() (below) may change them.

-- ============================================================
-- REFERENCE DATA — read-only for authenticated users, no client writes
-- ============================================================
create policy "currencies_read" on public.currencies for select using (auth.role() = 'authenticated');
create policy "currency_regions_read" on public.currency_regions for select using (auth.role() = 'authenticated');
create policy "worlds_read" on public.worlds for select using (auth.role() = 'authenticated');
create policy "activities_read" on public.activities for select using (auth.role() = 'authenticated');
create policy "badges_read" on public.badges for select using (auth.role() = 'authenticated');

-- ============================================================
-- CHILD ACTIVITY PROGRESS — parent can read; writes go through
-- complete_activity() only (no insert/update policy granted here)
-- ============================================================
create policy "progress_select_own_child" on public.child_activity_progress
  for select using (public.owns_child(child_id));

-- ============================================================
-- WALLET TRANSACTIONS — parent can read; all writes are server-side
-- (complete_activity, contribute_to_goal) — no client insert policy
-- ============================================================
create policy "wallet_select_own_child" on public.wallet_transactions
  for select using (public.owns_child(child_id));

-- ============================================================
-- SAVINGS GOALS — parent/child can create and view goals; contributing
-- coins to a goal goes through contribute_to_goal() to keep the wallet
-- balance and goal progress consistent in one transaction
-- ============================================================
create policy "goals_select_own_child" on public.savings_goals
  for select using (public.owns_child(child_id));

create policy "goals_insert_own_child" on public.savings_goals
  for insert with check (public.owns_child(child_id));

create policy "goals_update_own_child_metadata" on public.savings_goals
  for update using (public.owns_child(child_id))
  with check (public.owns_child(child_id));

revoke update on public.savings_goals from authenticated;
grant update (goal_name, icon_key) on public.savings_goals to authenticated;
-- current_amount_minor_units and achieved_at are only changed by
-- contribute_to_goal(), never a direct client update.

create policy "goals_delete_own_child" on public.savings_goals
  for delete using (public.owns_child(child_id));

-- ============================================================
-- CHILD BADGES — read-only for the owning parent; badges are only ever
-- awarded by server-side logic (a future award_badge() function,
-- scoped identically to complete_activity() below)
-- ============================================================
create policy "child_badges_select_own_child" on public.child_badges
  for select using (public.owns_child(child_id));

-- ============================================================
-- GAMEPLAY FUNCTIONS (SECURITY DEFINER) — the only writers of
-- gameplay-sensitive columns
-- ============================================================

-- Completes an activity for a child: records progress, awards XP,
-- recalculates level, and credits any coin reward to the wallet — all
-- in one transaction so these three effects can never drift out of sync.
create or replace function public.complete_activity(
  p_child_id uuid,
  p_activity_id text,
  p_quiz_correct boolean default null
)
returns table (new_xp_total integer, new_level integer, xp_awarded integer, coins_awarded integer, was_first_completion boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp_reward integer;
  v_coin_reward integer;
  v_activity_title text;
  v_new_xp integer;
  v_new_level integer;
  v_already_completed boolean;
begin
  if not public.owns_child(p_child_id) then
    raise exception 'Not authorized for this child';
  end if;

  select xp_reward, coin_reward_minor_units, title
    into v_xp_reward, v_coin_reward, v_activity_title
    from public.activities
    where id = p_activity_id;

  if v_xp_reward is null then
    raise exception 'Unknown activity: %', p_activity_id;
  end if;

  -- Capture completion state BEFORE the upsert, so we can tell a fresh
  -- completion apart from a replay and never award XP/coins twice for
  -- the same activity.
  select exists (
    select 1 from public.child_activity_progress
    where child_id = p_child_id and activity_id = p_activity_id and status = 'completed'
  ) into v_already_completed;

  insert into public.child_activity_progress
    (child_id, activity_id, status, quiz_correct, xp_awarded, completed_at)
  values
    (p_child_id, p_activity_id, 'completed', p_quiz_correct, v_xp_reward, now())
  on conflict (child_id, activity_id)
  do update set
    status = 'completed',
    quiz_correct = excluded.quiz_correct,
    completed_at = now();

  if v_already_completed then
    -- Replaying an already-completed activity: progress/quiz result can
    -- update, but XP and coins are never re-awarded.
    select xp_total, level into v_new_xp, v_new_level from public.children where id = p_child_id;
    return query select v_new_xp, v_new_level, 0, 0, false;
  end if;

  update public.children
    set xp_total = xp_total + v_xp_reward
    where id = p_child_id
    returning xp_total into v_new_xp;

  v_new_level := floor(v_new_xp / 100.0)::integer + 1;
  update public.children set level = v_new_level where id = p_child_id;

  if v_coin_reward > 0 then
    insert into public.wallet_transactions
      (child_id, amount_minor_units, direction, source, description, related_activity_id)
    values
      (p_child_id, v_coin_reward, 'credit', 'activity_reward',
       'Reward for completing "' || v_activity_title || '"', p_activity_id);
  end if;

  return query select v_new_xp, v_new_level, v_xp_reward, v_coin_reward, true;
end;
$$;

revoke all on function public.complete_activity(uuid, text, boolean) from public;
grant execute on function public.complete_activity(uuid, text, boolean) to authenticated;

-- Moves coins from a child's wallet into a savings goal, atomically.
create or replace function public.contribute_to_goal(
  p_child_id uuid,
  p_goal_id uuid,
  p_amount_minor_units integer
)
returns table (new_wallet_balance integer, new_goal_amount integer, goal_achieved boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_target integer;
  v_current integer;
  v_new_current integer;
  v_achieved boolean;
begin
  if not public.owns_child(p_child_id) then
    raise exception 'Not authorized for this child';
  end if;

  if p_amount_minor_units <= 0 then
    raise exception 'Contribution amount must be positive';
  end if;

  select coalesce(sum(case when direction = 'credit' then amount_minor_units else -amount_minor_units end), 0)
    into v_balance
    from public.wallet_transactions
    where child_id = p_child_id;

  if v_balance < p_amount_minor_units then
    raise exception 'Insufficient wallet balance';
  end if;

  select target_amount_minor_units, current_amount_minor_units
    into v_target, v_current
    from public.savings_goals
    where id = p_goal_id and child_id = p_child_id;

  if v_target is null then
    raise exception 'Goal not found for this child';
  end if;

  insert into public.wallet_transactions
    (child_id, amount_minor_units, direction, source, description, related_goal_id)
  values
    (p_child_id, p_amount_minor_units, 'debit', 'savings_goal', 'Added to savings goal', p_goal_id);

  v_new_current := least(v_current + p_amount_minor_units, v_target);
  v_achieved := v_new_current >= v_target;

  update public.savings_goals
    set current_amount_minor_units = v_new_current,
        achieved_at = case when v_achieved and achieved_at is null then now() else achieved_at end
    where id = p_goal_id;

  return query select v_balance - p_amount_minor_units, v_new_current, v_achieved;
end;
$$;

revoke all on function public.contribute_to_goal(uuid, uuid, integer) from public;
grant execute on function public.contribute_to_goal(uuid, uuid, integer) to authenticated;
