import type { AgeBand } from "@/types/database.types";

/**
 * Shared by Entrepreneur Quest's and Leadership Quest's own storage
 * hooks (see use-entrepreneur-quest.ts / use-leadership-quest.ts).
 * Both used to persist ONE flat state object shared across all three
 * age bands — Issue #86's core bug: a child who finished Leadership
 * Quest as Explorer had also, invisibly, "finished" it as Builder and
 * Strategist. This wraps that same flat shape in a per-band envelope
 * under the SAME storage key, so neither hook needs a second key and
 * every existing consumer of its returned `state` still sees the same
 * flat shape back (just the current band's own slice of it).
 *
 * Pure (no localStorage access) so the migration decision itself —
 * the part that actually matters to get right once, since it runs
 * against real families' saved progress — is unit-testable without a
 * browser environment, matching every other state module here.
 */
export interface BandScopedPayload<T> {
  readonly byBand: Partial<Record<AgeBand, T>>;
}

function isBandScopedPayload(value: unknown): value is BandScopedPayload<unknown> {
  if (!value || typeof value !== "object") return false;
  const byBand = (value as Record<string, unknown>).byBand;
  return !!byBand && typeof byBand === "object" && !Array.isArray(byBand);
}

/**
 * `parsed` is whatever JSON.parse produced from the raw storage value
 * (or null if there was none). `band` is the CURRENTLY selected age
 * band — the one a legacy flat blob is attributed to, since that's
 * the band it was actually most recently earned under. `merge` fills
 * in any field missing from a parsed/legacy object with this state
 * shape's own defaults (the same per-field merge each hook already
 * did before this change), so a partially-shaped stored value never
 * produces a crash or an incomplete slice.
 */
export function readBandScopedSlice<T>(
  parsed: unknown,
  band: AgeBand | null,
  createDefault: () => T,
  merge: (defaults: T, raw: unknown) => T
): T {
  if (!band) return createDefault();
  if (isBandScopedPayload(parsed)) {
    const slice = parsed.byBand[band];
    return slice === undefined ? createDefault() : merge(createDefault(), slice);
  }
  if (parsed === null || parsed === undefined) return createDefault();
  // Legacy flat shape (or garbage): attribute it to the current band only -
  // never to the other two, which is exactly the bug this migration fixes.
  return merge(createDefault(), parsed);
}

/** The payload to write back after any read or write, carrying the
 * migration forward for every band at once (not just the one just
 * touched), so a legacy blob is migrated exactly once in total. */
export function toBandScopedPayload<T>(
  parsed: unknown,
  band: AgeBand,
  nextValueForBand: T
): BandScopedPayload<T> {
  if (isBandScopedPayload(parsed)) {
    return { byBand: { ...(parsed.byBand as Partial<Record<AgeBand, T>>), [band]: nextValueForBand } };
  }
  // First write since migrating: the legacy blob (if any) already became
  // `nextValueForBand` by the time a caller re-saves it under `band` -
  // nothing legacy is left to attribute to a DIFFERENT band here.
  return { byBand: { [band]: nextValueForBand } };
}
