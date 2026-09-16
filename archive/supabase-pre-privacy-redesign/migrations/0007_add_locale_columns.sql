-- Money Quest — 0007_add_locale_columns.sql
--
-- Adds interface-language preference, kept structurally and semantically
-- separate from currency_code and country_code (brief requirements 7
-- and 21: "language and currency must be two separate settings").
-- Neither existing column is touched — this is a pure addition.

alter table public.parents
  add column locale text not null default 'en';

alter table public.children
  add column locale text not null default 'en';

-- Both reference the same LOCALES list as the application's
-- src/i18n/config.ts. This check constraint is intentionally a plain
-- enum rather than a foreign key to a "languages" table, matching how
-- currencies.code already works as reference data — if that ever
-- becomes unwieldy (e.g. locale variants like 'pt-BR' vs 'pt-PT'), a
-- proper languages table can be introduced without touching this
-- column's meaning, only its constraint.
alter table public.parents
  add constraint parents_locale_check
  check (locale in ('en', 'ro', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl'));

alter table public.children
  add constraint children_locale_check
  check (locale in ('en', 'ro', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl'));

comment on column public.parents.locale is
  'Interface language (UI text, formatting style) — independent of any currency or region setting. See money-quest-i18n.md.';
comment on column public.children.locale is
  'Interface language for this child''s experience — independent of currency_code. A Romanian-speaking child in the UK can have locale=''ro'' and currency_code=''GBP'' simultaneously.';

-- Column-level privilege grant, consistent with the existing pattern in
-- 0002_rls_policies.sql (children.avatar_config etc. are individually
-- grantable, gameplay-sensitive columns like xp_total are not) — locale
-- is a plain preference, safe to add to both tables' existing
-- client-updatable column sets.
grant update (locale) on public.parents to authenticated;
grant update (locale) on public.children to authenticated;
