import type { AgeBand } from "@/types/database.types";
import { LESSON_STRUCTURES } from "@/content/curriculum/structures";
import { GAME_STRUCTURES } from "@/game-engine/structures";
import { buildGameConfigFromStructure } from "@/game-engine/build-config";
import type { LocalizedGameText } from "@/game-engine/localized-types";
import type { GameConfig } from "@/game-engine/types";

/**
 * The single, database-free source of every piece of educational
 * content in the app — built for the privacy-first redesign, which
 * found (docs/data-flow-inventory-pre-redesign.md) that content itself
 * was never personal data; it only lived in a database because
 * everything else did too. Once accounts and server-side progress are
 * gone, there is no remaining reason for lessons and games to be
 * queried from anywhere instead of imported directly.
 *
 * Mirrors the id convention the old seed data used
 * (`game-{ageBand}-{gameKey}`, `{ageBand}-{topicId}-l1`) purely so any
 * remaining reference to an old id format (e.g. a bookmarked URL)
 * keeps working, not because the format itself matters anymore.
 *
 * GAME_STRUCTURES holds only structural (locale-independent) data —
 * see game-engine/structures.ts and localized-types.ts for why the
 * translatable rounds/title/feedback live in messages/*.json instead.
 */
export const GAME_KEYS: string[] = GAME_STRUCTURES.map((g) => g.key);

export interface CatalogEntry {
  id: string;
  worldId: string;
  topicId: string;
  ageBand: AgeBand;
  activityType: "lesson" | "game";
  title: string;
}

/**
 * Takes `t` as a parameter — the same pattern already used by
 * report.ts — since both lesson and game titles now live in the
 * translation system (`curriculum.<id>.title`, `games.<key>.title`),
 * not the structural registries, and this function isn't a component
 * that could call useTranslations() itself.
 */
export function getWorldCatalog(worldId: string, ageBand: AgeBand, t: (key: string) => string): CatalogEntry[] {
  const lessons: CatalogEntry[] = LESSON_STRUCTURES.filter((l) => l.worldId === worldId && l.ageBand === ageBand).map((l) => ({
    id: l.id,
    worldId: l.worldId,
    topicId: l.topicId,
    ageBand: l.ageBand,
    activityType: "lesson",
    title: t(`curriculum.${l.id}.title`),
  }));

  const games: CatalogEntry[] = GAME_STRUCTURES.filter((g) => g.worldId === worldId && g.variants.some((v) => v.ageBand === ageBand)).map(
    (g) => ({
      id: `game-${ageBand}-${g.key}`,
      worldId: g.worldId,
      topicId: g.topicId,
      ageBand,
      activityType: "game",
      title: t(`games.${g.key}.title`),
    })
  );

  return [...lessons, ...games];
}

export function getLessonStructureById(id: string) {
  return LESSON_STRUCTURES.find((l) => l.id === id);
}

/**
 * Finds the next activity after `currentActivityId` in a world's
 * catalog for a given age band — the lesson (always first, since each
 * world/age-band pairs with at most one) followed by that world's
 * games in a fixed order. Returns null both when currentActivityId
 * isn't found and when it's genuinely the last entry — callers treat
 * both the same way (no "Next" shown), which is correct: a missing id
 * has no defined next activity either.
 *
 * Deliberately scoped to one world/age-band, not the whole app —
 * chaining across worlds would mean silently deciding an order between
 * unrelated topics (e.g. "finish Coin Cove, jump into Market Town")
 * that the child never chose, and would fight against the World Map's
 * own job of being where that choice is made.
 */
export function getNextActivityInWorld(worldId: string, ageBand: AgeBand, currentActivityId: string, t: (key: string) => string): CatalogEntry | null {
  const catalog = getWorldCatalog(worldId, ageBand, t);
  const currentIndex = catalog.findIndex((entry) => entry.id === currentActivityId);
  if (currentIndex === -1) return null;
  return catalog[currentIndex + 1] ?? null;
}

/** The mirror of getNextActivityInWorld() — returns the activity
 * immediately before the current one, or null when the current
 * activity is the first in the world (or isn't found at all). Powers
 * the "Back" button on lesson/game pages, which — per the redesign
 * brief — should step to the previous *activity* in the learning
 * journey, not just return to the World menu (that's a separate,
 * still-available option, not this one). */
export function getPreviousActivityInWorld(worldId: string, ageBand: AgeBand, currentActivityId: string, t: (key: string) => string): CatalogEntry | null {
  const catalog = getWorldCatalog(worldId, ageBand, t);
  const currentIndex = catalog.findIndex((entry) => entry.id === currentActivityId);
  if (currentIndex <= 0) return null;
  return catalog[currentIndex - 1] ?? null;
}

/** Where a given activity sits in its world's sequence, 1-indexed,
 * alongside the total — e.g. {position: 3, total: 6} for "Activity 3
 * of 6". Powers the progress indicator on lesson/game pages. Returns
 * null if the activity isn't found in this world/age-band's catalog
 * at all (shouldn't happen in normal navigation, but the caller
 * should be able to simply not show a progress line rather than show
 * a wrong one). */
export function getActivityPosition(worldId: string, ageBand: AgeBand, currentActivityId: string, t: (key: string) => string): { position: number; total: number } | null {
  const catalog = getWorldCatalog(worldId, ageBand, t);
  const currentIndex = catalog.findIndex((entry) => entry.id === currentActivityId);
  if (currentIndex === -1) return null;
  return { position: currentIndex + 1, total: catalog.length };
}

/** Builds the correct /play URL for a catalog entry — the one place
 * that needs to know lesson vs. game routes differ, so callers (the
 * "Next Activity" button) don't each re-derive it. */
export function getActivityHref(worldId: string, entry: CatalogEntry): string {
  return entry.activityType === "lesson" ? `/play/world/${worldId}/lesson/${entry.id}` : `/play/world/${worldId}/game/${entry.id}`;
}

/** Minimal shape of next-intl's translator this function needs — kept
 * structural rather than importing next-intl's own type, matching the
 * same reasoning as report.ts's Translator type. */
type Translator = { (key: string, values?: Record<string, unknown>): string; raw: (key: string) => unknown };

/**
 * t.raw() — next-intl's API for a structured JSON value, not a single
 * interpolated string — retrieves the whole `games.<key>` blob in one
 * call, matching the same pattern used for lesson content.
 */
export function getGameByKey(key: string, t: Translator): GameConfig | undefined {
  const structure = GAME_STRUCTURES.find((g) => g.key === key);
  if (!structure) return undefined;
  const localizedText = t.raw(`games.${key}`) as LocalizedGameText;
  return buildGameConfigFromStructure(structure, localizedText);
}

/** Parses the `game-{ageBand}-{key}` id convention back into its parts. */
export function parseGameActivityId(id: string): { ageBand: AgeBand; key: string } | null {
  const match = id.match(/^game-(explorer|builder|strategist)-(.+)$/);
  if (!match || !match[1] || !match[2]) return null;
  return { ageBand: match[1] as AgeBand, key: match[2] };
}
