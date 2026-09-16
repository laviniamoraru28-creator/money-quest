"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AgeBand } from "@/types/database.types";
import type { GameConfig, DifficultyTier, GameVariant } from "./types";
import { getVariant } from "./types";
import { MECHANIC_REGISTRY } from "./registry";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MoneyAmount } from "@/components/ui/MoneyAmount";
import { LevelBadgeStar } from "@/components/ui/LevelBadgeStar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CharacterZip } from "@/components/characters/CharacterZip";
import { getWorldById } from "@/content/worlds";
import { useSound } from "@/lib/audio/use-sound";

interface GameShellProps {
  config: GameConfig;
  ageBand: AgeBand;
  difficulty?: DifficultyTier;
  currencyCode: string;
  /** The id this game is registered under in the local, on-device
   * progress store (see src/lib/local-progress/) — decoupled from any
   * specific storage backend: GameShell doesn't know or care whether
   * `onComplete` writes to localStorage, a database, or anywhere else.
   * It only needs the id to pass through, and the reward numbers
   * already live in this config's own `variant.xpReward`/`coinRewardMinorUnits`. */
  gameActivityId: string;
  /** Called once, when the game is finished — the caller (a page
   * component) decides how and where progress is actually recorded. */
  onComplete: (activityId: string, wasCorrect: boolean, xpReward: number, coinRewardMinorUnits: number) => { xpAwarded: number; coinsAwarded: number };
  backHref: string;
  /** Same contract as LessonPlayer's nextActivityHref — see that
   * component's own comment. */
  nextActivityHref: string | null;
  /** Same contract as LessonPlayer's previousActivityHref/activityPosition. */
  previousActivityHref: string | null;
  activityPosition: { position: number; total: number } | null;
  /** Needed to look up the World's orderIndex for the "Level N" part
   * of the progress label — LessonPlayer gets this from
   * activity.worldId, but GameConfig doesn't carry a worldId itself
   * (a game's structural registry entry does, but that's not part of
   * GameConfig), so it's passed in directly here instead. */
  worldId: string;
}

type RoundPhase = "playing" | "correct" | "incorrect";

/**
 * The one component every game renders through. A new game never needs a
 * new shell — only a new GameConfig (see configs/) and, only if it
 * genuinely needs an 8th interaction pattern, a new mechanic (see
 * mechanics/ and registry.ts). This component owns none of the
 * game-specific content or scoring rules for any individual game — those
 * all live in the config.
 */
