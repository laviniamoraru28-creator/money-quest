"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_PRICING_EXPERIMENT_ROWS } from "@/content/entrepreneur-quest/structures";
import { computePricingExperimentRow } from "@/lib/entrepreneur-quest/state";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

const PRICE_CHOICE_KEYS = ["pick-low-price", "pick-middle-price", "pick-high-price"];

/**
 * "Pricing Experiment" (brief section 11) — every row is pre-authored
 * (see EQ_PRICING_EXPERIMENT_ROWS), never live-random, so the lesson
 * ("higher price does not automatically mean higher profit; lower
 * price does not automatically mean more profit") always lands the
 * same, checkable way. Deliberately does NOT change the child's own
 * business price — this is practice with authored numbers, exactly
 * like the standalone Business Challenges.
 */
export default function PricingExperimentPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision, completeRunActivity } = useEntrepreneurQuest();
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const isDone = state.completedRunActivityIds.includes("pricing-experiment");
  const round: MissionRound = {
    id: "pricing-experiment-reflection",
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.run.pricingExperiment.reflectionPrompt"),
    choices: PRICE_CHOICE_KEYS.map((key) => ({
      key,
      label: t(`entrepreneurQuest.run.pricingExperiment.reflectionChoices.${key}.label`),
      consequence: t(`entrepreneurQuest.run.pricingExperiment.reflectionChoices.${key}.consequence`),
    })),
  };

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/run"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.run.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.run.pricingExperimentLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.run.pricingExperiment.intro")}</p>

        <Card variant="data" className="mt-md overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-ink/60">
                <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.pricingExperiment.priceColumn")}</th>
                <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.pricingExperiment.unitsSoldColumn")}</th>
                <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.dashboard.revenueLabel")}</th>
                <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.dashboard.costsLabel")}</th>
                <th className="pb-2xs font-medium">{t("entrepreneurQuest.dashboard.profitLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {EQ_PRICING_EXPERIMENT_ROWS.map((row) => {
                const computed = computePricingExperimentRow(row);
                return (
                  <tr key={row.priceMinorUnits} className="border-t border-ink/10">
                    <td className="py-2xs pr-xs font-medium">{formatCurrency(row.priceMinorUnits, progressState.currencyCode, uiLocale)}</td>
                    <td className="py-2xs pr-xs">{row.unitsSold}</td>
                    <td className="py-2xs pr-xs">{formatCurrency(computed.revenueMinorUnits, progressState.currencyCode, uiLocale)}</td>
                    <td className="py-2xs pr-xs">{formatCurrency(computed.costsMinorUnits, progressState.currencyCode, uiLocale)}</td>
                    <td className="py-2xs font-bold text-teal">{formatCurrency(computed.profitMinorUnits, progressState.currencyCode, uiLocale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card variant="activity" className="mt-sm">
          <MissionMechanic
            round={round}
            currencyCode={progressState.currencyCode}
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              setChosenKey(choiceKey ?? "");
              recordDecision("pricing-experiment-reflection", choiceKey ?? "");
            }}
            isResolved={false}
          />

          {(chosenKey !== null || isDone) && (
            <Link href="/entrepreneur-quest/run" className="mt-sm block">
              <Button variant="quest-primary" className="w-full" onClick={() => completeRunActivity("pricing-experiment")}>
                {t("entrepreneurQuest.saveAndContinueButton")}
              </Button>
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
