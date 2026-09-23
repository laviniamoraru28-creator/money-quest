"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { CompareRound } from "../types";
import { formatCurrency } from "@/lib/currency/format";

export function CompareMechanic({ round, currencyCode, uiLocale, usesCurrency, onAnswer, isResolved }: MechanicProps<CompareRound>) {
  const t = useTranslations();
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  function submit() {
    if (!selected) return;
    setChecked(true);
    onAnswer(selected === round.correctOptionKey);
  }

  return (
    <div>
      <div className="grid gap-sm sm:grid-cols-2">
        {round.options.map((option) => {
          const isSelected = selected === option.key;
          const isCorrectOption = option.key === round.correctOptionKey;
          const showResult = checked;

          return (
            <button
              key={option.key}
              type="button"
              disabled={isResolved || checked}
              onClick={() => setSelected(option.key)}
              className={[
                "min-h-touch-min-child rounded-md border-2 p-sm text-left",
                showResult && isCorrectOption ? "border-success bg-success/10" : "",
                showResult && isSelected && !isCorrectOption ? "border-error bg-error/10" : "",
                !showResult && isSelected ? "border-teal bg-teal/5" : "",
                !showResult && !isSelected ? "border-ink/15" : "",
              ].join(" ")}
            >
              <p className="font-medium">{option.label}</p>
              <p className="mt-2xs text-lg font-bold text-ink">
                {usesCurrency ? formatCurrency(option.amountMinorUnits, currencyCode, uiLocale) : option.amountMinorUnits}
              </p>
              {option.detail && <p className="text-sm text-ink/70">{option.detail}</p>}
              {showResult && isCorrectOption && (
                <p className="mt-2xs text-sm font-medium text-success">
                  <span aria-hidden="true">✓</span> {t("game.bestChoice")}
                </p>
              )}
              {showResult && isSelected && !isCorrectOption && (
                <p className="mt-2xs text-sm font-medium text-error">
                  <span aria-hidden="true">✗</span> {t("game.notBestValue")}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {!checked && !isResolved && (
        <button
          type="button"
          disabled={!selected}
          onClick={submit}
          className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
        >
          {t("game.checkMyChoice")}
        </button>
      )}
    </div>
  );
}
