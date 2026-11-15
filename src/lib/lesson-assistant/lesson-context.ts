import { explorerComicTranscripts } from "@/content/explorer-comic-transcripts";
import { hasExplorerComic } from "@/content/explorer-comic-topics";
import { getLessonStructureById } from "@/content/catalog";
import type { LocalizedLessonText } from "@/content/curriculum/localized-types";
import { romanianExplorerCopy } from "@/i18n/explorer-copy";
import { LOCALE_LABELS, type Locale } from "@/i18n/config";
import { LOCALE_LEARNING_CURRENCY } from "@/lib/currency/learning-currency";

const levelGuide = {
  explorer: "Ages 6 to 8. Use tiny sentences with a single idea each. At most 40 words of main text. Use familiar objects and two choices with distinct meaningful picture icons and very short labels. Assume reading ability varies.",
  builder: "Ages 9 to 11. Use familiar decisions and simple arithmetic, with a short worked example. At most 80 words of main text. Use two or three choices.",
  strategist: "Ages 12 to 14. Use practical trade-offs, budgeting, business or leadership decisions when relevant. Explain reasoning at an accessible level. At most 105 words of main text. Use three choices when possible.",
} as const;

const explorerActivities: Partial<Record<string, string>> = {
  money_basics: "Discover coin, banknote and card. Count three coins, buy an apple and choose where a card gets its money.",
  needs_wants: "Sort picture cards into needs and wants, then make a spending choice.",
  saving: "Fill the saving jar, choose a safe place for money and choose between saving and sweets.",
  currencies: "Match pounds, lei, euros and yen to places, then choose what money to take to Japan.",
  scams: "Recognise a suspicious message and choose how to respond safely.",
  long_term_thinking: "Save for a bike, order weeks of savings, choose jar versus pocket, and order planning steps.",
  giving: "Sort things to keep or share, then choose a way to give.",
  digital_money: "Choose where digital money comes from.",
  investing_basics: "Order seed to flower, then distinguish investing from saving and consider losses.",
};

export async function getAssistantLesson(lessonId: string, locale: Locale) {
  const lesson = getLessonStructureById(lessonId);
  if (!lesson) return null;

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const base = (messages.curriculum as Record<string, LocalizedLessonText>)[lesson.id];
  if (!base) return null;
  const overlays: Record<string, Partial<LocalizedLessonText>> = romanianExplorerCopy.curriculum;
  const overlay = locale === "ro" ? overlays[lesson.id] : undefined;
  const copy = { ...base, ...overlay };

  const comic = lesson.ageBand === "explorer" && locale === "en" && hasExplorerComic(lesson.topicId)
    ? explorerComicTranscripts[lesson.topicId][locale]
    : undefined;
  const interactive = lesson.ageBand === "explorer" ? explorerActivities[lesson.topicId] : undefined;

  return {
    level: lesson.ageBand,
    instructions: levelGuide[lesson.ageBand],
    language: LOCALE_LABELS[locale].englishName,
    currency: LOCALE_LEARNING_CURRENCY[locale],
    topic: lesson.topicId,
    title: copy.title,
    objective: copy.learningObjective,
    concept: copy.keyConcept.slice(0, 220),
    explanation: (comic ?? copy.explanation).slice(0, 550),
    misconception: copy.commonMisconception.slice(0, 200),
    existingActivities: [copy.quiz.question, copy.interactiveActivity, copy.gameIdea, copy.challenge]
      .map((text) => text.slice(0, 140))
      .concat(interactive ?? []),
  };
}

export type AssistantLesson = NonNullable<Awaited<ReturnType<typeof getAssistantLesson>>>;
