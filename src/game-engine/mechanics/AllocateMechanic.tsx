"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { AllocateRound } from "../types";
import { formatCurrency } from "@/lib/currency/format";

const STEP_MINOR_UNITS = 100; // adjust in whole "coin" steps of 1.00 in major units
// Simplification: a fixed 100-minor-unit step works reasonably across all
// 7 launch currencies given the amounts these rounds deal in (roughly
// 5-65 major units per the Price Tier system), including JPY where
// minor units already equal major units. A currency-proportional step
// (e.g. 1% of totalMinorUnits) would be a reasonable future refinement
// if a game config ever needs much smaller or larger totals than that.

export function AllocateMechanic({ round, currencyCode, uiLocale, usesCurrency, onAnswer, isResolved }: MechanicProps<AllocateRound>) {
  const t = useTranslations();
  const initial = Object.fromEntries(round.categories.map((c) => [c.key, 0]));
  const [allocations, setAllocations] = useState<Record<string, number>>(initial);
  const [checked, setChecked] = useState(false);

  const allocatedTotal = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const remaining = round.totalMinorUnits - allocatedTotal;

  function adjust(categoryKey: string, delta: number) {
    if (isResolved) return;
    setAllocations((prev) => {
      const current = prev[categoryKey] ?? 0;
      const next = Math.max(0, current + delta);
      const wouldBeTotal = allocatedTotal - current + next;
      if (wouldBeTotal > round.totalMinorUnits) return prev; // can't over-allocate
      return { ...prev, [categoryKey]: next };
    });
    setChecked(false);
  }

  function submit() {
    const allWithinTolerance = round.targets.every((target) => {
      const allocated = allocations[target.categoryKey] ?? 0;
      return Math.abs(allocated - target.targetMinorUnits) <= target.toleranceMinorUnits;
    });
    setChecked(true);
    onAnswer(allWithinTolerance && remaining === 0);
  }

  const fmt = (v: number) => (usesCurrency ? formatCurrency(v, currencyCode, uiLocale) : String(v));

  return (
    <div>
      <p className="text-sm text-ink/70">
        {t.rich("game.allocateInstructions", {
          amount: fmt(round.totalMinorUnits),
          bold: (chunks) => <span className="font-bold text-teal">{chunks}</span>,
        })}
      </p>

      <div className="mt-sm grid gap-2xs">
        {round.categories.map((category) => {
          const target = round.targets.find((tgt) => tgt.categoryKey === category.key);
          const value = allocations[category.key] ?? 0;
          const withinTolerance = target ? Math.abs(value - target.targetMinorUnits) <= target.toleranceMinorUnits : true;

          return (
            <div key={category.key} className="flex items-center justify-between rounded-sm border border-ink/15 px-sm py-2xs">
              <span className="font-medium">{category.label}</span>
              <div className="flex items-center gap-2xs">
                <button
                  type="button"
                  aria-label={t("a11y.decreaseCategory", { category: category.label })}
                  disabled={isResolved || value === 0}
                  onClick={() => adjust(category.key, -STEP_MINOR_UNITS)}
                  className="grid h-touch-min w-touch-min place-items-center rounded-sm border border-ink/20 text-lg disabled:opacity-30"
                >
                  −
                </button>
                <span className={["min-w-[5rem] text-center font-bold tabular-nums", checked && !withinTolerance ? "text-error" : ""].join(" ")}>
                  {fmt(value)}
                </span>
                {checked && !withinTolerance && (
                  <span className="sr-only"> {t("a11y.categoryMayNeedAdjusting")}</span>
                )}
                <button
                  type="button"
                  aria-label={t("a11y.increaseCategory", { category: category.label })}
                  disabled={isResolved || remaining <= 0}
                  onClick={() => adjust(category.key, STEP_MINOR_UNITS)}
                  className="grid h-touch-min w-touch-min place-items-center rounded-sm border border-ink/20 text-lg disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-sm text-sm font-medium" aria-live="polite">
        {remaining === 0 ? (
          <span className="text-success">{t("game.everyCoinPlanned")}</span>
        ) : (
          <span className="text-ink/70">{t("game.coinsLeftToPlan", { amount: fmt(remaining) })}</span>
        )}
      </p>

      {!checked && !isResolved && (
        <button
          type="button"
          disabled={remaining !== 0}
          onClick={submit}
          className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
        >
          {t("game.checkMyPlan")}
        </button>
      )}
    </div>
  );
}
