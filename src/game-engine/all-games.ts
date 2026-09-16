import fs from "node:fs";
import path from "node:path";
import type { GameConfig } from "./types";
import { GAME_STRUCTURES } from "./structures";
import { buildGameConfigFromStructure } from "./build-config";
import type { LocalizedGameText } from "./localized-types";

/**
 * The complete launch catalogue, for scripts that need every game's
 * full content (structure + text) without going through next-intl —
 * e.g. validate-game-feedback.ts, which checks banned-phrase patterns
 * against the English source of truth. Reads messages/en.json
 * directly rather than importing next-intl/server, since these are
 * plain Node scripts, not React components.
 *
 * Adding game #13: write its structural entry in structures.ts, its
 * translatable content in messages/en.json under `games.<key>` (and
 * every other locale), and it appears here automatically — nothing in
 * this file itself needs to change.
 */
const en = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "messages", "en.json"), "utf-8"));

export const ALL_GAMES: GameConfig[] = GAME_STRUCTURES.map((structure) =>
  buildGameConfigFromStructure(structure, en.games[structure.key] as LocalizedGameText)
);

export const GAME_BY_KEY: Record<string, GameConfig> = Object.fromEntries(ALL_GAMES.map((g) => [g.key, g]));
