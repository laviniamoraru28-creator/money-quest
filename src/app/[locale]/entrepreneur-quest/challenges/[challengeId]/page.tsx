"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_CHALLENGE_IDS } from "@/content/entrepreneur-quest/structures";
import { CHALLENGE_AMOUNT_MINOR_UNITS } from "../../challenge-amounts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

export default function EntrepreneurQuestChallengePage() {
  const params = useParams<{ challengeId: string }>();
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, completeChallenge } = useEntrepreneurQuest();
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  const challengeId = params.challengeId;
  const isValidChallenge = EQ_CHALLENGE_IDS.includes(challengeId);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!isValidChallenge) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/entrepreneur-quest/challenges" className="mt-sm inline-block text-teal hover:underline">
            {t("entrepreneurQuest.challengesLink")}
          </Link>
        </div>
      </div>
    );
  }

  const amountMinorUnits = CHALLENGE_AMOUNT_MINOR_UNITS[challengeId];
  const amount = amountMinorUnits !== undefined ? formatCurrency(amountMinorUnits, progressState.currencyCode, uiLocale) : "";
  const title = t(`entrepreneurQuest.challenges.${challengeId}.title`, { amount });
  const situation = t(`entrepreneurQuest.challenges.${challengeId}.situation`, { amount });
  const choices = t.raw(`entrepreneurQuest.challenges.${challengeId}.choices`) as MissionRound["choices"];
  const round: MissionRound = { id: challengeId, mechanic: "mission", prompt: "", hint: "", explanation: "", situation, choices };
  const isDone = state.completedChallengeIds.includes(challengeId);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/challenges"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.challengesLink")}
        </Link>

        <Card variant="activity" className="mt-sm">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <div className="mt-sm">
            <MissionMechanic
              round={round}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              usesCurrency={false}
              onAnswer={(_isCorrect, choiceKey) => setChosenKey(choiceKey ?? "")}
              isResolved={false}
            />
          </div>

          {chosenKey !== null && !isDone && (
            <Button variant="quest-primary" className="mt-sm w-full" onClick={() => completeChallenge(challengeId)}>
              {t("entrepreneurQuest.saveAndContinueButton")}
            </Button>
          )}
          {isDone && (
            <p className="mt-sm text-sm font-medium text-success">✓ {t("entrepreneurQuest.challengeCompletedBadge")}</p>
          )}
        </Card>
      </main>
    </div>
  );
}
