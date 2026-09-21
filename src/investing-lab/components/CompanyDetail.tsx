"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import { getSeriesForPeriod, getCurrentPrice } from "../engine";
import { PriceChart } from "./PriceChart";
import { sentenceEndAfterName } from "../localized-types";
import type { DisplayCompany } from "../localized-types";
import type { PricePoint, TimePeriod } from "../types";

const RISK_COLOR: Record<DisplayCompany["riskProfile"], string> = {
  lower: "#39813D",
  medium: "#AC6615",
  higher: "#C6433A",
};

interface CompanyDetailProps {
  company: DisplayCompany;
  series: PricePoint[];
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  cashMinorUnits: number;
  currencyCode: string;
  isWatched: boolean;
  onToggleWatch: () => void;
  onBuy: (shares: number) => { error?: string };
}

/** The detail panel for one selected fictional company: its chart,
 * description, risk profile, watchlist toggle, and a simple whole-
 * shares buy form. Everything here is virtual-money-only and clearly
 * labelled as a simulation - see the page-level banner this always
 * renders underneath. */
export function CompanyDetail({ company, series, period, onPeriodChange, cashMinorUnits, currencyCode, isWatched, onToggleWatch, onBuy }: CompanyDetailProps) {
  const t = useTranslations();
  const uiLocale = useLocale();
  const [sharesInput, setSharesInput] = useState("");
  const [feedback, setFeedback] = useState<string>("");

  const currentPrice = getCurrentPrice(series);
  const displaySeries = getSeriesForPeriod(company, series, period);
  const firstPrice = displaySeries[0]?.priceMinorUnits ?? currentPrice;
  const changePercent = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const isUp = changePercent >= 0;

  const requestedShares = Number(sharesInput);
  const maxAffordable = currentPrice > 0 ? Math.floor(cashMinorUnits / currentPrice) : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-xs">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">
            {company.symbol} · {t(`investingLab.sector.${company.sector}`)}
          </p>
          <h3 className="font-display text-lg font-bold">{company.name}</h3>
        </div>
        <button
          type="button"
          onClick={onToggleWatch}
          aria-pressed={isWatched}
          className="min-h-touch-min-child shrink-0 rounded-sm border border-ink/15 px-2xs py-3xs text-xs font-medium text-ink/70 hover:border-teal hover:text-teal"
        >
          {isWatched ? t("investingLab.removeFromWatchlist") : t("investingLab.addToWatchlist")}
        </button>
      </div>

      <p className="mt-2xs text-sm text-ink/70">{company.description}</p>

      <p className="mt-2xs text-xs font-medium" style={{ color: RISK_COLOR[company.riskProfile] }}>
        {t(`investingLab.riskProfile.${company.riskProfile}`)}
      </p>

      <div className="mt-sm flex items-baseline gap-xs">
        <span className="font-display text-2xl font-bold">{formatCurrency(currentPrice, currencyCode, uiLocale)}</span>
        <span className={["text-sm font-medium", isUp ? "text-success" : "text-error"].join(" ")}>
          {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(1)}%
        </span>
      </div>

      <PriceChart points={displaySeries} period={period} onPeriodChange={onPeriodChange} color={isUp ? "#39813D" : "#C6433A"} />

      {company.events.length > 0 && (
        <div className="mt-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("investingLab.companyNewsTitle")}</p>
          <ul className="mt-3xs grid gap-3xs">
            {company.events.map((event) => (
              <li key={event.id} className="flex items-start gap-2xs text-xs text-ink/70">
                <span aria-hidden="true">{event.sentiment === "positive" ? "📈" : "📉"}</span>
                <span>
                  <span className="sr-only">{event.sentiment === "positive" ? t("investingLab.eventPositiveLabel") : t("investingLab.eventNegativeLabel")}: </span>
                  {t(`investingLab.events.${event.id}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-sm border-t border-ink/10 pt-sm">
        <label htmlFor={`buy-shares-${company.id}`} className="text-sm font-medium">
          {t("investingLab.buySharesLabel")}
        </label>
        <div className="mt-2xs flex items-center gap-2xs">
          <input
            id={`buy-shares-${company.id}`}
            type="number"
            min="1"
            step="1"
            value={sharesInput}
            onChange={(e: { target: { value: string } }) => setSharesInput(e.target.value)}
            placeholder="0"
            className="w-20 min-h-touch-min-child rounded-sm border border-ink/20 px-2xs py-3xs"
          />
          <button
            type="button"
            onClick={() => {
              const shares = Math.trunc(requestedShares);
              if (!shares || shares <= 0) return;
              const result = onBuy(shares);
              if (result.error === "insufficientCash") {
                setFeedback(t("investingLab.insufficientCash"));
              } else {
                setFeedback(t("investingLab.boughtSharesConfirmation", { shares, company: company.name, period: sentenceEndAfterName(company.name) }));
                setSharesInput("");
              }
            }}
            className="min-h-touch-min-child rounded-lg bg-teal px-md py-2xs text-sm font-medium text-white shadow-resting hover:bg-teal/90"
          >
            {t("investingLab.buyButton")}
          </button>
        </div>
        <p className="mt-3xs text-xs text-ink/50">{t("investingLab.maxAffordableHint", { shares: maxAffordable })}</p>
        <p className="mt-2xs text-sm" aria-live="polite">
          {feedback}
        </p>
      </div>
    </div>
  );
}
