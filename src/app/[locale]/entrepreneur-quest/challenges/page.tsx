"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_CHALLENGE_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { CHALLENGE_AMOUNT_MINOR_UNITS } from "../challenge-amounts";

export default function EntrepreneurQuestChallengesPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded } = useEntrepreneurQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.challengesListTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.challengesListIntro")}</p>

        <div className="mt-md grid gap-sm">
          {EQ_CHALLENGE_IDS.map((challengeId) => {
            const isDone = state.completedChallengeIds.includes(challengeId);
            const amountMinorUnits = CHALLENGE_AMOUNT_MINOR_UNITS[challengeId];
            const amount = amountMinorUnits !== undefined ? formatCurrency(amountMinorUnits, progressState.currencyCode, uiLocale) : "";
            return (
              <Link key={challengeId} href={`/entrepreneur-quest/challenges/${challengeId}`}>
                <Card variant="activity" className="flex items-center justify-between transition-shadow hover:shadow-floating">
                  <span className="font-medium">{t(`entrepreneurQuest.challenges.${challengeId}.title`, { amount })}</span>
                  {isDone && <span className="rounded-full bg-gold/20 px-sm py-3xs text-xs font-medium">✓ {t("entrepreneurQuest.challengeCompletedBadge")}</span>}
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
