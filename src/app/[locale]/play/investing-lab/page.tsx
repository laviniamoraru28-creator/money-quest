"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { formatCurrency } from "@/lib/currency/format";
import { Card } from "@/components/ui/Card";
import { FICTIONAL_COMPANIES } from "@/investing-lab/structures";
import { getLocalizedCompanies } from "@/investing-lab/localized-types";
import { generatePriceSeries, getAllocationBreakdown, getCurrentPrice, getPortfolioValue } from "@/investing-lab/engine";
import { STARTING_CASH_MINOR_UNITS } from "@/investing-lab/structures";
import { useInvestingLab } from "@/investing-lab/use-investing-lab";
import { CompanySelector } from "@/investing-lab/components/CompanySelector";
import { CompanyDetail } from "@/investing-lab/components/CompanyDetail";
import { HoldingsPanel } from "@/investing-lab/components/HoldingsPanel";
import { DiversificationPanel } from "@/investing-lab/components/DiversificationPanel";
import { TransactionHistory } from "@/investing-lab/components/TransactionHistory";
import { TimeMachine } from "@/investing-lab/components/TimeMachine";
import type { TimePeriod } from "@/investing-lab/types";

/**
 * The Investing Lab: a self-contained, entirely virtual-money
 * simulation for teaching risk, diversification, and long-term
 * thinking with fictional companies (see src/investing-lab/structures.ts).
 * Its portfolio lives in its own localStorage key
 * (moneyquest_investing_lab_v1), completely separate from the child's
 * real Wallet - buying and selling fictional shares here never touches
 * XP, coins, or any progress earned from real lessons/games. No real
 * company, market, or financial API is referenced anywhere in this
 * feature.
 */
