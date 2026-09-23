"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { NumericRound } from "../types";
import { getCurrencyOption } from "@/lib/currency/format";

export function NumericMechanic({ round, currencyCode, usesCurrency, onAnswer, isResolved }: MechanicProps<NumericRound>) {
  const t = useTranslations();
  // Note: this component shows a currency SYMBOL beside an input field
  // (an affordance, not a formatted amount), so it doesn't call
  // formatCurrency() and doesn't need uiLocale — unlike CompareMechanic/
  // AllocateMechanic, which format real amounts and do. Whether the
  // symbol sits before/after the input could also be made locale-aware
  // for full consistency (some locales would put the code after), but
  // that's a minor input-affordance detail, not a displayed amount — left
  // as a known simplification rather than silently inconsistent without
  // a note.
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);

  const currency = usesCurrency ? getCurrencyOption(currencyCode) : null;

  function submit() {
    const parsed = Number(inputValue);
    if (Number.isNaN(parsed)) return;

    // Compared directly in MAJOR units (whatever the child actually
    // typed, e.g. "10" meaning 10 coins) — round.correctValue is always
    // authored in major units too, for every currency including JPY
    // (which has zero decimal places). Converting to minor units here
    // would have made a round's correctValue silently wrong for any
    // currency with a different minorUnitDigits than the one the config
    // author was picturing when they wrote it — major units are the one
    // representation that's the same number regardless of currency.
    const isCorrect = Math.abs(parsed - round.correctValue) <= round.toleranceValue;
    setChecked(true);
    onAnswer(isCorrect);
  }

  return (
    <div>
      <p className="rounded-sm bg-fog p-sm text-base text-ink/80">{round.givenContext}</p>

      <label htmlFor={`numeric-${round.id}`} className="mt-sm block text-sm font-medium">
        {usesCurrency && currency ? t("game.yourAnswerLabelCurrency", { code: currency.code }) : t("game.yourAnswerLabel")}
      </label>
      <div className="mt-2xs flex items-center gap-2xs">
        {usesCurrency && currency && currency.symbolPosition === "before" && (
          <span className="text-lg font-bold" aria-hidden="true">
            {currency.symbol}
          </span>
        )}
        <input
          id={`numeric-${round.id}`}
          type="number"
          inputMode="decimal"
          step="0.01"
          disabled={isResolved || checked}
          value={inputValue}
          onChange={(e: { target: { value: string } }) => setInputValue(e.target.value)}
          className="w-32 min-h-touch-min-child rounded-sm border border-ink/20 px-xs py-2xs text-lg tabular-nums focus-visible:border-teal"
        />
      </div>

      {!checked && !isResolved && (
        <button
          type="button"
          disabled={inputValue === ""}
          onClick={submit}
          className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
        >
          {t("lesson.checkMyAnswer")}
        </button>
      )}
    </div>
  );
}
