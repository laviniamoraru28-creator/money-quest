"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_SUPPLIER_OPTION_IDS, EQ_SUPPLIER_OPTIONS, EQ_STOCK_SCENARIO_STOCK_LEVEL_BY_CHOICE } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

const STOCK_CHOICE_KEYS = Object.keys(EQ_STOCK_SCENARIO_STOCK_LEVEL_BY_CHOICE);

/**
 * "Suppliers and Stock" (brief section 10) — two short, connected
 * decisions: pick a supplier (a genuine trade-off, no automatically-
 * correct choice — see EQ_SUPPLIER_OPTIONS) and then a stock scenario,
 * which also sets the child's own stats.stockLevel directly (a
 * qualitative field, not something the generic effects table models).
 */
export default function SupplierAndStockPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision, setStockLevel, completeRunActivity } = useEntrepreneurQuest();
  const [subStep, setSubStep] = useState<"supplier" | "stock">("supplier");
  const [supplierChosen, setSupplierChosen] = useState<string | null>(null);
  const [stockChosen, setStockChosen] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const supplierRound: MissionRound = {
    id: "choose-a-supplier",
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.run.supplierAndStock.supplierPrompt"),
    choices: EQ_SUPPLIER_OPTION_IDS.map((id) => ({
      key: id,
      label: t(`entrepreneurQuest.run.supplierAndStock.suppliers.${id}.label`),
      consequence: t(`entrepreneurQuest.run.supplierAndStock.suppliers.${id}.consequence`),
    })),
  };

  const stockRound: MissionRound = {
    id: "stock-management-scenario",
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.run.supplierAndStock.stockPrompt"),
    choices: STOCK_CHOICE_KEYS.map((key) => ({
      key,
      label: t(`entrepreneurQuest.run.supplierAndStock.stockChoices.${key}.label`),
      consequence: t(`entrepreneurQuest.run.supplierAndStock.stockChoices.${key}.consequence`),
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

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.run.supplierAndStockLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.run.supplierAndStock.intro")}</p>

        {subStep === "supplier" && (
          <>
            <Card variant="data" className="mt-md overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-ink/60">
                    <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.supplierAndStock.supplierColumn")}</th>
                    <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.supplierAndStock.priceLevelLabel")}</th>
                    <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.supplierAndStock.deliverySpeedLabel")}</th>
                    <th className="pb-2xs pr-xs font-medium">{t("entrepreneurQuest.run.supplierAndStock.minimumOrderLabel")}</th>
                    <th className="pb-2xs font-medium">{t("entrepreneurQuest.run.supplierAndStock.qualityLabel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {EQ_SUPPLIER_OPTION_IDS.map((id) => {
                    const supplier = EQ_SUPPLIER_OPTIONS[id]!;
                    return (
                      <tr key={id} className="border-t border-ink/10">
                        <td className="py-2xs pr-xs font-medium">{t(`entrepreneurQuest.run.supplierAndStock.suppliers.${id}.label`)}</td>
                        <td className="py-2xs pr-xs">{t(`entrepreneurQuest.levels.${supplier.priceLevel}`)}</td>
                        <td className="py-2xs pr-xs">{t(`entrepreneurQuest.levels.${supplier.deliverySpeed}`)}</td>
                        <td className="py-2xs pr-xs">{t(`entrepreneurQuest.levels.${supplier.minimumOrder}`)}</td>
                        <td className="py-2xs">{t(`entrepreneurQuest.levels.${supplier.quality}`)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card variant="activity" className="mt-sm">
              <MissionMechanic
                round={supplierRound}
                currencyCode={progressState.currencyCode}
                uiLocale={uiLocale}
                usesCurrency={false}
                onAnswer={(_isCorrect, choiceKey) => {
                  setSupplierChosen(choiceKey ?? "");
                  recordDecision("choose-a-supplier", choiceKey ?? "");
                }}
                isResolved={false}
              />
              {supplierChosen !== null && (
                <Button variant="quest-primary" className="mt-sm w-full" onClick={() => setSubStep("stock")}>
                  {t("entrepreneurQuest.continueButton")}
                </Button>
              )}
            </Card>
          </>
        )}

        {subStep === "stock" && (
          <Card variant="activity" className="mt-md">
            <MissionMechanic
              round={stockRound}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              usesCurrency={false}
              onAnswer={(_isCorrect, choiceKey) => {
                setStockChosen(choiceKey ?? "");
                recordDecision("stock-management-scenario", choiceKey ?? "");
                const level = EQ_STOCK_SCENARIO_STOCK_LEVEL_BY_CHOICE[choiceKey ?? ""];
                if (level) setStockLevel(level);
              }}
              isResolved={false}
            />
            {stockChosen !== null && (
              <Link href="/entrepreneur-quest/run" className="mt-sm block">
                <Button variant="quest-primary" className="w-full" onClick={() => completeRunActivity("supplier-and-stock")}>
                  {t("entrepreneurQuest.saveAndContinueButton")}
                </Button>
              </Link>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
