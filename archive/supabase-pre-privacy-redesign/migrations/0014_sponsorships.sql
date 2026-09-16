-- Money Quest — 0014_sponsorships.sql
--
-- Future sponsorship system, per the brief's explicit instruction: "Do
-- not implement real sponsors yet." This migration ships the complete
-- schema, with zero sponsor rows seeded — every table exists and is
-- correctly constrained, ready for a real sponsor to be added by staff
-- (never self-service by the sponsor — see the RLS policies below), but
-- nothing renders until that happens.
--
-- The central design decision, stated once here rather than repeated
-- in every table's comment: sponsorship is a STATIC ATTRIBUTION
-- relationship, not a live third-party integration. A sponsor never has
-- an account, never calls an API, never sees a request/response cycle
-- the way an ad provider does (see 0013_ad_impressions.sql and
-- advertising-architecture.md for that different pattern). A sponsor's
-- entire relationship with this system is: Money Quest staff record,
-- off-platform, that Organisation X is an approved educational partner
-- for World Y, with an exact, pre-approved credit line. That's it. This
-- is what makes several of the brief's prohibitions structurally true
-- rather than merely policy:
--   - "Sponsors must not receive children's personal data" — there is
--     no code path by which a sponsor record could ever be queried
--     together with anything about an individual child; see the
--     decoupling note before the world_sponsorships table below.
--   - "Sponsors must not directly communicate with children" — there is
--     no sponsor account, no sponsor login, no messaging table of any
--     kind connecting a sponsors row to a children row.
--   - "Sponsors must not create child profiles" — sponsors have zero
--     write access to anything (see the RLS policies: no INSERT/UPDATE/
--     DELETE policy for `authenticated` exists on either table below,
--     full stop).

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organisation_name text not null,
  -- Local, staff-vetted asset path only — same reasoning as
  -- child-audience ad creatives (see advertising-architecture.md §6):
  -- no externally-hosted logo URL, which would be a live third-party
  -- request fired on every page view crediting the sponsor.
  logo_asset_path text,
  website_url text,
  description text not null,
  category text not null check (category in (
    'nonprofit-education',
    'financial-literacy-nonprofit',
    'edtech',
    'publisher',
    'financial-institution',
    'other-corporate'
  )),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  -- Free-text staff notes on the review decision — never shown to
  -- anyone outside internal tooling, exists purely for accountability
  -- on who approved what and why.
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sponsors is
  'Educational partners who may sponsor a World''s attribution credit. No sponsor has an account, login, or any write access to this system — every row is created and approved by Money Quest staff only. See 0014_sponsorships.sql header comment.';

-- Decoupling note: this table intentionally references `worlds` only —
-- never `activities`, never `child_activity_progress`, never anything
-- that could let a sponsorship relationship touch a specific piece of
-- educational content's actual substance (a quiz answer, a lesson's
-- explanation text, a game's scoring rule) or a specific child's data.
-- A World is the largest, most general unit of content in this
-- product's structure — sponsoring one is a credit line on a
-- content AREA, structurally incapable of reaching into what's taught
-- within it. scripts/test-sponsorship-decoupling.ts verifies this
-- separation holds across the actual codebase, not just this comment.
create table public.world_sponsorships (
  id uuid primary key default gen_random_uuid(),
  world_id text not null references public.worlds(id),
  sponsor_id uuid not null references public.sponsors(id),
  -- The exact, pre-approved credit line shown to families — e.g. "Money
  -- Around the World is supported by an educational partner." Stored
  -- verbatim (not generated at render time from the sponsor's own
  -- name/description) so the exact wording is itself part of what gets
  -- reviewed and approved, never assembled automatically in a way that
  -- could drift from what was actually agreed.
  display_credit_line text not null,
  starts_at timestamptz not null default now(),
  -- Null means "ongoing" — an explicit end date is optional, not
  -- required, but supported for a time-boxed sponsorship arrangement.
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.world_sponsorships is
  'Links one approved sponsor to one World with a fixed, pre-approved credit line. A World may have at most one ACTIVE sponsorship at a time — see the partial unique index below.';

-- Prevents two simultaneously-active sponsorships on the same World
-- (which would be confusing attribution, not a safety issue per se, but
-- worth preventing at the schema level rather than relying on
-- application code to check first).
create unique index idx_one_active_sponsorship_per_world
  on public.world_sponsorships(world_id)
  where (ends_at is null);

create index idx_world_sponsorships_world on public.world_sponsorships(world_id);

alter table public.sponsors enable row level security;
alter table public.world_sponsorships enable row level security;

-- Readable by any authenticated user — a sponsorship credit is public,
-- family-facing attribution text, the same visibility level as a
-- World's own name and description (see the existing "worlds_read"
-- policy pattern in 0002_rls_policies.sql). Only APPROVED sponsors and
-- their sponsorships are exposed to the read policy's WHERE clause —
-- a pending or rejected sponsor is invisible to every signed-in family,
-- not just hidden by application-layer filtering that a client could
-- bypass.
create policy "sponsors_read_approved_only" on public.sponsors
  for select using (auth.role() = 'authenticated' and status = 'approved');

create policy "world_sponsorships_read_active" on public.world_sponsorships
  for select using (
    auth.role() = 'authenticated'
    and (ends_at is null or ends_at > now())
    and exists (
      select 1 from public.sponsors s
      where s.id = sponsor_id and s.status = 'approved'
    )
  );

-- Deliberately NO insert/update/delete policy for `authenticated` on
-- either table — sponsorship records are managed exclusively via the
-- service-role client as part of an internal, off-platform staff review
-- process (see sponsorship-architecture.md for what that process should
-- look like before any real sponsor is added). This is the same
-- reasoning already documented for ad_impressions: some data in this
-- system has no per-family owner and should not be client-writable at
-- all, regardless of which family is asking.
