-- Money Quest — 0020_remove_unused_birth_year.sql
--
-- Data-minimisation change, not a bug fix: `birth_year` (added in
-- 0001_init_schema.sql) has never been collected by any form, written
-- by any Server Action, or read by any application code — grep-
-- verified across the entire codebase before this migration was
-- written. An unused column capable of holding more granular,
-- identifying data about a child than the app actually needs is a
-- real latent privacy risk even while unused: a future change could
-- add a form field to "add a bit more precision" without anyone
-- noticing that `age_band` already covers everything the app's logic
-- needs. Removing the column removes the possibility entirely, rather
-- than relying on "we just don't happen to use it" as the safeguard.
--
-- See money-quest-dpia.md and money-quest-data-inventory.md for the
-- full reasoning — this is the Children's Code Standard 8 (Data
-- Minimisation) finding, implemented, not just written down.

alter table public.children drop column if exists birth_year;
