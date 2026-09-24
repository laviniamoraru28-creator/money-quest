"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_RESCUE_SCENARIO } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BusinessProblemMechanic } from "@/components/entrepreneur-quest/BusinessProblemMechanic";

/**
 * "Business Rescue" (brief section 20) — the child receives a company
 * that already exists (the fixed Trout Farm scenario), NOT their own,
 * with its own isolated local stats (state.rescue.stats). Reuses the
 * same Business Problems content/mechanic as Run, applied against
 * this separate dataset instead. The outcome is derived
 * deterministically, never randomly, and never framed as punishment.
 */
export default function BusinessRescuePage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, startRescue, recordRescueDecision, finishRescue } = useEntrepreneurQuest();
  // Deliberately a LOCAL step, not derived from rescue.completedProblemIds:
  // recordRescueDecision() marks a problem complete the instant a
  // response is chosen, but the child still needs to read that
  // response's consequence text before moving on. Advancing only
  // happens when they explicitly hit BusinessProblemMechanic's own
  // "Continue" button (onFinish), never automatically. Declared before
  // the loading guard below so hook order never changes across renders.
  const [problemStep, setProblemStep] = useState(0);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const { rescue } = state;
  const profitMinorUnits = rescue.stats.revenueMinorUnits - rescue.stats.costsMinorUnits;
  const currentProblemId = EQ_RESCUE_SCENARIO.problemIds[problemStep];
  const isLastProblem = problemStep === EQ_RESCUE_SCENARIO.problemIds.length - 1;

  const statLines = [
    { label: t("entrepreneurQuest.dashboard.revenueLabel"), value: formatCurrency(rescue.stats.revenueMinorUnits, progressState.currencyCode, uiLocale) },
    { label: t("entrepreneurQuest.dashboard.costsLabel"), value: formatCurrency(rescue.stats.costsMinorUnits, progressState.currencyCode, uiLocale) },
    { label: t("entrepreneurQuest.dashboard.profitLabel"), value: formatCurrency(profitMinorUnits, progressState.currencyCode, uiLocale) },
    { label: t("entrepreneurQuest.dashboard.reputationLabel"), value: t("entrepreneurQuest.dashboard.reputationValue", { stars: rescue.stats.reputationOutOf5.toFixed(1) }) },
  ];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/rescue-grow"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.rescueGrow.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.rescueGrow.businessRescueLink")}</h1>

        {!rescue.started && (
          <Card variant="activity" className="mt-md">
            <p className="text-base text-ink/80">{t("entrepreneurQuest.rescueGrow.businessRescue.introStory")}</p>
            <div className="mt-sm grid grid-cols-2 gap-2xs">
              <MiniStat label={t("entrepreneurQuest.dashboard.revenueLabel")} value={formatCurrency(EQ_RESCUE_SCENARIO.startingStats.revenueMinorUnits, progressState.currencyCode, uiLocale)} />
              <MiniStat label={t("entrepreneurQuest.dashboard.costsLabel")} value={formatCurrency(EQ_RESCUE_SCENARIO.startingStats.costsMinorUnits, progressState.currencyCode, uiLocale)} />
              <MiniStat label={t("entrepreneurQuest.dashboard.customersLabel")} value={String(EQ_RESCUE_SCENARIO.startingStats.customersTotal)} />
              <MiniStat label={t("entrepreneurQuest.dashboard.reputationLabel")} value={t("entrepreneurQuest.dashboard.reputationValue", { stars: EQ_RESCUE_SCENARIO.startingStats.reputationOutOf5.toFixed(1) })} />
            </div>
            <Button variant="quest-primary" className="mt-sm w-full" onClick={startRescue}>
              {t("entrepreneurQuest.rescueGrow.businessRescue.startButton")}
            </Button>
          </Card>
        )}

        {rescue.started && currentProblemId && rescue.outcome === null && (
          <Card variant="activity" className="mt-md" key={currentProblemId}>
            <h2 className="font-display text-lg font-bold">{t(`entrepreneurQuest.problems.${currentProblemId}.title`)}</h2>
            <BusinessProblemMechanic
              problemId={currentProblemId}
              statLines={statLines}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              onRespond={(responseKey) => recordRescueDecision(currentProblemId, responseKey)}
              onFinish={() => {
                if (isLastProblem) {
                  finishRescue();
                } else {
                  setProblemStep((s) => s + 1);
                }
              }}
            />
          </Card>
        )}

        {rescue.outcome !== null && (
          <Card variant="reward" className="mt-md">
            <h2 className="font-display text-xl font-bold">{t(`entrepreneurQuest.rescueGrow.businessRescue.outcomes.${rescue.outcome}.title`)}</h2>
            <p className="mt-2xs text-base text-ink/80">{t(`entrepreneurQuest.rescueGrow.businessRescue.outcomes.${rescue.outcome}.text`)}</p>
            <div className="mt-sm grid grid-cols-2 gap-2xs">
              {statLines.map((line) => (
                <MiniStat key={line.label} label={line.label} value={line.value} />
              ))}
            </div>
            <Link href="/entrepreneur-quest/rescue-grow/review" className="mt-sm block">
              <Button variant="quest-primary" className="w-full">
                {t("entrepreneurQuest.rescueGrow.reviewLink")}
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-ink/10 p-xs">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-base font-medium text-ink">{value}</p>
    </div>
  );
}
