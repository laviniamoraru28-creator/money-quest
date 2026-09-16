import type { AgeBand } from "@/types/database.types";
import type { LessonVocabTerm, LessonQuiz, LessonFeedback } from "./types";

/**
 * The translatable subset of LessonContent (see ./types.ts) — every
 * field a translator needs to touch, with none of the structural
 * fields (id, worldId, topicId, ageBand, xpReward,
 * coinRewardMinorUnits, orderIndex) that never change between
 * languages and stay in the static per-lesson TS files.
 *
 * Lives under `curriculum.<lessonId>` in each locale's messages/*.json
 * — the existing next-intl mechanism, not a parallel system. Retrieved
 * with `t.raw("curriculum." + lessonId)` (next-intl's API for a
 * structured JSON value, not a single interpolated string) rather than
 * one t() call per field, since a lesson's shape — a vocabulary array,
 * a quiz object — doesn't decompose into flat string keys cleanly.
 */
export interface LocalizedLessonText {
  title: string;
  learningObjective: string;
  shortIntroduction: string;
  story: string;
  keyConcept: string;
  vocabulary: LessonVocabTerm[];
  explanation: string;
  interactiveActivity: string;
  gameIdea: string;
  challenge: string;
  quiz: LessonQuiz;
  feedback: LessonFeedback;
  rewardMessage: string;
  parentNote: string;
  commonMisconception: string;
  countryVariesNote?: string;
}

/** The structural (non-translatable) shape kept in the static TS
 * registry — combine with LocalizedLessonText to reconstruct a full
 * LessonContent for a given locale. */
export interface LessonStructure {
  id: string;
  worldId: string;
  topicId: string;
  ageBand: AgeBand;
  xpReward: number;
  coinRewardMinorUnits: number;
  orderIndex: number;
}
