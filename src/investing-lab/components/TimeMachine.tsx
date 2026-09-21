"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency, toMinorUnits } from "@/lib/currency/format";
import { computeTimeMachineResult, TODAY_INDEX } from "../engine";
import type { DisplayCompany } from "../localized-types";
import type { PricePoint } from "../types";

const PRESET_DAYS_AGO = [365, 1095, TODAY_INDEX];

interface TimeMachineProps {
  companies: DisplayCompany[];
  seriesByCompany: Record<string, PricePoint[]>;
  currencyCode: string;
}

/**
 * Teaches "past performance does not guarantee future results" the
 * concrete way: pick a fictional company and a simulated amount, look
 * back at a fixed point in its (already-generated, deterministic)
 * price history, and see what that would be worth today. Every number
 * here comes from the same fixed price series the rest of the Lab
 * uses - nothing new is randomised, and nothing here projects forward.
 */
export function TimeMachine({ companies, seriesByCompany, currencyCode }: TimeMachineProps) {
  const t = useTranslations();
  const uiLocale = useLocale();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [daysAgo, setDaysAgo] = useState(365);
  const [amountInput, setAmountInput] = useState("100");

  const series = seriesByCompany[companyId] ?? [];
  const amountMajor = Number(amountInput);
  const amountMinorUnits = !Number.isNaN(amountMajor) && amountMajor > 0 ? toMinorUnits(amountMajor, currencyCode) : 0;
  const result = series.length > 0 && amountMinorUnits > 0 ? computeTimeMachineResult(series, amountMinorUnits, daysAgo) : null;
  const isUp = result ? result.currentValueMinorUnits >= result.pastValueMinorUnits : true;

  return (
    <div>
      <div className="grid gap-2xs sm:grid-cols-2">
        <div>
          <label htmlFor="time-machine-company" className="text-sm font-medium">
            {t("investingLab.timeMachineCompanyLabel")}
          </label>
          <select
            id="time-machine-company"
            value={companyId}
            onChange={(e: { target: { value: string } }) => setCompanyId(e.target.value)}
            className="mt-2xs min-h-touch-min-child w-full rounded-sm border border-ink/20 px-2xs py-3xs"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="time-machine-amount" className="text-sm font-medium">
            {t("investingLab.timeMachineAmountLabel")}
          </label>
          <input
            id="time-machine-amount"
            type="number"
            min="1"
            step="1"
            value={amountInput}
            onChange={(e: { target: { value: string } }) => setAmountInput(e.target.value)}
            className="mt-2xs min-h-touch-min-child w-full rounded-sm border border-ink/20 px-2xs py-3xs"
          />
        </div>
      </div>

      <fieldset className="mt-2xs">
        <legend className="text-sm font-medium">{t("investingLab.timeMachineDaysAgoLabel")}</legend>
        <div className="mt-2xs flex flex-wrap gap-2xs">
          {PRESET_DAYS_AGO.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={daysAgo === preset}
              onClick={() => setDaysAgo(preset)}
              className={[
                "min-h-touch-min-child rounded-sm border px-sm py-2xs text-sm font-medium",
                daysAgo === preset ? "border-teal bg-teal/10 text-teal" : "border-ink/15 text-ink/70 hover:border-teal/50",
              ].join(" ")}
            >
              {t("investingLab.timeMachineYearsAgo", { years: Math.round(preset / 365) })}
            </button>
          ))}
        </div>
      </fieldset>

      {result && (
        <div className="mt-sm rounded-md border border-ink/10 bg-cream p-sm" aria-live="polite">
          <p className="text-sm text-ink/70">
            {t("investingLab.timeMachineResultIntro", { shares: result.shares, amount: formatCurrency(result.pastValueMinorUnits, currencyCode, uiLocale) })}
          </p>
          <p className="mt-2xs flex items-baseline gap-xs">
            <span className="font-display text-xl font-bold">{formatCurrency(result.currentValueMinorUnits, currencyCode, uiLocale)}</span>
            <span className={["text-sm font-medium", isUp ? "text-success" : "text-error"].join(" ")}>
              {isUp ? "▲" : "▼"} {Math.abs(result.percentChange).toFixed(1)}%
            </span>
          </p>
          {result.shares === 0 && <p className="mt-2xs text-xs text-ink/50">{t("investingLab.timeMachineTooSmallHint")}</p>}
        </div>
      )}

      <p className="mt-2xs text-xs text-ink/50">{t("investingLab.timeMachineDisclaimer")}</p>
    </div>
  );
}