export function GameShell({ config, ageBand, difficulty = "standard", currencyCode, gameActivityId, onComplete, backHref, nextActivityHref, previousActivityHref, activityPosition, worldId }: GameShellProps) {
  const router = useRouter();
  const uiLocale = useLocale();
  const t = useTranslations();
  const { playCorrect, playIncorrect, playComplete, playGoalReached } = useSound();
  const variant = getVariant(config, ageBand, difficulty);
  const world = getWorldById(worldId);

  const [roundIndex, setRoundIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0); // bumped on retry to force the mechanic to remount with fresh state
  const [phase, setPhase] = useState<RoundPhase>("playing");
  const [showHint, setShowHint] = useState(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [hasRetriedThisRound, setHasRetriedThisRound] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [award, setAward] = useState<{ xp: number; coins: number } | null>(null);

  if (!variant) {
    return (
      <Card variant="data">
        <p className="text-base text-ink/70">
          {t("game.notReadyForAgeGroup")}
        </p>
        <Button variant="secondary" className="mt-sm" onClick={() => router.push(backHref)}>
          {t("common.back")}
        </Button>
      </Card>
    );
  }

  const round = variant.rounds[roundIndex];
  if (!round) {
    // Defensive guard against an out-of-range roundIndex — should be
    // unreachable in normal play since handleNextRound only increments
    // up to rounds.length - 1, but noUncheckedIndexedAccess correctly
    // flags that array access as possibly undefined, so this is a real
    // check, not decoration.
    return (
      <Card variant="data">
        <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
        <Button variant="secondary" className="mt-sm" onClick={() => router.push(backHref)}>
          {t("common.back")}
        </Button>
      </Card>
    );
  }
  const isLastRound = roundIndex === variant.rounds.length - 1;
  const MechanicComponent = MECHANIC_REGISTRY[round.mechanic];

  // Re-bound to a new const so its static type is `GameVariant` rather
  // than `GameVariant | undefined` — TypeScript's narrowing of `variant`
  // from the early-return check above does not persist into the nested
  // `handleAnswer` closure below, even though `variant` is a `const`
  // that's never reassigned. This is a real TS control-flow limitation
  // for closures, not a bug in the logic itself.
  const activeVariant: GameVariant = variant;

  async function handleAnswer(isCorrect: boolean) {
    setPhase(isCorrect ? "correct" : "incorrect");
    if (isCorrect && !hasRetriedThisRound) {
      setFirstTryCorrectCount((c) => c + 1);
    }

    if (isCorrect && isLastRound) {
      if (!nextActivityHref) {
        playGoalReached();
      } else {
        playComplete();
      }
      setIsFinished(true);
      setIsAwarding(true);
      const passed =
        firstTryCorrectCount + (hasRetriedThisRound ? 0 : 1) >=
        Math.ceil(activeVariant.rounds.length * activeVariant.passingScoreFraction);
      // Synchronous now (no network round-trip — a local-storage write
      // instead of a Supabase RPC), but kept awaited in case a future
      // onComplete implementation ever needs to be async again; costs
      // nothing when it isn't.
      const result = await Promise.resolve(onComplete(gameActivityId, passed, activeVariant.xpReward, activeVariant.coinRewardMinorUnits));
      setIsAwarding(false);
      setAward({ xp: result.xpAwarded, coins: result.coinsAwarded });
    } else if (isCorrect) {
      playCorrect();
    } else {
      playIncorrect();
    }
  }

  function handleNextRound() {
    setRoundIndex((i) => i + 1);
    setPhase("playing");
    setShowHint(false);
    setHasRetriedThisRound(false);
    setAttemptKey((k) => k + 1);
  }

  function handleRetry() {
    setPhase("playing");
    setHasRetriedThisRound(true);
    setAttemptKey((k) => k + 1);
  }

  if (isFinished) {
    const scorePercent = Math.round((firstTryCorrectCount / variant.rounds.length) * 100);
    return (
      <Card variant="reward" className="text-center">
        <h2 className="font-display text-2xl font-bold">{t("game.questComplete")}</h2>
        <p className="mt-2xs text-base text-ink/70">
          {t("game.scoreLine", { correct: firstTryCorrectCount, total: variant.rounds.length, percent: scorePercent })}
        </p>

        {isAwarding && <p className="mt-sm text-sm text-ink/70">{t("game.addingUpRewards")}</p>}

        {award && (award.xp > 0 || award.coins > 0) && (
          <div className="mt-sm flex items-center justify-center gap-md">
            <span className="font-bold text-teal">{t("lesson.xpEarned", { xp: award.xp })}</span>
            {award.coins > 0 && (
              <span className="flex flex-col items-start">
                <span className="text-xs font-normal text-ink/60">{t("lesson.virtualCoinsLabel")}</span>
                <MoneyAmount amountMinorUnits={award.coins} currencyCode={currencyCode} uiLocale={uiLocale} showCoinIcon />
              </span>
            )}
          </div>
        )}

        {nextActivityHref ? (
          <>
            <Button variant="quest-primary" size="large" className="mt-md w-full" onClick={() => router.push(nextActivityHref)}>
              {t("play.nextActivity")}
            </Button>
            <Button variant="secondary" size="large" className="mt-2xs w-full" onClick={() => router.push(backHref)}>
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
            <Button variant="quest-primary" size="large" className="mt-2xs w-full" onClick={() => router.push(backHref)}>
              {t("game.backToTheWorld")}
            </Button>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {/* Journey navigation — same "Back to the previous activity" +
          "Activity X of Y" pattern as LessonPlayer, so the two
          activity types (lessons and games) give a child identical
          navigation and positioning cues throughout a World. Shown
          only on the "still playing" view, not the completion screen
          below — there, the Next/Back-to-World buttons already are
          the navigation, and a back-to-previous-activity link at
          that point would just replay the game the child just
          finished. */}
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

      {/* Progress */}
      <div>
        <p className="text-sm text-ink/70" aria-live="polite">
          {t("game.roundOf", { current: roundIndex + 1, total: variant.rounds.length })}
        </p>
        <div className="mt-3xs h-2 w-full">
          <ProgressBar percent={((roundIndex + 1) / variant.rounds.length) * 100} label={t("a11y.gameProgressLabel")} />
        </div>
      </div>

      <Card variant="activity">
        <p className="text-lg font-medium">{round.prompt}</p>

        <div className="mt-sm">
          <MechanicComponent
            key={`${round.id}-${attemptKey}`}
            round={round}
            currencyCode={currencyCode}
            uiLocale={uiLocale}
            usesCurrency={config.usesCurrency}
            onAnswer={handleAnswer}
            isResolved={phase === "correct"}
          />
        </div>

        {phase === "playing" && (
          <div className="mt-sm">
            {!showHint ? (
              <button type="button" onClick={() => setShowHint(true)} className="text-sm font-medium text-teal underline-offset-2 hover:underline">
                {t("game.needHint")}
              </button>
            ) : (
              <p className="rounded-sm bg-gold/10 px-xs py-2xs text-sm text-ink/80">💡 {round.hint}</p>
            )}
          </div>
        )}

        {phase === "correct" && (
          <div className="mt-md rounded-sm border border-success/30 bg-success/5 p-sm">
            <p className="font-medium text-success">{config.feedback.correct}</p>
            <p className="mt-2xs text-sm text-ink/70">{round.explanation}</p>
            {!isLastRound && (
              <Button variant="quest-primary" className="mt-sm w-full" onClick={handleNextRound}>
                {t("game.nextRound")}
              </Button>
            )}
          </div>
        )}

        {phase === "incorrect" && (
          <div className="mt-md rounded-sm border border-error/30 bg-error/5 p-sm">
            <p className="font-medium text-error">{config.feedback.incorrect}</p>
            <div className="mt-2xs flex items-start gap-2xs">
              {config.key === "money-mistakes-lab" && <CharacterZip size={32} className="shrink-0" />}
              <p className="text-sm text-ink/70">{round.explanation}</p>
            </div>
            <Button variant="secondary" className="mt-sm" onClick={handleRetry}>
              {t("common.tryAgain")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
