# Archived: pre-privacy-redesign Supabase schema

This directory (`supabase-pre-privacy-redesign/`) contains all 22 database
migrations from the previous, account-based architecture. It is kept
as a historical record of real engineering work, not as part of the
live application — nothing in `src/` references or depends on it.

The privacy-first redesign removed the entire account/database layer
these migrations built. See `docs/data-flow-inventory-pre-redesign.md`
for the audit that justified removing it, and `docs/final-architecture-report.md`
for what replaced it (a fully static, on-device architecture with no
database at all).

If a future version of this product needs a database again — for a
genuinely necessary, non-personal function — these migrations are a
useful reference for the RLS and schema patterns this project
established, but should not be reapplied wholesale: the whole point of
the redesign was that most of what they created should not exist.
