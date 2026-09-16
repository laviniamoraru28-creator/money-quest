import type { AgeBand } from "@/types/database.types";

/**
 * The 11-part lesson structure the content brief specifies, mapped
 * onto this project's existing `activities.content` jsonb column
 * (already flexible enough to hold this without a schema change) —
 * see docs/curriculum-content.md for the exact field-by-field mapping
 * and the honest account of what this replaces.
 *
 * Every field here is real, hand-written content — never template-
 * generated. The 3 lessons that existed before this file were found
 * during this work to contain literally templated filler text (e.g.
 * every quiz's "explanation" was the same generated sentence with the
 * answer substituted in) — this type, and the content authored against
 * it, exists specifically so that pattern can never recur silently:
 * scripts/validate-lesson-content.ts checks every lesson's fields for
 * exactly that kind of generic, copy-pasted phrasing.
 */
export interface LessonVocabTerm {
  term: string;
  definition: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string; // must be specific to THIS lesson's concept — never a templated sentence
}

export interface LessonFeedback {
  success: string;
  retry: string; // never shaming — always frames a wrong answer as a normal part of learning
}

export interface LessonContent {
  id: string;
  worldId: string;
  topicId: string;
  ageBand: AgeBand;
  title: string;
  learningObjective: string;
  shortIntroduction: string; // 1-2 sentences, the hook before the lesson starts
  story: string; // a small narrative scenario a child can picture themselves in
  keyConcept: string;
  vocabulary: LessonVocabTerm[];
  explanation: string;
  interactiveActivity: string;
  gameIdea: string; // ties to one of the real game-engine mechanics/games where relevant
  challenge: string;
  quiz: LessonQuiz;
  feedback: LessonFeedback;
  rewardMessage: string; // a short, specific line celebrating what THIS lesson's reward is for
  parentNote: string; // shown to the parent, never the child — see docs/curriculum-content.md
  commonMisconception: string;
  countryVariesNote?: string; // only present where the concept genuinely varies by country — see docs/curriculum-content.md
  xpReward: number;
  coinRewardMinorUnits: number;
  orderIndex: number;
}
