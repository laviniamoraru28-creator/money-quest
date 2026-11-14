"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { LevelBadgeStar } from "@/components/ui/LevelBadgeStar";
import { KeyTermBadge } from "@/components/ui/KeyTermBadge";
import { GuidePanel } from "@/components/GuidePanel";
import { MoneyExamples } from "@/components/MoneyExamples";
import { explorerOtherTopics } from "@/content/explorer-other-lessons";
import { ExplorerInteractiveLesson } from "@/components/explorer/ExplorerInteractiveLesson";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { LessonIllustration } from "@/components/lesson/LessonIllustration";
import { getWorldById } from "@/content/worlds";
import { useAccessibilityPrefs } from "@/lib/accessibility/use-accessibility-preferences";
import { useSound } from "@/lib/audio/use-sound";
import { useAnswerOrder } from "@/lib/answer-order";
import type { ActivityDetail } from "@/lib/domain/activity";
import { isSupportedLocale } from "@/i18n/config";
import { romanianExplorerCopy } from "@/i18n/explorer-copy";
import { LOCALE_LEARNING_CURRENCY } from "@/lib/currency/learning-currency";

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
  const [section, setSection] = useState<"examples" | "lesson">("lesson");
  // Separate refs per section: both sections stay mounted at once (see
  // below), so a single shared ref would end up pointing at whichever
  // heading rendered last rather than the one actually being shown.
  const examplesHeading = useRef<HTMLHeadingElement>(null);
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const explorerReward = useRef<HTMLDivElement>(null);
  function changeSection(next: "examples" | "lesson") {
    // Both sections stay mounted (toggled with `hidden`, not conditional
    // rendering — see the "lesson"/"examples" divs below), specifically so
    // that leaving mid-activity and coming back doesn't lose progress: an
    // Explorer child partway through money_basics' multi-stage flow, or a
    // Builder/Strategist child with an answer already selected, picks up
    // exactly where they left off instead of starting over. No state to
    // reset here any more — only the section itself changes.
    stopSpeech();
    setSection(next);
    requestAnimationFrame(() => (next === "examples" ? examplesHeading : lessonHeading).current?.focus());
  }
  function stopSpeech() {
    window.dispatchEvent(new Event("moneyquest-stop-speech"));
    window.speechSynthesis?.cancel();
  }
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
  const isExplorer = activity.childAgeBand === "explorer";
  const lessonGoal = isExplorer && uiLocale === "ro" && activity.topicId === "money_basics"
    ? romanianExplorerCopy.moneyBasicsLessonGoal
    : t("activityGuide.lessonGoal", {title: activity.title});
  const rewardCurrencyCode = isExplorer && isSupportedLocale(uiLocale) ? LOCALE_LEARNING_CURRENCY[uiLocale] : activity.childCurrencyCode;
  const hasInteractiveExplorerLesson = isExplorer && ["money_basics","needs_wants","saving",...explorerOtherTopics].includes(activity.topicId);
  const world = getWorldById(activity.worldId);
  const worldThemeColor = world?.themeColor ?? "#0F7A6B";
  // Display order only — handleCheckAnswer below always compares the
  // selected option's own text against quiz.correct_answer, never a
  // position, so shuffling this never changes what counts as correct.
  const shuffledOptions = useAnswerOrder(quiz.options);

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

  // Shared success/reward UI for both the standard quiz flow and the
  // Explorer interactive-activity flow — the reward itself (XP, coins,
  // next-activity routing) doesn't depend on how the lesson was answered.
  const rewardPanel = (phase === "correct" || activity.isCompleted) && (
    <div ref={isExplorer ? explorerReward : undefined} tabIndex={isExplorer ? -1 : undefined} className="mt-md rounded-sm border border-success/30 bg-success/5 p-sm">
      {(!hasInteractiveExplorerLesson || phase === "unanswered") && (
        <p className="font-medium text-success-text">
          {activity.isCompleted && phase === "unanswered" ? t("lesson.alreadyCompleted") : feedbackMessage.success}
        </p>
      )}
      {!hasInteractiveExplorerLesson && <p className="mt-2xs text-sm text-ink/70">{quiz.explanation}</p>}
      {award && (award.xp > 0 || award.coins > 0) && (
        <div className="mt-sm flex items-center gap-md">
          {award.xp > 0 && <span className="font-bold text-teal-text">{t("lesson.xpEarned", { xp: award.xp })}</span>}
          {award.coins > 0 && (
            <span className="flex flex-col items-start">
              <span className="text-xs font-normal text-ink/70">{t("lesson.virtualCoinsLabel")}</span>
              <MoneyAmount amountMinorUnits={award.coins} currencyCode={rewardCurrencyCode} uiLocale={uiLocale} showCoinIcon />
            </span>
          )}
        </div>
      )}
      {award && (award.xp > 0 || award.coins > 0) && activity.content.rewardMessage && (
        <p className="mt-2xs text-sm italic text-ink/70">{activity.content.rewardMessage}</p>
      )}
      {activity.content.challenge && !focusMode && (
        <div className="mt-sm rounded-md border border-coral/30 bg-coral/10 p-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/70">{t("lesson.tryThisAtHome")}</p>
          <p className="mt-3xs text-sm text-ink/80">{activity.content.challenge}</p>
        </div>
      )}
      {isExplorer && nextActivityHref && activityPosition && activityPosition.position === activityPosition.total && (
        <p className="mt-sm text-base font-bold text-teal-text">{t("play.worldSequenceComplete")}</p>
      )}
      {nextActivityHref ? (
        <>
          <Button variant="quest-primary" size="large" className="mt-3 w-full break-words" onClick={() => { stopSpeech(); router.push(nextActivityHref); }}>
            {t("play.nextActivity")}
          </Button>
          <Button variant="secondary" size="large" className="mt-2xs w-full" onClick={() => router.push(backToWorldHref)}>
            {t("game.backToTheWorld")}
          </Button>
        </>
      ) : (
        <>
          <div className="mt-sm flex flex-col items-center gap-2xs">
            <LevelBadgeStar size={40} />
            <p className="text-sm font-bold text-teal-text">{t("play.levelComplete")}</p>
            <p className="text-sm text-ink/70">{t("play.worldSequenceComplete")}</p>
          </div>
          <Button variant="quest-primary" size="large" className="mt-2xs w-full" onClick={() => router.push(backToWorldHref)}>
            {t("game.backToTheWorld")}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-md">
      {/* Journey navigation — a real "Back" (to the previous activity,
          not just to the World menu) and an always-visible "Back to
          World" button, alongside a simple "Activity X of Y" position
          indicator, so a child always knows where they are and always
          has both stepping-backward options without returning to a
          menu first, matching the redesign brief's navigation
          requirements. Real Button components (not muted text links)
          so both read as actionable controls, not secondary metadata;
          flex-wrap keeps this from overflowing on narrow phones when a
          locale's labels run long. */}
      <div className="flex flex-wrap items-center gap-xs text-sm">
        {previousActivityHref && (
          <Button variant="secondary" onClick={() => router.push(previousActivityHref)}>
            <span aria-hidden="true">←</span> {t("common.back")}
          </Button>
        )}
        <Button variant="secondary" onClick={() => router.push(backToWorldHref)}>
          <span aria-hidden="true">🗺️</span> {t("game.backToTheWorld")}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/")}>
          <span aria-hidden="true">🏠</span> {t("nav.home")}
        </Button>
        {activityPosition && (
          <span className="ml-auto rounded-full bg-teal/10 px-sm py-3xs font-medium text-teal-text">
            {world && t("play.levelActivityProgress", { level: world.orderIndex, position: activityPosition.position, total: activityPosition.total })}
          </span>
        )}
      </div>

      {!isExplorer && <GuidePanel compact message={phase === "incorrect" ? t("activityGuide.lessonRetry") : phase === "correct" ? t("activityGuide.lessonComplete") : lessonGoal} />}
      <div data-lesson-section="examples" hidden={section !== "examples"} style={section !== "examples" ? {display: "none"} : undefined}>
        <h1 ref={examplesHeading} tabIndex={-1} className="font-display text-xl font-bold">{activity.title}</h1>
        <MoneyExamples />
        <Button variant="quest-primary" className="w-full" onClick={() => changeSection("lesson")}>{t("lesson.continueToLesson", {title: activity.title})}</Button>
      </div>
      {/* `hidden` alone isn't enough here: the UA stylesheet's `[hidden]
          {display:none}` rule loses to this div's own `.flex` class (equal
          specificity, author origin beats UA regardless of source order),
          so the section stayed visibly laid out underneath the examples
          section. The inline style forces it regardless of which classes
          are on the element. */}
      <div data-lesson-section="lesson" className="flex flex-col gap-md" hidden={section === "examples"} style={section === "examples" ? {display: "none"} : undefined}>
          {activity.topicId === "money_basics" && !isExplorer && <Button variant="secondary" onClick={() => changeSection("examples")}>{t("lesson.backToMoneyForms")}</Button>}
      {/* Screen-reader announcement of the quiz result — see
          GameShell.tsx's identical pattern and comment for why this
          is a separate, always-mounted live region with a SHORT
          status word rather than aria-live on the visible feedback
          card (which only mounts once `phase` leaves "unanswered")
          or a repeat of its full sentence (which previously collided
          with e2e getByText queries matching that same sentence). */}
      <div aria-live="polite" className="sr-only">
        {phase === "incorrect" && t("a11y.answerIncorrectAnnouncement")}
        {phase === "correct" && t("a11y.answerCorrectAnnouncement")}
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
          <LessonIllustration topicId={activity.topicId} label={activity.title} worldThemeColor={worldThemeColor} className="h-48 w-48 md:h-64 md:w-64" />
          <span className="absolute bottom-2xs right-sm font-display text-sm text-ink/70" aria-hidden="true">
            1
          </span>
        </div>

        <div className={isExplorer ? "relative bg-cream p-4 sm:p-lg md:col-span-3" : "relative bg-cream p-lg md:col-span-3"}>
          <div className="flex flex-col items-start gap-2xs">
            <h1 ref={lessonHeading} tabIndex={-1} className="font-display text-xl font-bold">{activity.title}</h1>
            <ReadAloudButton
              text={`${activity.content.shortIntroduction} ${activity.content.explanation} ${activity.content.story}`}
              uiLocale={uiLocale}
            />
          </div>
          <p className="mt-2xs text-base font-medium text-teal-text">{activity.content.shortIntroduction}</p>

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
                  <span key={v.term} className="inline-flex min-w-0 flex-wrap items-center gap-3xs">
                    <KeyTermBadge term={v.term} accentColor={TERM_ACCENTS[i % TERM_ACCENTS.length]} />
                    <span className="text-sm text-ink/70">- {v.definition}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Three authored-but-previously-unrendered fields, each its
              own clearly labelled, collapsed-by-default <details>
              disclosure. Native <details>/<summary> is keyboard- and
              screen-reader-operable with no new ARIA or JS state
              needed. Shown regardless of quiz-completion state —
              unlike the post-completion "Try This At Home" challenge
              below, a parent accompanying a child may want this
              context before or during the lesson, not only after a
              correct answer. Labelled for a mixed parent/child
              audience since there is no parent-only view in this
              app's no-accounts architecture (see docs/ for why) —
              worded so a curious child reading it isn't confused.
              `gameIdea` is deliberately NOT rendered here: a
              significant fraction of its authored text names a game
              that doesn't exist in the real registry (see
              src/content/catalog.ts) and needs a content-reconciliation
              pass first, not a UI change. */}
          {activity.content.parentNote && (
            <details className="mt-sm rounded-md border border-ink/15 bg-fog/60 p-sm text-sm">
              <summary className="cursor-pointer font-medium text-ink/70">
                {t("lesson.forParentsLabel")}
              </summary>
              <p className="mt-2xs text-ink/70">{activity.content.parentNote}</p>
            </details>
          )}

          {activity.content.interactiveActivity && (
            <details className="mt-2xs rounded-md border border-ink/15 bg-fog/60 p-sm text-sm">
              <summary className="cursor-pointer font-medium text-ink/70">
                {t("lesson.interactiveActivityLabel")}
              </summary>
              <p className="mt-2xs text-ink/70">{activity.content.interactiveActivity}</p>
            </details>
          )}

          {activity.content.commonMisconception && (
            <details className="mt-2xs rounded-md border border-ink/15 bg-fog/60 p-sm text-sm">
              <summary className="cursor-pointer font-medium text-ink/70">
                {t("lesson.commonMisconceptionLabel")}
              </summary>
              <p className="mt-2xs text-ink/70">{activity.content.commonMisconception}</p>
            </details>
          )}

          <span className="absolute bottom-2xs left-sm font-display text-sm text-ink/70" aria-hidden="true">
            2
          </span>
        </div>
      </div>

      {isExplorer && <GuidePanel compact message={phase === "incorrect" ? t("activityGuide.lessonRetry") : phase === "correct" ? t("activityGuide.lessonComplete") : lessonGoal} />}

      {hasInteractiveExplorerLesson ? (
        <Card variant="activity" className="min-w-0 border-2 border-coral/30 p-3 sm:p-lg">
          <ExplorerInteractiveLesson topicId={activity.topicId} onComplete={() => {
            stopSpeech();
            if (activity.isCompleted || phase === "correct") {
              explorerReward.current?.focus();
              return;
            }
            const result = onComplete(activity.id, true, activity.xpReward, activity.coinRewardMinorUnits);
            setAward({xp:result.xpAwarded,coins:result.coinsAwarded});
            setPhase("correct");
            playCorrect();
            requestAnimationFrame(() => explorerReward.current?.focus());
          }}/>
          {activity.topicId === "money_basics" && (
            <Button variant="secondary" onClick={() => changeSection("examples")}>{t("lesson.backToMoneyForms")}</Button>
          )}
          {rewardPanel}
        </Card>
      ) : (
      <Card variant="activity" className="border-2 border-coral/30">
        <div className="flex items-center gap-2xs">
          <span aria-hidden="true" className="text-xl">📖</span>
          <h3 className="font-display text-base font-bold text-ink">{t("lesson.realLifeScenario")}</h3>
        </div>
        <p className="mt-2xs rounded-lg bg-soft-blue/15 p-sm text-base leading-relaxed text-ink/80">
          {activity.content.story}
        </p>

        <p className="mt-md font-display text-lg font-bold text-teal-text">{t("lesson.whatWouldYouDo")}</p>
        <p className="mt-2xs text-base font-medium">{quiz.question}</p>
        {isExplorer && <ReadAloudButton text={quiz.question} uiLocale={uiLocale} />}

        <fieldset className="mt-sm" disabled={phase === "correct" || activity.isCompleted}>
          <legend className="sr-only">{t("lesson.answerOptions")}</legend>
          <div className={isExplorer ? "grid gap-4" : "grid gap-2xs"}>
            {shuffledOptions.map((option) => {
              const isSelected = selectedOption === option;
              const showAsCorrect = phase === "incorrect" && option === quiz.correct_answer;
              const showAsIncorrect = phase === "incorrect" && isSelected && option !== quiz.correct_answer;

              return (
                <label
                  key={option}
                  className={[
                    "flex min-h-touch-min-child cursor-pointer items-center gap-xs rounded-lg border-2 px-sm py-2xs text-base shadow-resting transition-colors duration-quick",
                    isExplorer ? "min-h-24 p-4 text-lg" : "",
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
                  <span className="answer-label min-w-0 flex-1 break-words">{option}</span>
                  {isExplorer && <span onClick={(event) => event.preventDefault()}><ReadAloudButton text={option} uiLocale={uiLocale} /></span>}
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
            <GuidePanel compact message={feedbackMessage.retry}/>
            <div className="mt-2xs flex items-start gap-2xs">
              
              <p className="text-sm text-ink/70">{quiz.explanation}</p>
            </div>
            <Button variant="secondary" className="mt-sm" onClick={handleTryAgain}>
              {t("common.tryAgain")}
            </Button>
          </div>
        )}

        {rewardPanel}
      </Card>
      )}
        </div>
    </div>
  );
}
