"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { LevelBadgeStar } from "@/components/ui/LevelBadgeStar";
import { KeyTermBadge } from "@/components/ui/KeyTermBadge";
import { CharacterSage } from "@/components/characters/CharacterSage";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { LessonIllustration } from "@/components/lesson/LessonIllustration";
import { getWorldById } from "@/content/worlds";
import { useAccessibilityPrefs } from "@/lib/accessibility/use-accessibility-preferences";
import { useSound } from "@/lib/audio/use-sound";
import type { ActivityDetail } from "@/lib/domain/activity";

interface LessonPlayerProps {
  activity: ActivityDetail;
  backToWorldHref: string;
  /** Href for the next activity in this world/age-band's sequence, or
   * null when this lesson is the last one — see
   * catalog.ts's getNextActivityInWorld() for how that's decided. A
   * missing/null value means the "Next Activity" button is not shown
   * at all, not shown-but-disabled, so there's never a button that
   * looks actionable but leads nowhere. */
  nextActivityHref: string | null;
  /** Mirror of nextActivityHref — the previous activity in this
   * world/age-band's sequence, or null when this is the first
   * activity. Powers the "Back" (to the previous activity) button,
   * kept deliberately distinct from backToWorldHref (which returns to
   * the World menu) — the redesign brief asks for both, as two
   * different, equally real options. */
  previousActivityHref: string | null;
  /** This activity's 1-indexed position and the total count in its
   * world/age-band sequence, e.g. {position: 3, total: 6} — powers
   * the "Activity 3 of 6" progress line. Null when the activity isn't
   * found in its own catalog (shouldn't happen in normal navigation),
   * in which case no progress line is shown rather than a wrong one. */
  activityPosition: { position: number; total: number } | null;
  /** Same decoupled-from-storage callback pattern as GameShell — see
   * that component's own comment on why. */
  onComplete: (activityId: string, wasCorrect: boolean, xpReward: number, coinRewardMinorUnits: number) => { xpAwarded: number; coinsAwarded: number };
}

type QuizPhase = "unanswered" | "correct" | "incorrect";

const TERM_ACCENTS = ["gold", "coral", "soft-blue"] as const;

