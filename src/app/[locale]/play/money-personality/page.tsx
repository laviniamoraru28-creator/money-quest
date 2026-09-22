"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";

/**
 * A light, non-judgmental self-reflection quiz — deliberately NOT
 * built on the game engine (src/game-engine/), since there is no
 * correct answer here and nothing to grade. Also deliberately not
 * wired into progress/XP/coins or the world catalog's next-activity
 * sequencing: this is an optional side activity a child can take or
 * skip entirely, not a step in the core curriculum. All content comes
 * from the `moneyPersonality` namespace via t.raw() — same pattern as
 * curriculum/games/simulator content, just a simpler shape since there's
 * no structural (locale-independent) half to separate out here: every
 * piece of this quiz is prose, translated in full per language.
 */

type ResultKey = "saver" | "planner" | "shopper" | "thinker" | "giver";
const RESULT_ORDER: ResultKey[] = ["saver", "planner", "shopper", "thinker", "giver"];

interface QuizQuestion {
  prompt: string;
  options: string[];
}
interface QuizResult {
  name: string;
  description: string;
  challenge: string;
}
interface QuizContent {
  title: string;
  subtitle: string;
  startButton: string;
  retakeButton: string;
  backToWorldMap: string;
  resultIntro: string;
  challengeLabel: string;
  questions: QuizQuestion[];
  results: Record<ResultKey, QuizResult>;
}

export default function MoneyPersonalityPage() {
  const t = useTranslations() as unknown as { raw: (key: string) => unknown };
  const content = t.raw("moneyPersonality") as QuizContent;

  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerCounts, setAnswerCounts] = useState<number[]>(() => RESULT_ORDER.map(() => 0));

  const isFinished = started && questionIndex >= content.questions.length;

  function answer(optionIndex: number) {
    setAnswerCounts((prev) => prev.map((count, i) => (i === optionIndex ? count + 1 : count)));
    setQuestionIndex((i) => i + 1);
  }

  function retake() {
    setQuestionIndex(0);
    setAnswerCounts(RESULT_ORDER.map(() => 0));
    setStarted(true);
  }

  // First index reaching the highest count wins — a simple, honest
  // tie-break (earliest-answered leaning) rather than an elaborate
  // blended-result system, matching how light this activity is meant
  // to stay.
  const topIndex = answerCounts.reduce((best, count, i) => (count > (answerCounts[best] ?? 0) ? i : best), 0);
  const resultKey = RESULT_ORDER[topIndex] ?? "saver";
  const result = content.results[resultKey];
  const currentQuestion = content.questions[questionIndex];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/play"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {content.backToWorldMap}
        </Link>
        <h1 className="mt-sm font-display text-2xl font-bold">{content.title}</h1>
        <p className="mt-2xs text-base text-ink/70">{content.subtitle}</p>

        {!started && (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-md min-h-touch-min-child rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting hover:bg-teal/90"
          >
            {content.startButton}
          </button>
        )}

        {started && !isFinished && currentQuestion && (
          <Card variant="data" className="mt-md">
            <p className="text-base font-medium">{currentQuestion.prompt}</p>
            <div className="mt-sm grid gap-2xs">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => answer(i)}
                  className="min-h-touch-min-child rounded-md border-2 border-ink/15 p-sm text-left hover:border-teal hover:bg-teal/5"
                >
                  {option}
                </button>
              ))}
            </div>
          </Card>
        )}

        {isFinished && (
          <Card variant="data" className="mt-md text-center">
            <p className="text-sm text-ink/60">{content.resultIntro}</p>
            <p className="mt-2xs font-display text-2xl font-bold text-teal">{result.name}</p>
            <p className="mt-sm text-base text-ink/80">{result.description}</p>
            <p className="mt-md text-sm font-medium">{content.challengeLabel}</p>
            <p className="mt-2xs text-base text-ink/80">{result.challenge}</p>
            <div className="mt-md flex flex-col items-center gap-2xs">
              <button
                type="button"
                onClick={retake}
                className="min-h-touch-min-child rounded-lg border-2 border-teal px-md py-xs font-medium text-teal hover:bg-teal/5"
              >
                {content.retakeButton}
              </button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