export default function InvestingLabPage() {
  const t = useTranslations();
  const uiLocale = useLocale();
  const { state: progress, isLoaded: progressLoaded } = useLocalProgress();
  const { state: portfolio, isLoaded: labLoaded, buy, sell, toggleWatch, reset } = useInvestingLab();

  const companies = useMemo(() => getLocalizedCompanies(FICTIONAL_COMPANIES, t), [t]);
  const seriesByCompany = useMemo(() => {
    return Object.fromEntries(FICTIONAL_COMPANIES.map((c) => [c.id, generatePriceSeries(c)]));
  }, []);

  const [selectedCompanyId, setSelectedCompanyId] = useState(FICTIONAL_COMPANIES[0]?.id ?? "");
  const [period, setPeriod] = useState<TimePeriod>("1M");

  const priceLookup = (companyId: string) => getCurrentPrice(seriesByCompany[companyId] ?? []);

  if (!progressLoaded || !labLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const currencyCode = progress.currencyCode;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? companies[0];
  const holdings = Object.values(portfolio.holdings);
  const portfolioValue = getPortfolioValue(portfolio, priceLookup);
  const overallChangeMinorUnits = portfolioValue - STARTING_CASH_MINOR_UNITS;
  const overallChangePercent = STARTING_CASH_MINOR_UNITS > 0 ? (overallChangeMinorUnits / STARTING_CASH_MINOR_UNITS) * 100 : 0;
  const allocation = getAllocationBreakdown(portfolio, priceLookup, FICTIONAL_COMPANIES);
  const watchedCompanies = companies.filter((c) => portfolio.watchlist.includes(c.id));

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/play"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("nav.backToWorldMap")}
        </Link>
        <h1 className="mt-sm font-display text-2xl font-bold">{t("investingLab.pageTitle")}</h1>

        <div className="mt-2xs rounded-md border-2 border-gold bg-gold/10 p-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-gold-text">{t("investingLab.simulationBanner")}</p>
          <p className="mt-3xs text-sm text-ink/70">{t("investingLab.simulationExplainer")}</p>
        </div>

        <p className="mt-sm text-sm text-ink/70">{t("investingLab.guardrailIntro")}</p>

        <Card variant="data" className="mt-md">
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{t("investingLab.cashLabel")}</p>
              <p className="font-display text-xl font-bold text-teal">{formatCurrency(portfolio.cashMinorUnits, currencyCode, uiLocale)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{t("investingLab.portfolioValueLabel")}</p>
              <p className="font-display text-xl font-bold">{formatCurrency(portfolioValue, currencyCode, uiLocale)}</p>
            </div>
          </div>
          <p className={["mt-2xs text-sm font-medium", overallChangeMinorUnits >= 0 ? "text-success" : "text-error"].join(" ")}>
            {overallChangeMinorUnits >= 0 ? "▲" : "▼"}{" "}
            {t("investingLab.overallChangeLabel", {
              amount: formatCurrency(Math.abs(overallChangeMinorUnits), currencyCode, uiLocale),
              percent: Math.abs(overallChangePercent).toFixed(1),
            })}
          </p>
        </Card>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.companiesTitle")}</h2>
          <div className="mt-2xs">
            <CompanySelector
              companies={companies}
              seriesByCompany={seriesByCompany}
              selectedCompanyId={selectedCompanyId}
              onSelect={setSelectedCompanyId}
              currencyCode={currencyCode}
            />
          </div>
          {selectedCompany && (
            <Card variant="data" className="mt-sm">
              <CompanyDetail
                company={selectedCompany}
                series={seriesByCompany[selectedCompany.id] ?? []}
                period={period}
                onPeriodChange={setPeriod}
                cashMinorUnits={portfolio.cashMinorUnits}
                currencyCode={currencyCode}
                isWatched={portfolio.watchlist.includes(selectedCompany.id)}
                onToggleWatch={() => toggleWatch(selectedCompany.id)}
                onBuy={(shares) => buy(selectedCompany.id, shares, priceLookup(selectedCompany.id))}
              />
            </Card>
          )}
        </section>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.holdingsTitle")}</h2>
          <div className="mt-2xs">
            <HoldingsPanel
              holdings={holdings}
              companies={companies}
              priceLookup={priceLookup}
              currencyCode={currencyCode}
              onSell={(companyId, shares) => sell(companyId, shares, priceLookup(companyId))}
            />
          </div>
        </section>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.diversificationTitle")}</h2>
          <div className="mt-2xs">
            <DiversificationPanel allocation={allocation} companies={companies} />
          </div>
        </section>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.watchlistTitle")}</h2>
          <div className="mt-2xs">
            {watchedCompanies.length === 0 ? (
              <p className="text-sm text-ink/60">{t("investingLab.watchlistEmptyHint")}</p>
            ) : (
              <ul className="grid gap-3xs">
                {watchedCompanies.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm text-ink/70">
                    <button type="button" onClick={() => setSelectedCompanyId(c.id)} className="text-teal hover:underline">
                      {c.name}
                    </button>
                    <span>{formatCurrency(priceLookup(c.id), currencyCode, uiLocale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.transactionHistoryTitle")}</h2>
          <div className="mt-2xs">
            <TransactionHistory transactions={portfolio.transactions} companies={companies} currencyCode={currencyCode} />
          </div>
        </section>

        <section className="mt-md">
          <h2 className="font-display text-lg font-bold">{t("investingLab.timeMachineTitle")}</h2>
          <p className="mt-3xs text-sm text-ink/70">{t("investingLab.timeMachineIntro")}</p>
          <div className="mt-2xs">
            <TimeMachine companies={companies} seriesByCompany={seriesByCompany} currencyCode={currencyCode} />
          </div>
        </section>

        <ResetInvestingLabButton onReset={reset} />
      </main>
    </div>
  );
}

function ResetInvestingLabButton({ onReset }: { onReset: () => void }) {
  const t = useTranslations();
  return (
    <div className="mt-lg border-t border-ink/10 pt-sm">
      <button
        type="button"
        onClick={() => {
          if (window.confirm(t("investingLab.resetConfirm"))) onReset();
        }}
        className="text-xs text-ink/40 hover:text-error"
      >
        {t("investingLab.resetButton")}
      </button>
    </div>
  );
}
