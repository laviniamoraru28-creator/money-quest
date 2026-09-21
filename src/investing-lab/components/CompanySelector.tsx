"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import { getCurrentPrice } from "../engine";
import type { DisplayCompany } from "../localized-types";
import type { PricePoint } from "../types";

interface CompanySelectorProps {
  companies: DisplayCompany[];
  seriesByCompany: Record<string, PricePoint[]>;
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
  currencyCode: string;
}

/** The full-portfolio-of-fictional-companies browser - one button per
 * company, each a real, labelled control (never color-only) showing
 * its current simulated price. Selecting one drives CompanyDetail's
 * chart/buy panel below. */
export function CompanySelector({ companies, seriesByCompany, selectedCompanyId, onSelect, currencyCode }: CompanySelectorProps) {
  const t = useTranslations();
  const uiLocale = useLocale();

  return (
    <div role="list" aria-label={t("investingLab.companyListLabel")} className="grid grid-cols-2 gap-2xs sm:grid-cols-3">
      {companies.map((company) => {
        const series = seriesByCompany[company.id] ?? [];
        const price = getCurrentPrice(series);
        const isSelected = company.id === selectedCompanyId;
        return (
          <button
            key={company.id}
            type="button"
            role="listitem"
            aria-pressed={isSelected}
            onClick={() => onSelect(company.id)}
            className={[
              "min-h-touch-min-child rounded-md border-2 p-2xs text-left",
              isSelected ? "border-teal bg-teal/5" : "border-ink/15 hover:border-teal/50",
            ].join(" ")}
          >
            <span className="block text-xs uppercase tracking-wide text-ink/50">{company.symbol}</span>
            <span className="block truncate text-sm font-medium">{company.name}</span>
            <span className="block text-sm font-bold text-ink">{formatCurrency(price, currencyCode, uiLocale)}</span>
          </button>
        );
      })}
    </div>
  );
}
