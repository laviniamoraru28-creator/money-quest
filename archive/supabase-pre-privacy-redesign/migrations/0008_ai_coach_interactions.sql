-- Money Quest — 0008_ai_coach_interactions.sql
--
-- Deliberately does NOT store conversation transcripts. Per the brief's
-- "do not store unnecessary conversations" requirement, this table logs
-- only what a safety reviewer or parent needs: which topic was
-- discussed (reusing the curriculum's own topic_id taxonomy, so there's
-- one consistent vocabulary across the whole app, not a second one
-- invented for this table), whether anything was flagged and why (a
-- short reason CODE, never the literal risky text), and lightweight
-- metadata. The actual message-by-message conversation exists only in
-- the browser's session state (see src/components/coach/CoachChat.tsx)
-- and in-flight to the AI provider for context — never persisted here.

create table public.ai_coach_interactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  activity_context_id text references public.activities(id),
  topic_category text not null,
  was_flagged boolean not null default false,
  flag_reason text,
  age_band text not null check (age_band in ('explorer', 'builder', 'strategist')),
  created_at timestamptz not null default now()
);

comment on table public.ai_coach_interactions is
  'A safety/usage log, not a conversation transcript. See the migration header comment for what is deliberately NOT stored here.';
comment on column public.ai_coach_interactions.flag_reason is
  'A short reason CODE (e.g. "requested_pii", "off_topic_financial_product") identifying which safety rule triggered — never the literal flagged text itself.';

create index idx_ai_coach_interactions_child on public.ai_coach_interactions(child_id, created_at desc);

alter table public.ai_coach_interactions enable row level security;

-- Parent can view their own children's interaction log (the "AI
-- interaction log" the product architecture's Parent AI Settings page
-- surfaces) — same owns_child() ownership check used everywhere else.
create policy "ai_coach_interactions_select_own_child" on public.ai_coach_interactions
  for select using (public.owns_child(child_id));

-- Writes happen from the /api/coach Route Handler under the signed-in
-- parent's own session (never the service role) — a plain RLS INSERT
-- policy is sufficient here, unlike complete_activity()'s SECURITY
-- DEFINER function, because logging an interaction has no
-- reward/currency logic that needs server-trusted enforcement; the
-- ownership check alone is the only thing that matters.
create policy "ai_coach_interactions_insert_own_child" on public.ai_coach_interactions
  for insert with check (public.owns_child(child_id));

-- No update/delete policy: the log is append-only. A parent who wants
-- their child's AI history gone uses the existing account/child
-- deletion flow (cascades via child_id's ON DELETE CASCADE above), not
-- a row-by-row edit.
