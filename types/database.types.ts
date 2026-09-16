/**
 * Before the privacy-first redesign, this file mirrored the full
 * Supabase schema (supabase/migrations/, now archived — see
 * archive/README.md). Every table Row/Insert/Update type it used to
 * export is now dead: there is no database. Only `AgeBand` survived
 * the redesign, because it's genuinely still a meaningful concept —
 * the three reading/content levels lessons and games are written for
 * — even though it no longer labels a database column.
 *
 * Kept at this same path/filename rather than moved, purely so the 9
 * files that already `import type { AgeBand } from
 * "@/types/database.types"` didn't need a mechanical rename across the
 * whole codebase for a change with zero behavioural effect.
 */
export type AgeBand = "explorer" | "builder" | "strategist";
