"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import { getHoldingCurrentValue, getHoldingGainLoss } from "../engine";
import { sentenceEndAfterName } from "../localized-types";
import type { DisplayCompany } from "../localized-types";
import type { Holding } from "../types";

interface HoldingsPanelProps {
  holdings: Holding[];
  companies: DisplayCompany[];
  priceLookup: (companyId: string) => number;
  currencyCode: string;
  onSell: (companyId: string, shares: number) => { error?: string };
}

/** Shows every company/shares/average-price/current-price/value/gain-
 * loss row the brief asks for. Gain/loss is always shown as text and a
 * ▲/▼ symbol together, never color alone (money-quest's accessibility
 * rule, applied here the same way the rest of the app already does for
 * XP/score changes). */
export function HoldingsPanel({ holdings, companies, priceLookup, currencyCode, onSell }: HoldingsPanelProps) {
  const t = useTranslations();
  const uiLocale = useLocale();

  if (holdings.length === 0) {
    return <p className="text-sm text-ink/60">{t("investingLab.noHoldingsYet")}</p>;
  }

  return (
    <div className="grid gap-sm">
      {holdings.map((holding) => {
        const company = companies.find((c) => c.id === holding.companyId);
        if (!company) return null;
        const currentPrice = priceLookup(holding.companyId);
        const averagePrice = Math.round(holding.totalCostMinorUnits / holding.shares);
        const currentValue = getHoldingCurrentValue(holding, currentPrice);
        const gainLoss = getHoldingGainLoss(holding, currentPrice);
        const isUp = gainLoss.absoluteMinorUnits >= 0;

        return (
          <HoldingRow
            key={holding.companyId}
            companyName={company.name}
            symbol={company.symbol}
            shares={holding.shares}
            averagePrice={averagePrice}
            currentPrice={currentPrice}
            currentValue={currentValue}
            gainLossAbsolute={gainLoss.absoluteMinorUnits}
            gainLossPercent={gainLoss.percent}
            isUp={isUp}
            currencyCode={currencyCode}
            uiLocale={uiLocale}
            onSell={(shares) => onSell(holding.companyId, shares)}
          />
        );
      })}
    </div>
  );
}

function HoldingRow({
  companyName,
  symbol,
  shares,
  averagePrice,
  currentPrice,
  currentValue,
  gainLossAbsolute,
  gainLossPercent,
  isUp,
  currencyCode,
  uiLocale,
  onSell,
}: {
  companyName: string;
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  gainLossAbsolute: number;
  gainLossPercent: number;
  isUp: boolean;
  currencyCode: string;
  uiLocale: string;
  onSell: (shares: number) => { error?: string };
}) {
  const t = useTranslations();
  const [sellInput, setSellInput] = useState("");
  const [feedback, setFeedback] = useState("");

  return (
    <div className="rounded-md border border-ink/10 bg-cream p-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">{symbol}</p>
          <p className="font-medium">{companyName}</p>
        </div>
        <span className={["text-sm font-medium", isUp ? "text-success" : "text-error"].join(" ")}>
          {isUp ? "▲" : "▼"} {formatCurrency(Math.abs(gainLossAbsolute), currencyCode, uiLocale)} ({Math.abs(gainLossPercent).toFixed(1)}%)
        </span>
      </div>
      <dl className="mt-2xs grid grid-cols-2 gap-x-sm gap-y-3xs text-sm text-ink/70 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink/50">{t("investingLab.sharesLabel")}</dt>
          <dd>{shares}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50">{t("investingLab.averagePriceLabel")}</dt>
          <dd>{formatCurrency(averagePrice, currencyCode, uiLocale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50">{t("investingLab.currentPriceLabel")}</dt>
          <dd>{formatCurrency(currentPrice, currencyCode, uiLocale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink/50">{t("investingLab.currentValueLabel")}</dt>
          <dd className="font-medium text-ink">{formatCurrency(currentValue, currencyCode, uiLocale)}</dd>
        </div>
      </dl>
      <div className="mt-2xs flex items-center gap-2xs">
        <label htmlFor={`sell-${symbol}`} className="sr-only">
          {t("investingLab.sellSharesLabel", { company: companyName })}
        </label>
        <input
          id={`sell-${symbol}`}
          type="number"
          min="1"
          max={shares}
          step="1"
          value={sellInput}
          onChange={(e: { target: { value: string } }) => setSellInput(e.target.value)}
          placeholder="0"
          className="w-20 min-h-touch-min-child rounded-sm border border-ink/20 px-2xs py-3xs"
        />
        <button
          type="button"
          onClick={() => {
            const requested = Math.trunc(Number(sellInput));
            if (!requested || requested <= 0) return;
            const result = onSell(requested);
            if (result.error === "insufficientShares") {
              setFeedback(t("investingLab.insufficientShares"));
            } else {
              setFeedback(t("investingLab.soldSharesConfirmation", { shares: requested, company: companyName, period: sentenceEndAfterName(companyName) }));
              setSellInput("");
            }
          }}
          className="min-h-touch-min-child rounded-sm border-2 border-ink/20 px-sm py-2xs text-sm font-medium text-ink/70 hover:border-error hover:text-error"
        >
          {t("investingLab.sellButton")}
        </button>
      </div>
      <p className="mt-3xs text-sm" aria-live="polite">
        {feedback}
      </p>
    </div>
  );
}
