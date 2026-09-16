-- Money Quest — 0013_ad_impressions.sql
--
-- Privacy-safe advertising impression log. Deliberately contains NO
-- reference to any parent, child, or account — not a foreign key, not
-- a user id, not a session id, nothing. This table cannot be joined
-- against `parents` or `children` even if someone tried, because it
-- holds no column that could serve as a join key to either. That's not
-- an oversight; it's the entire point — see
-- advertising-architecture.md's data-sharing section for the full
-- reasoning on why ad reporting and user identity are kept structurally
-- unable to meet.
--
-- What this table IS for: answering "how many times did zone X show a
-- creative this week" and "what's our fill rate" — aggregate product
-- and revenue questions, not anything about an individual family.

create table public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null,
  audience text not null check (audience in ('parent', 'child')),
  creative_id text not null,
  provider_name text not null,
  is_house_creative boolean not null,
  -- Coarse, country-level only (same granularity already used
  -- elsewhere in this app for currency defaults) — never set for
  -- child-audience impressions, since a child-audience request
  -- (ChildAdRequest, see types.ts) has no country field to begin with.
  country_code text,
  created_at timestamptz not null default now()
);

comment on table public.ad_impressions is
  'Anonymous, aggregate ad-impression counts only. No foreign key to parents or children exists or should ever be added — see 0013_ad_impressions.sql header comment.';

create index idx_ad_impressions_zone_time on public.ad_impressions(zone_id, created_at desc);

alter table public.ad_impressions enable row level security;

-- No SELECT policy for `authenticated` at all: this is aggregate
-- product/business data, not something an individual parent has any
-- reason to query directly (there's nothing about THEIR family in it to
-- see). Reporting/aggregation happens via the service-role client in an
-- internal reporting context, matching how genuinely cross-account
-- aggregate queries are meant to work in this project (see
-- src/lib/supabase/admin.ts's own guardrail comment) — this is a
-- legitimate use of that elevated client, not a workaround, because
-- there is no per-row ownership to scope a normal RLS policy to in the
-- first place.
--
-- Inserts happen via the service-role client too (from
-- src/lib/advertising/reporting.ts), for the same reason: there's no
-- owns_child()-style check that would mean anything here, since the row
-- being inserted doesn't belong to any specific family.
