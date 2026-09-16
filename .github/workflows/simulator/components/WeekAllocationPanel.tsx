"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import { ALLOCATION_CATEGORIES, type AllocationCategory, type WeekAllocation } from "../types";

const STEP_MINOR_UNITS = 50;

interface WeekAllocationPanelProps {
  spendableIncomeMinorUnits: number;
  currencyCode: string;
  uiLocale: string;
  onConfirm: (allocation: WeekAllocation) => void;
}

/**
 * Deliberately NOT built on the game engine's AllocateMechanic, even
 * though the interaction looks similar — that mechanic checks an
 * allocation against a single "correct" target/tolerance (it's a quiz),
 * while this is a genuine open-ended budgeting decision with no right
 * answer to check against. Reusing it would have meant bolting a fake
 * target onto every week just to satisfy that component's contract,
 * which is the wrong kind of reuse — see docs/money-simulator.md.
 */
export function WeekAllocationPanel({ spendableIncomeMinorUnits, currencyCode, uiLocale, onConfirm }: WeekAllocationPanelProps) {
  const t = useTranslations();
  const initial = Object.fromEntries(ALLOCATION_CATEGORIES.map((c) => [c.key, 0])) as WeekAllocation;
  const [allocation, setAllocation] = useState<WeekAllocation>(initial);

  const allocatedTotal = Object.values(allocation).reduce((sum, v) => sum + v, 0);
  const remaining = spendableIncomeMinorUnits - allocatedTotal;

  function adjust(category: AllocationCategory, delta: number) {
    setAllocation((prev) => {
      const current = prev[category] ?? 0;
      const next = Math.max(0, current + delta);
      const wouldBeTotal = allocatedTotal - current + next;
      if (wouldBeTotal > spendableIncomeMinorUnits) return prev;
      return { ...prev, [category]: next };
    });
  }

  const fmt = (v: number) => formatCurrency(v, currencyCode, uiLocale);

  return (
    <div>
      <p className="text-sm text-ink/70">
        {t("simulator.noSingleRightSplit", { amount: fmt(spendableIncomeMinorUnits) })}
      </p>

      <div className="mt-sm grid gap-2xs">
        {ALLOCATION_CATEGORIES.map((category) => {
          const value = allocation[category.key] ?? 0;
          return (
            <div key={category.key} className="flex items-center justify-between rounded-sm border border-ink/15 px-sm py-2xs">
              <span className="font-medium">{t(category.labelKey)}</span>
              <div className="flex items-center gap-2xs">
                <button
                  type="button"
                  aria-label={t("a11y.decreaseCategory", { category: t(category.labelKey) })}
                  disabled={value === 0}
                  onClick={() => adjust(category.key, -STEP_MINOR_UNITS)}
                  className="grid h-touch-min w-touch-min place-items-center rounded-sm border border-ink/20 text-lg disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-[5rem] text-center font-bold tabular-nums">{fmt(value)}</span>
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

      <button
        type="button"
        disabled={remaining !== 0}
        onClick={() => onConfirm(allocation)}
        className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
      >
        {t("simulator.confirmMyPlan")}
      </button>
    </div>
  );
}
