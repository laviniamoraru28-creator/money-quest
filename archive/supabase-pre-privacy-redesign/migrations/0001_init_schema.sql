-- Money Quest — 0001_init_schema.sql
-- Core schema. Row Level Security policies live in 0002_rls_policies.sql
-- (kept separate deliberately, so schema changes and access-control
-- changes are reviewable independently).
--
-- Design notes:
--   - Every child-facing monetary amount is stored in MINOR UNITS as an
--     integer (never a float), per the currency architecture. This avoids
--     floating-point rounding bugs in a system that will eventually
--     support a zero-decimal currency (JPY) alongside two-decimal ones.
--   - No table stores a child's real name, address, school, or any
--     financial/payment information — see the child_privacy comment on
--     the `children` table below for exactly what is and isn't captured.

create extension if not exists "pgcrypto";

-- ============================================================
-- PARENTS
-- ============================================================
create table public.parents (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  region text,                          -- coarse region, e.g. 'GB' — informs default currency suggestion only
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.parents is
  'One row per parent/guardian account. auth_user_id ties this to Supabase Auth; email lives here as a convenience copy of the auth user''s email for querying without joining auth.users from client-safe views.';

-- ============================================================
-- CURRENCIES (seeded reference data — see 0003_seed_currencies.sql)
-- ============================================================
create table public.currencies (
  code text primary key,                -- ISO 4217, e.g. 'GBP'
  name text not null,
  symbol text not null,
  symbol_position text not null check (symbol_position in ('before', 'after')),
  locale text not null,
  minor_unit_digits smallint not null check (minor_unit_digits >= 0),
  decimal_separator text not null default '.',
  thousands_separator text not null default ',',
  cash_rounding_increment numeric,      -- nullable; e.g. 0.05 for CHF
  price_tier_xs numeric not null,
  price_tier_s numeric not null,
  price_tier_m numeric not null,
  price_tier_l numeric not null,
  price_tier_xl numeric not null
);

comment on table public.currencies is
  'Central currency configuration (see money-quest-currency-architecture.md). Adding a new currency is a data-only change — an INSERT here plus a currency_regions row, never an application code change.';

create table public.currency_regions (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null references public.currencies(code) on delete cascade,
  country_name text not null,
  country_code text not null,           -- ISO 3166-1 alpha-2
  is_primary boolean not null default true,
  unique (currency_code, country_code)
);

create index idx_currency_regions_country on public.currency_regions(country_code);

-- ============================================================
-- CHILDREN
-- ============================================================
-- child_privacy: this table intentionally has NO columns for real name,
-- address, school, phone number, or any financial/payment information.
-- `display_name` is a child-chosen nickname, not required to be real.
-- `birth_year` (year only, not full date of birth) is sufficient to
-- compute age_band and is re-evaluated yearly by the application layer.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  age_band text not null check (age_band in ('explorer', 'builder', 'strategist')),
  birth_year smallint check (birth_year > 1990),
  country_code text not null,
  currency_code text not null references public.currencies(code),
  avatar_config jsonb not null default '{}'::jsonb,
  ai_coach_enabled boolean not null default true,
  screen_time_limit_minutes smallint,
  xp_total integer not null default 0,
  level integer not null default 1,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_children_parent on public.children(parent_id);

comment on table public.children is
  'One row per child profile. A child never has independent login credentials — access is always via a parent-authenticated session with an active child profile selected. See child_privacy comment above for the deliberate absence of PII columns.';

-- ============================================================
-- LEARNING WORLDS
-- ============================================================
create table public.worlds (
  id text primary key,                  -- slug, e.g. 'coin-cove'
  name text not null,
  order_index smallint not null unique,
  theme_color text not null,            -- references a world accent token, e.g. '#E8A33D'
  description text not null
);

-- ============================================================
-- ACTIVITIES (Lessons / Games / Challenges)
-- ============================================================
create table public.activities (
  id text primary key,                  -- slug, e.g. 'explorer-money-basics-l1'
  world_id text not null references public.worlds(id),
  topic_id text not null,
  age_band text not null check (age_band in ('explorer', 'builder', 'strategist')),
  level smallint not null check (level in (1, 2)),
  activity_type text not null check (activity_type in ('lesson', 'game', 'challenge')),
  title text not null,
  learning_objective text not null,
  content jsonb not null,               -- explanation, example, quiz, feedback_message, etc. — full curriculum record
  xp_reward integer not null default 10 check (xp_reward > 0),
  coin_reward_minor_units integer not null default 0 check (coin_reward_minor_units >= 0),
  order_index smallint not null,
  created_at timestamptz not null default now()
);

create index idx_activities_world on public.activities(world_id);
create index idx_activities_age_band on public.activities(age_band);

-- ============================================================
-- CHILD ACTIVITY PROGRESS
-- ============================================================
create table public.child_activity_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  activity_id text not null references public.activities(id),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  quiz_correct boolean,
  xp_awarded integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, activity_id)
);

create index idx_progress_child on public.child_activity_progress(child_id);

-- ============================================================
-- FICTIONAL WALLET
-- ============================================================
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  amount_minor_units integer not null check (amount_minor_units > 0),
  direction text not null check (direction in ('credit', 'debit')),
  source text not null check (source in ('activity_reward', 'savings_goal', 'shop_purchase_fictional', 'bank_interest_fictional')),
  description text not null,
  related_activity_id text references public.activities(id),
  related_goal_id uuid,                 -- FK added after savings_goals is created
  created_at timestamptz not null default now()
);

create index idx_wallet_child on public.wallet_transactions(child_id, created_at desc);

comment on table public.wallet_transactions is
  'Fictional currency only. No real payment method, card, or bank information is ever referenced by this table — see the product architecture''s child-safety commitments.';

-- ============================================================
-- SAVINGS GOALS
-- ============================================================
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  goal_name text not null check (char_length(goal_name) between 1 and 60),
  target_amount_minor_units integer not null check (target_amount_minor_units > 0),
  current_amount_minor_units integer not null default 0 check (current_amount_minor_units >= 0),
  icon_key text not null default 'gift',
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goals_child on public.savings_goals(child_id);

alter table public.wallet_transactions
  add constraint fk_wallet_related_goal
  foreign key (related_goal_id) references public.savings_goals(id) on delete set null;

-- ============================================================
-- BADGES
-- ============================================================
create table public.badges (
  id text primary key,                  -- slug, e.g. 'budget-boss'
  name text not null,
  description text not null,
  world_id text references public.worlds(id),
  icon_key text not null,
  criteria_description text not null    -- human-readable; structured rule engine is a post-MVP enhancement
);

create table public.child_badges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  unique (child_id, badge_id)
);

create index idx_child_badges_child on public.child_badges(child_id);

-- ============================================================
-- updated_at trigger (applied to tables that have the column)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_parents_updated_at before update on public.parents
  for each row execute function public.set_updated_at();
create trigger trg_children_updated_at before update on public.children
  for each row execute function public.set_updated_at();
create trigger trg_progress_updated_at before update on public.child_activity_progress
  for each row execute function public.set_updated_at();
create trigger trg_goals_updated_at before update on public.savings_goals
  for each row execute function public.set_updated_at();
