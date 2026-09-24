"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency, toMinorUnits } from "@/lib/currency/format";
import { EQ_STARTING_MONEY_MINOR_UNITS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SimulatorRun } from "@/lib/entrepreneur-quest/state";

type AllocationKey = "materials" | "packaging" | "advertising" | "savedAside";

/** A small stepper input, one per spending category — the same
 * "avoid complicated forms, avoid tiny controls" idea the AllocateMechanic
 * game mechanic already follows, adapted here rather than reused
 * directly: AllocateMechanic renders categories against a target range
 * with pass/fail coloring, which doesn't fit a simulator step where
 * ANY valid split of the starting money is a legitimate choice, not a
 * right-or-wrong answer to check. */
const STEP_MINOR_UNITS = 100;

export default function EntrepreneurQuestSimulatorPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, runBusinessSimulator } = useEntrepreneurQuest();

  const [allocations, setAllocations] = useState<Record<AllocationKey, number>>({
    materials: 0,
    packaging: 0,
    advertising: 0,
    savedAside: 0,
  });
  const [result, setResult] = useState<SimulatorRun | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const currencyCode = progressState.currencyCode;
  const allocatedTotal = allocations.materials + allocations.packaging + allocations.advertising + allocations.savedAside;
  const remaining = EQ_STARTING_MONEY_MINOR_UNITS - allocatedTotal;

  function adjust(key: AllocationKey, delta: number) {
    setResult(null);
    setAllocations((prev) => {
      const current = prev[key];
      const next = Math.max(0, current + delta);
      const wouldBeTotal = allocatedTotal - current + next;
      if (wouldBeTotal > EQ_STARTING_MONEY_MINOR_UNITS) return prev;
      return { ...prev, [key]: next };
    });
  }

  function runSimulation() {
    const run = runBusinessSimulator({
      materialsMinorUnits: allocations.materials,
      packagingMinorUnits: allocations.packaging,
      advertisingMinorUnits: allocations.advertising,
      savedAsideMinorUnits: allocations.savedAside,
    });
    setResult(run);
  }

  const categories: { key: AllocationKey; labelKey: string }[] = [
    { key: "materials", labelKey: "entrepreneurQuest.simulator.categoryMaterials" },
    { key: "packaging", labelKey: "entrepreneurQuest.simulator.categoryPackaging" },
    { key: "advertising", labelKey: "entrepreneurQuest.simulator.categoryAdvertising" },
    { key: "savedAside", labelKey: "entrepreneurQuest.simulator.categorySavedAside" },
  ];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.simulator.title")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.simulator.intro")}</p>

        <Card variant="data" className="mt-md">
          <p className="text-sm text-ink/60">{t("entrepreneurQuest.simulator.startingMoneyLabel")}</p>
          <p className="font-display text-2xl font-bold text-teal">{formatCurrency(EQ_STARTING_MONEY_MINOR_UNITS, currencyCode, uiLocale)}</p>
        </Card>

        <Card variant="activity" className="mt-sm">
          <p className="text-base text-ink/80">
            {t("entrepreneurQuest.simulator.allocateInstructions", { amount: formatCurrency(EQ_STARTING_MONEY_MINOR_UNITS, currencyCode, uiLocale) })}
          </p>

          <div className="mt-sm grid gap-2xs">
            {categories.map((category) => (
              <div key={category.key} className="flex items-center justify-between rounded-sm border border-ink/15 px-sm py-2xs">
                <span className="font-medium">{t(category.labelKey)}</span>
                <div className="flex items-center gap-2xs">
                  <button
                    type="button"
                    aria-label={t("a11y.decreaseCategory", { category: t(category.labelKey) })}
                    disabled={allocations[category.key] === 0}
                    onClick={() => adjust(category.key, -STEP_MINOR_UNITS)}
                    className="grid h-touch-min w-touch-min place-items-center rounded-sm border border-ink/20 text-lg disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-[5rem] text-center font-bold tabular-nums">
                    {formatCurrency(allocations[category.key], currencyCode, uiLocale)}
                  </span>
                  <button
                    type="button"
                    aria-label={t("a11y.increaseCategory", { category: t(category.labelKey) })}
                    disabled={remaining <= 0}
                    onClick={() => adjust(category.key, STEP_MINOR_UNITS)}
                    className="grid h-touch-min w-touch-min place-items-center rounded-sm border border-ink/20 text-lg disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-sm text-sm font-medium" aria-live="polite">
            {remaining === 0 ? (
              <span className="text-success">{t("game.everyCoinPlanned")}</span>
            ) : (
              <span className="text-ink/70">{t("game.coinsLeftToPlan", { amount: formatCurrency(remaining, currencyCode, uiLocale) })}</span>
            )}
          </p>

          <Button variant="quest-primary" className="mt-sm w-full" disabled={remaining !== 0} onClick={runSimulation}>
            {t("entrepreneurQuest.simulator.seeResultButton")}
          </Button>
        </Card>

        {result && (
          <Card variant="reward" className="mt-sm">
            <h2 className="font-display text-xl font-bold">{t("entrepreneurQuest.simulator.resultTitle")}</h2>
            <div className="mt-sm grid gap-2xs text-base">
              <p>{t("entrepreneurQuest.simulator.unitsMadeLabel", { count: result.unitsMade })}</p>
              <p>{t("entrepreneurQuest.simulator.unitsSoldLabel", { count: result.unitsSold })}</p>
              <div className="mt-2xs grid grid-cols-2 gap-2xs">
                <StatBlock label={t("entrepreneurQuest.simulator.salesLabel")} value={formatCurrency(result.salesMinorUnits, currencyCode, uiLocale)} />
                <StatBlock label={t("entrepreneurQuest.simulator.costsLabel")} value={formatCurrency(result.costsMinorUnits, currencyCode, uiLocale)} />
                <StatBlock
                  label={t("entrepreneurQuest.simulator.profitLabel")}
                  value={formatCurrency(result.profitMinorUnits, currencyCode, uiLocale)}
                  emphasize
                />
                <StatBlock label={t("entrepreneurQuest.simulator.remainingLabel")} value={formatCurrency(result.remainingMoneyMinorUnits, currencyCode, uiLocale)} />
              </div>
            </div>
            <p className="mt-sm rounded-sm bg-fog p-sm text-sm text-ink/80">
              {result.profitMinorUnits > 0
                ? t("entrepreneurQuest.simulator.explanationProfit", { profit: formatCurrency(result.profitMinorUnits, currencyCode, uiLocale) })
                : t("entrepreneurQuest.simulator.explanationLoss")}
            </p>
            <div className="mt-sm flex flex-wrap gap-xs">
              <Button variant="secondary" onClick={() => setResult(null)}>
                {t("entrepreneurQuest.simulator.tryAgainButton")}
              </Button>
              <Link href="/entrepreneur-quest/build">
                <Button variant="quest-primary">{t("entrepreneurQuest.continueButton")}</Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatBlock({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded-sm border border-ink/10 p-xs">
      <p className="text-xs text-ink/60">{label}</p>
      <p className={["font-bold", emphasize ? "text-teal text-lg" : "text-ink"].join(" ")}>{value}</p>
    </div>
  );
}
