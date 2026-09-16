import type { GameConfig } from "./types";
import type { GameStructure, LocalizedGameText } from "./localized-types";

/**
 * Combines a game's structural data (key, worldId, reward numbers —
 * locale-independent, from GAME_STRUCTURES) with its translatable
 * text, fetched via `t.raw("games.<key>")` — same pattern as
 * buildActivityDetailFromLesson for lessons. Variants are matched by
 * position (same index in both structure.variants and
 * localizedText.variants, which migrate-games-to-i18n.ts preserved
 * when it split the original config), not by re-deriving ageBand/
 * difficulty from either side alone, since either being wrong in
 * isolation should surface as a mismatch rather than silently pairing
 * the wrong variant's rounds with the wrong reward numbers.
 */
export function buildGameConfigFromStructure(structure: GameStructure, localizedText: LocalizedGameText): GameConfig {
  return {
    key: structure.key,
    title: localizedText.title,
    worldId: structure.worldId,
    topicId: structure.topicId,
    usesCurrency: structure.usesCurrency,
    feedback: localizedText.feedback,
    variants: structure.variants.map((variantStructure, i) => {
      const variantText = localizedText.variants[i];
      if (!variantText) {
        throw new Error(`Game "${structure.key}": missing translated variant at index ${i} (structure has ${structure.variants.length} variants)`);
      }
      if (variantText.ageBand !== variantStructure.ageBand || variantText.difficulty !== variantStructure.difficulty) {
        throw new Error(
          `Game "${structure.key}": variant ${i} mismatch between structure (${variantStructure.ageBand}/${variantStructure.difficulty}) and localized text (${variantText.ageBand}/${variantText.difficulty})`
        );
      }
      return {
        ageBand: variantStructure.ageBand,
        difficulty: variantStructure.difficulty,
        xpReward: variantStructure.xpReward,
        coinRewardMinorUnits: variantStructure.coinRewardMinorUnits,
        passingScoreFraction: variantStructure.passingScoreFraction,
        estimatedMinutes: variantStructure.estimatedMinutes,
        rounds: variantText.rounds,
      };
    }),
  };
}
