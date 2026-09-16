import type { AgeBand } from "@/types/database.types";
import type { DifficultyTier, GameRound } from "./types";

/**
 * The translatable subset of a GameConfig — everything a translator
 * needs (title, feedback copy, and every round, including round-level
 * structural fields like ids/keys, which stay IDENTICAL across
 * languages but live here rather than the structural registry because
 * splitting a round's own id from its prompt/label text would mean
 * reconstructing rounds by matching ids across two files, a fragile
 * merge for content this nested). Only the true across-language-stable
 * config metadata (key, worldId, topicId, usesCurrency, and each
 * variant's ageBand/difficulty/reward numbers) lives in the structural
 * registry — see structures.ts.
 *
 * Lives under `games.<gameKey>` in each locale's messages/*.json,
 * retrieved with `t.raw("games." + key)` the same way curriculum
 * lessons are — see content/curriculum/localized-types.ts for why
 * `t.raw()` over per-field t() calls.
 */
export interface LocalizedGameVariant {
  ageBand: AgeBand;
  difficulty: DifficultyTier;
  rounds: GameRound[];
}

export interface LocalizedGameText {
  title: string;
  feedback: { correct: string; incorrect: string };
  variants: LocalizedGameVariant[];
}

/** The structural (non-translatable) shape kept in the static TS
 * registry — combine with LocalizedGameText to reconstruct a full
 * GameConfig for a given locale. */
export interface GameVariantStructure {
  ageBand: AgeBand;
  difficulty: DifficultyTier;
  xpReward: number;
  coinRewardMinorUnits: number;
  passingScoreFraction: number;
  estimatedMinutes: number;
}

export interface GameStructure {
  key: string;
  worldId: string;
  topicId: string;
  usesCurrency: boolean;
  variants: GameVariantStructure[];
}
