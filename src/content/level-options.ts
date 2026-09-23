import type { AgeBand } from "@/types/database.types";

/**
 * The single source of truth for the 3 age-band levels' display names
 * — used by the level-choice screen on /play and by anywhere else
 * that needs to show a child's current level as a word (e.g. "Early
 * Learner") rather than the internal ageBand id ("explorer").
 */
export const LEVEL_OPTIONS: { ageBand: AgeBand; labelKey: string; rangeKey: string }[] = [
  { ageBand: "explorer", labelKey: "play.earlyLearner", rangeKey: "play.earlyLearnerRange" },
  { ageBand: "builder", labelKey: "play.primary", rangeKey: "play.primaryRange" },
  { ageBand: "strategist", labelKey: "play.olderLearner", rangeKey: "play.olderLearnerRange" },
];

export function getLevelLabelKey(ageBand: AgeBand): string {
  return LEVEL_OPTIONS.find((option) => option.ageBand === ageBand)?.labelKey ?? "play.earlyLearner";
}
