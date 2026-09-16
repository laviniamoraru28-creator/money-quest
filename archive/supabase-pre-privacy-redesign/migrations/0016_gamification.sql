-- Money Quest — 0016_gamification.sql
--
-- Streaks, badges (including the 9 named skill badges + a few
-- milestone achievements), and the award functions that check for and
-- grant them. XP and Levels already exist (0001_init_schema.sql,
-- complete_activity() in 0002_rls_policies.sql) and are NOT modified
-- here — see money-quest-gamification-ethics.md §2 for why the core
-- XP formula was deliberately left alone this increment, and why
-- badges (built here) are the system that concretely enforces
-- "progression based on demonstrated skills" instead.
--
-- Ethical design encoded directly in this schema, not just in policy:
--   - Every badge-award check below requires quiz_correct = true on
--     the relevant activity — never mere completion, never time spent,
--     never login count. A child who completes a game without getting
--     it right does not earn the badge tied to that game.
--   - Streak advancement (record_daily_streak) only ever fires from a
--     CORRECT completion (see the Server Action that calls it,
--     src/app/[locale]/actions/complete-activity.ts) — never from
--     opening the app.
--   - No column here can hold a random-chance outcome, a purchasable
--     unlock, or a paid-boost flag — there is nothing in this schema
--     capable of representing a loot box even by accident.

alter table public.children
  add column current_streak_days integer not null default 0,
  add column longest_streak_days integer not null default 0,
  add column last_streak_date date;

comment on column public.children.current_streak_days is
  'Consecutive days with at least one CORRECTLY completed activity. See src/lib/gamification/streak-logic.ts for the tested reference logic this column''s updates mirror.';

alter table public.badges
  add column badge_type text not null default 'skill' check (badge_type in ('skill', 'milestone'));

comment on column public.badges.badge_type is
  'skill: tied to demonstrating a specific ability (e.g. correctly completing a specific game). milestone: tied to cumulative, already-verified progress (e.g. reaching a level) — still never time-based, since level itself only advances via genuine activity completion.';

-- The 9 named skill badges from the brief, each with a criterion
-- checked entirely from a child's own real progress data — see
-- check_and_award_badges() below for exactly how each is evaluated.
insert into public.badges (name, description, icon_key, criteria_description, badge_type) values
  ('First Saver', 'Correctly complete a Save or Spend activity.', 'piggy-bank', 'Complete the Save or Spend game with a correct answer.', 'skill'),
  ('Smart Shopper', 'Correctly complete a Smart Shopper activity.', 'shopping-cart', 'Complete the Smart Shopper game with a correct answer.', 'skill'),
  ('Goal Getter', 'Reach a savings goal.', 'target', 'Fully fund a savings goal you set for yourself.', 'skill'),
  ('Budget Builder', 'Correctly complete a Build a Budget activity.', 'pie-chart', 'Complete the Build a Budget game with a correct allocation.', 'skill'),
  ('Price Detective', 'Correctly complete a Price Detective activity.', 'magnifying-glass', 'Complete the Price Detective game with a correct answer.', 'skill'),
  ('Money Explorer', 'Try an activity in three different Worlds.', 'map', 'Complete at least one activity correctly in three different Worlds.', 'skill'),
  ('Scam Detective', 'Correctly complete a Scam Detective activity.', 'shield', 'Complete the Scam Detective game with a correct answer.', 'skill'),
  ('Currency Explorer', 'Correctly complete a Currency Explorer activity.', 'globe', 'Complete the Currency Explorer game with a correct answer.', 'skill'),
  ('Future Thinker', 'Reach your goal in the Money Life Simulator.', 'compass', 'Complete a Money Life Simulator scenario and reach its savings goal.', 'skill'),
  ('Getting Started', 'Complete your first activity.', 'star', 'Complete any activity for the first time.', 'milestone'),
  ('Ten in a Row', 'Complete ten activities correctly.', 'trophy', 'Correctly complete ten activities in total.', 'milestone'),
  ('Level Five', 'Reach Level 5.', 'medal', 'Reach Level 5 through genuine activity completion.', 'milestone')
on conflict do nothing;

