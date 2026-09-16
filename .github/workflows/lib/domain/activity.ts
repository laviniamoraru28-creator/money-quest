export interface CurriculumContent {
  shortIntroduction: string;
  keyConcept: string;
  vocabulary: { term: string; definition: string }[];
  explanation: string;
  story: string;
  interactiveActivity: string;
  gameIdea: string;
  challenge: string;
  quiz: { question: string; options: string[]; correct_answer: string; explanation: string };
  commonMisconception: string;
  feedbackMessage: { success: string; retry: string };
  rewardMessage: string;
  /** Shown only to the parent (Parent Dashboard child detail), never
   * rendered anywhere in the child-facing LessonPlayer — see
   * docs/curriculum-content.md for why this separation matters. */
  parentNote: string;
  /** Only present where a concept genuinely varies by country (e.g.
   * exchange rates, interest rates) — see docs/curriculum-content.md. */
  countryVariesNote?: string;
}

export interface ActivityDetail {
  id: string;
  worldId: string;
  /** The lesson's topic (e.g. "saving", "needs_wants") — used by
   * LessonIllustration to pick a topic-relevant motif for the book's
   * left-page illustration. Purely presentational; not used for any
   * content-selection logic. */
  topicId: string;
  title: string;
  learningObjective: string;
  xpReward: number;
  coinRewardMinorUnits: number;
  content: CurriculumContent;
  isCompleted: boolean;
  childCurrencyCode: string;
  childAgeBand: string;
}

/**
 * Builds an ActivityDetail by combining a lesson's structural data
 * (id, world, XP/coin values — locale-independent, from
 * LESSON_STRUCTURES) with its translatable text, fetched in one
 * `t.raw("curriculum.<id>")` call — next-intl's API for retrieving a
 * structured JSON value rather than a single interpolated string, used
 * here because a lesson's shape (a vocabulary array, a quiz object)
 * doesn't decompose into flat per-field t() calls cleanly. Replaces
 * the old English-only version of this function; no network call, no
 * database — see docs/data-flow-inventory-pre-redesign.md.
 */
import type { LessonStructure, LocalizedLessonText } from "@/content/curriculum/localized-types";

export function buildActivityDetailFromLesson(
  structure: LessonStructure,
  localizedText: LocalizedLessonText,
  completedActivityIds: string[],
  currencyCode: string,
  ageBand: string
): ActivityDetail {
  return {
    id: structure.id,
    worldId: structure.worldId,
    topicId: structure.topicId,
    title: localizedText.title,
    learningObjective: localizedText.learningObjective,
    xpReward: structure.xpReward,
    coinRewardMinorUnits: structure.coinRewardMinorUnits,
    content: {
      shortIntroduction: localizedText.shortIntroduction,
      keyConcept: localizedText.keyConcept,
      vocabulary: localizedText.vocabulary,
      explanation: localizedText.explanation,
      story: localizedText.story,
      interactiveActivity: localizedText.interactiveActivity,
      gameIdea: localizedText.gameIdea,
      challenge: localizedText.challenge,
      quiz: {
        question: localizedText.quiz.question,
        options: localizedText.quiz.options,
        correct_answer: localizedText.quiz.correctAnswer,
        explanation: localizedText.quiz.explanation,
      },
      commonMisconception: localizedText.commonMisconception,
      feedbackMessage: localizedText.feedback,
      rewardMessage: localizedText.rewardMessage,
      parentNote: localizedText.parentNote,
      countryVariesNote: localizedText.countryVariesNote,
    },
    isCompleted: completedActivityIds.includes(structure.id),
    childCurrencyCode: currencyCode,
    childAgeBand: ageBand,
  };
}
