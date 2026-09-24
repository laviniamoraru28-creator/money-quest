"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_CASH_FLOW_SCENARIO } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

const CASH_FLOW_CHOICE_KEYS = ["wait-for-payment", "use-savings-to-cover-costs", "ask-for-partial-payment-upfront"];

/**
 * "Cash Flow" (brief section 9) — teaches PROFIT != CASH via one fixed
 * scenario. This is the ONE place cashMinorUnits genuinely diverges
 * from revenue/costs — everywhere else in Entrepreneur Quest, cash
 * moves 1:1 with normal sales/decision effects, exactly like profit
 * would.
 */
export default function CashFlowPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision, completeRunActivity } = useEntrepreneurQuest();
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const round: MissionRound = {
    id: "cash-flow-decision",
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.run.cashFlow.decisionPrompt"),
    choices: CASH_FLOW_CHOICE_KEYS.map((key) => ({
      key,
      label: t(`entrepreneurQuest.run.cashFlow.choices.${key}.label`),
      consequence: t(`entrepreneurQuest.run.cashFlow.choices.${key}.consequence`),
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

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.run.cashFlowLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.run.cashFlow.intro")}</p>

        <Card variant="data" className="mt-md">
          <p className="text-base text-ink/80">
            {t("entrepreneurQuest.run.cashFlow.scenarioText", {
              orderAmount: formatCurrency(EQ_CASH_FLOW_SCENARIO.orderAmountMinorUnits, progressState.currencyCode, uiLocale),
              days: EQ_CASH_FLOW_SCENARIO.paymentDelayDays,
              upfrontCosts: formatCurrency(EQ_CASH_FLOW_SCENARIO.upfrontCostsMinorUnits, progressState.currencyCode, uiLocale),
            })}
          </p>
          <p className="mt-sm rounded-sm bg-fog p-sm text-sm font-medium text-ink/80">{t("entrepreneurQuest.run.cashFlow.profitVsCashExplainer")}</p>
        </Card>

        <Card variant="activity" className="mt-sm">
          <MissionMechanic
            round={round}
            currencyCode={progressState.currencyCode}
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              setChosenKey(choiceKey ?? "");
              recordDecision("cash-flow-decision", choiceKey ?? "");
            }}
            isResolved={false}
          />

          {(chosenKey !== null || state.completedRunActivityIds.includes("cash-flow")) && (
            <Link href="/entrepreneur-quest/run" className="mt-sm block">
              <Button variant="quest-primary" className="w-full" onClick={() => completeRunActivity("cash-flow")}>
                {t("entrepreneurQuest.saveAndContinueButton")}
              </Button>
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