-- Checks a child's real progress data against every badge's criteria
-- and awards any newly-earned ones. Idempotent — safe to call after
-- every correct completion, never double-awards (child_badges has no
-- unique-violation risk because of the explicit not-already-earned
-- check in each branch below).
create or replace function public.check_and_award_badges(p_child_id uuid)
returns table (newly_awarded_badge_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge_id uuid;
  v_badge_name text;
  v_world_count integer;
  v_correct_count integer;
  v_level integer;
begin
  if not public.owns_child(p_child_id) then
    raise exception 'Not authorized for this child';
  end if;

  -- Skill badges: correct completion of one specific game, by key,
  -- regardless of which age-band variant was played (activity ids
  -- follow the pattern game-{ageBand}-{gameKey} — see
  -- 0005_seed_games.sql).
  for v_badge_name, v_badge_id in
    select b.name, b.id from public.badges b
    where b.badge_type = 'skill'
      and b.name in ('First Saver', 'Smart Shopper', 'Budget Builder', 'Price Detective', 'Scam Detective', 'Currency Explorer')
  loop
    if not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
      if exists (
        select 1 from public.child_activity_progress cap
        where cap.child_id = p_child_id
          and cap.status = 'completed'
          and cap.quiz_correct = true
          and cap.activity_id like 'game-%-' || (case v_badge_name
            when 'First Saver' then 'save-or-spend'
            when 'Smart Shopper' then 'smart-shopper'
            when 'Budget Builder' then 'build-a-budget'
            when 'Price Detective' then 'price-detective'
            when 'Scam Detective' then 'scam-detective'
            when 'Currency Explorer' then 'currency-explorer'
          end)
      ) then
        insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
        newly_awarded_badge_name := v_badge_name;
        return next;
      end if;
    end if;
  end loop;

  -- Goal Getter: at least one achieved savings goal.
  select id into v_badge_id from public.badges where name = 'Goal Getter';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    if exists (select 1 from public.savings_goals where child_id = p_child_id and achieved_at is not null) then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Goal Getter';
      return next;
    end if;
  end if;

  -- Future Thinker: correctly-completed Challenge activity (the Money
  -- Life Simulator is the only current activity_type = 'challenge'
  -- content — see 0006_seed_simulator.sql).
  select id into v_badge_id from public.badges where name = 'Future Thinker';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    if exists (
      select 1 from public.child_activity_progress cap
      join public.activities a on a.id = cap.activity_id
      where cap.child_id = p_child_id and cap.status = 'completed' and cap.quiz_correct = true
        and a.activity_type = 'challenge'
    ) then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Future Thinker';
      return next;
    end if;
  end if;

  -- Money Explorer: correct completion in 3+ distinct Worlds.
  select id into v_badge_id from public.badges where name = 'Money Explorer';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    select count(distinct a.world_id) into v_world_count
      from public.child_activity_progress cap
      join public.activities a on a.id = cap.activity_id
      where cap.child_id = p_child_id and cap.status = 'completed' and cap.quiz_correct = true;
    if v_world_count >= 3 then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Money Explorer';
      return next;
    end if;
  end if;

  -- Milestone: Getting Started (first completion of any kind).
  select id into v_badge_id from public.badges where name = 'Getting Started';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    if exists (select 1 from public.child_activity_progress where child_id = p_child_id and status = 'completed') then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Getting Started';
      return next;
    end if;
  end if;

  -- Milestone: Ten in a Row (ten CORRECT completions in total — not
  -- ten completions regardless of correctness).
  select id into v_badge_id from public.badges where name = 'Ten in a Row';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    select count(*) into v_correct_count from public.child_activity_progress
      where child_id = p_child_id and status = 'completed' and quiz_correct = true;
    if v_correct_count >= 10 then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Ten in a Row';
      return next;
    end if;
  end if;

  -- Milestone: Level Five.
  select id into v_badge_id from public.badges where name = 'Level Five';
  if v_badge_id is not null and not exists (select 1 from public.child_badges where child_id = p_child_id and badge_id = v_badge_id) then
    select level into v_level from public.children where id = p_child_id;
    if v_level >= 5 then
      insert into public.child_badges (child_id, badge_id) values (p_child_id, v_badge_id);
      newly_awarded_badge_name := 'Level Five';
      return next;
    end if;
  end if;

  return;
end;
$$;

revoke all on function public.check_and_award_badges(uuid) from public;
grant execute on function public.check_and_award_badges(uuid) to authenticated;

-- Mirrors src/lib/gamification/streak-logic.ts's computeStreakUpdate()
-- exactly — same three cases (same day / consecutive day / gap), same
-- "preserve the longest record, reset current to 1 not 0" behavior.
-- The TS version is the one with real unit tests
-- (scripts/test-streak-logic.ts) covering the edge cases (month
-- boundaries, leap years, idempotent same-day calls); this SQL
-- function is the one that actually runs, kept manually consistent
-- with it rather than sharing code across the language boundary.
create or replace function public.record_daily_streak(p_child_id uuid)
returns table (new_current_streak integer, new_longest_streak integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_date date;
  v_current integer;
  v_longest integer;
  v_today date := current_date;
  v_day_gap integer;
begin
  if not public.owns_child(p_child_id) then
    raise exception 'Not authorized for this child';
  end if;

  select last_streak_date, current_streak_days, longest_streak_days
    into v_last_date, v_current, v_longest
    from public.children where id = p_child_id;

  if v_last_date = v_today then
    -- Already recorded today — no change, same as the TS reference.
    return query select v_current, v_longest;
    return;
  end if;

  if v_last_date is not null then
    v_day_gap := v_today - v_last_date;
  else
    v_day_gap := null;
  end if;

  if v_day_gap = 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.children
    set current_streak_days = v_current, longest_streak_days = v_longest, last_streak_date = v_today
    where id = p_child_id;

  return query select v_current, v_longest;
end;
$$;

revoke all on function public.record_daily_streak(uuid) from public;
grant execute on function public.record_daily_streak(uuid) to authenticated;