export function LessonPlayer({ activity, backToWorldHref, nextActivityHref, previousActivityHref, activityPosition, onComplete }: LessonPlayerProps) {
  const router = useRouter();
  const uiLocale = useLocale();
  const t = useTranslations();
  const { playCorrect, playIncorrect, playGoalReached } = useSound();
  const { focusMode } = useAccessibilityPrefs();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("unanswered");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [award, setAward] = useState<{ xp: number; coins: number } | null>(
    activity.isCompleted ? { xp: 0, coins: 0 } : null
  );
  const { quiz, feedbackMessage } = activity.content;
  const world = getWorldById(activity.worldId);
  const worldThemeColor = world?.themeColor ?? "#0F7A6B";

  async function handleCheckAnswer() {
    if (!selectedOption) return;

    const isCorrect = selectedOption === quiz.correct_answer;
    setPhase(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      if (!nextActivityHref) {
        playGoalReached();
      } else {
        playCorrect();
      }
      setIsSubmitting(true);
      const result = onComplete(activity.id, true, activity.xpReward, activity.coinRewardMinorUnits);
      setIsSubmitting(false);
      setAward({ xp: result.xpAwarded, coins: result.coinsAwarded });
    } else {
      playIncorrect();
    }
  }

  function handleTryAgain() {
    setSelectedOption(null);
    setPhase("unanswered");
  }

  return (
    <div className="flex flex-col gap-md">
      {/* Journey navigation — a real "Back" (to the previous activity,
          not just to the World menu) alongside a simple "Activity X
          of Y" position indicator, so a child always knows where they
          are and can always step backward without returning to a
          menu, matching the redesign brief's navigation requirements. */}
      <div className="flex items-center justify-between text-sm">
        {previousActivityHref ? (
          <button
            type="button"
            onClick={() => router.push(previousActivityHref)}
            className="inline-flex min-h-touch-min items-center gap-3xs rounded-full border border-ink/15 bg-white px-sm text-ink/70 hover:bg-fog"
          >
            <span aria-hidden="true">←</span> {t("common.back")}
          </button>
        ) : (
          <span />
        )}
        {activityPosition && (
          <span className="rounded-full bg-teal/10 px-sm py-3xs font-medium text-teal">
            {world && t("play.levelActivityProgress", { level: world.orderIndex, position: activityPosition.position, total: activityPosition.total })}
          </span>
        )}
      </div>

      {/* The book — a two-page spread on desktop/tablet, stacked into
          a single page on mobile. Left page: an illustration relating
          directly to this lesson's topic (see LessonIllustration's
          own doc comment on scope). Right page: the actual reading
          content, broken into short sections rather than one long
          block of prose, per the redesign brief. */}
      <div className="overflow-hidden rounded-xl shadow-floating md:grid md:grid-cols-5">
        <div
          className="relative flex items-center justify-center p-lg md:col-span-2"
          style={{ backgroundColor: `${worldThemeColor}22` }}
        >
          <LessonIllustration topicId={activity.topicId} worldThemeColor={worldThemeColor} className="h-48 w-48 md:h-64 md:w-64" />
          <span className="absolute bottom-2xs right-sm font-display text-sm text-ink/40" aria-hidden="true">
            1
          </span>
        </div>

        <div className="relative bg-cream p-lg md:col-span-3">
          <div className="flex flex-col items-start gap-2xs">
            <h2 className="font-display text-xl font-bold">{activity.title}</h2>
            <ReadAloudButton
              text={`${activity.content.shortIntroduction} ${activity.content.explanation} ${activity.content.story}`}
              uiLocale={uiLocale}
            />
          </div>
          <p className="mt-2xs text-base font-medium text-teal">{activity.content.shortIntroduction}</p>

          {activity.content.keyConcept && (
            <div className="mt-sm rounded-md border-2 border-gold/40 bg-gold/10 p-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-text">{t("lesson.keyIdea")}</p>
              <p className="mt-3xs text-base font-medium text-ink">{activity.content.keyConcept}</p>
            </div>
          )}

          <p className="mt-sm text-base leading-relaxed text-ink/80">{activity.content.explanation}</p>

          {activity.content.vocabulary.length > 0 && !focusMode && (
            <div className="mt-sm">
              <p className="text-sm font-medium text-ink/70">{t("lesson.newWords")}</p>
              <div className="mt-2xs flex flex-wrap gap-2xs">
                {activity.content.vocabulary.map((v, i) => (
                  <span key={v.term} className="inline-flex items-center gap-3xs">
                    <KeyTermBadge term={v.term} accentColor={TERM_ACCENTS[i % TERM_ACCENTS.length]} />
                    <span className="text-sm text-ink/70">- {v.definition}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <span className="absolute bottom-2xs left-sm font-display text-sm text-ink/30" aria-hidden="true">
            2
          </span>
        </div>
      </div>

      {/* Real-Life Scenario — the story and quiz restyled as one
          interactive moment (a scenario, a decision, then why it
          makes sense) rather than a paragraph followed by a separate
          quiz block. This reuses the existing story/quiz content
          exactly as authored — nothing new was invented here, only
          how it's presented. */}
      <Card variant="activity" className="border-2 border-coral/30">
        <div className="flex items-center gap-2xs">
          <span aria-hidden="true" className="text-xl">📖</span>
          <h3 className="font-display text-base font-bold text-ink">{t("lesson.realLifeScenario")}</h3>
        </div>
        <p className="mt-2xs rounded-lg bg-soft-blue/15 p-sm text-base leading-relaxed text-ink/80">
          {activity.content.story}
        </p>

        <p className="mt-md font-display text-lg font-bold text-teal">{t("lesson.whatWouldYouDo")}</p>
        <p className="mt-2xs text-base font-medium">{quiz.question}</p>

        <fieldset className="mt-sm" disabled={phase === "correct" || activity.isCompleted}>
          <legend className="sr-only">{t("lesson.answerOptions")}</legend>
          <div className="grid gap-2xs">
            {quiz.options.map((option) => {
              const isSelected = selectedOption === option;
              const showAsCorrect = phase === "incorrect" && option === quiz.correct_answer;
              const showAsIncorrect = phase === "incorrect" && isSelected && option !== quiz.correct_answer;

              return (
                <label
                  key={option}
                  className={[
                    "flex min-h-touch-min-child cursor-pointer items-center gap-xs rounded-lg border-2 px-sm py-2xs text-base shadow-resting transition-colors duration-quick",
                    showAsCorrect ? "border-success bg-success/10" : "",
                    showAsIncorrect ? "border-error bg-error/10" : "",
                    !showAsCorrect && !showAsIncorrect && isSelected ? "border-teal bg-teal/5" : "",
                    !showAsCorrect && !showAsIncorrect && !isSelected ? "border-ink/15 bg-white" : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="quiz-option"
                    value={option}
                    checked={isSelected}
                    onChange={() => setSelectedOption(option)}
                  />
                  {option}
                  {showAsCorrect && (
                    <span>
                      <span aria-hidden="true"> ✓</span>
                      <span className="sr-only"> {t("lesson.correctAnswerSuffix")}</span>
                    </span>
                  )}
                  {showAsIncorrect && (
                    <span>
                      <span aria-hidden="true"> ✕</span>
                      <span className="sr-only"> {t("lesson.yourAnswerNotQuiteSuffix")}</span>
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {phase === "unanswered" && !activity.isCompleted && (
          <Button
            variant="quest-primary"
            size="large"
            className="mt-md w-full"
            disabled={!selectedOption}
            isLoading={isSubmitting}
            onClick={handleCheckAnswer}
          >
            {t("lesson.checkMyAnswer")}
          </Button>
        )}

        {phase === "incorrect" && (
          <div className="mt-md rounded-sm border border-error/30 bg-error/5 p-sm">
            <p className="font-medium text-error">{feedbackMessage.retry}</p>
            <div className="mt-2xs flex items-start gap-2xs">
              <CharacterSage size={32} className="shrink-0" />
              <p className="text-sm text-ink/70">{quiz.explanation}</p>
            </div>
            <Button variant="secondary" className="mt-sm" onClick={handleTryAgain}>
              {t("common.tryAgain")}
            </Button>
          </div>
        )}

        {(phase === "correct" || activity.isCompleted) && (
          <div className="mt-md rounded-sm border border-success/30 bg-success/5 p-sm">
            <p className="font-medium text-success">
              {activity.isCompleted && phase === "unanswered" ? t("lesson.alreadyCompleted") : feedbackMessage.success}
            </p>
            <div className="mt-2xs flex items-start gap-2xs">
              <CharacterSage size={32} className="shrink-0" />
              <p className="text-sm text-ink/70">{quiz.explanation}</p>
            </div>
            {award && (award.xp > 0 || award.coins > 0) && (
              <div className="mt-sm flex items-center gap-md">
                {award.xp > 0 && <span className="font-bold text-teal">{t("lesson.xpEarned", { xp: award.xp })}</span>}
                {award.coins > 0 && (
                  <span className="flex flex-col items-start">
                    <span className="text-xs font-normal text-ink/60">{t("lesson.virtualCoinsLabel")}</span>
                    <MoneyAmount amountMinorUnits={award.coins} currencyCode={activity.childCurrencyCode} uiLocale={uiLocale} showCoinIcon />
                  </span>
                )}
              </div>
            )}
            {award && (award.xp > 0 || award.coins > 0) && activity.content.rewardMessage && (
              <p className="mt-2xs text-sm italic text-ink/60">{activity.content.rewardMessage}</p>
            )}
            {activity.content.challenge && !focusMode && (
              <div className="mt-sm rounded-md border border-coral/30 bg-coral/10 p-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60">{t("lesson.tryThisAtHome")}</p>
                <p className="mt-3xs text-sm text-ink/80">{activity.content.challenge}</p>
              </div>
            )}
            {nextActivityHref ? (
              <>
                <Button
                  variant="quest-primary"
                  size="large"
                  className="mt-md w-full"
                  onClick={() => router.push(nextActivityHref)}
                >
                  {t("play.nextActivity")}
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  className="mt-2xs w-full"
                  onClick={() => router.push(backToWorldHref)}
                >
                  {t("game.backToTheWorld")}
                </Button>
              </>
            ) : (
              <>
                <div className="mt-sm flex flex-col items-center gap-2xs">
                <LevelBadgeStar size={40} />
                <p className="text-sm font-bold text-teal">{t("play.levelComplete")}</p>
                <p className="text-sm text-ink/70">{t("play.worldSequenceComplete")}</p>
              </div>
                <Button
                  variant="quest-primary"
                  size="large"
                  className="mt-2xs w-full"
                  onClick={() => router.push(backToWorldHref)}
                >
                  {t("game.backToTheWorld")}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
