"use client";

import { useTranslations } from "next-intl";
import type { AllocationEntry } from "../types";
import type { DisplayCompany } from "../localized-types";

const COMPANY_COLORS: Record<string, string> = {
  "sunbeam-energy": "#E8A33D",
  "pixel-quest-games": "#5B4B8A",
  "green-bite-foods": "#39813D",
  "skyline-transit": "#D13E19",
  "nimbus-tech": "#367D99",
  "wildwood-nature-co": "#0F7A6B",
  cash: "#6E7B8B",
};

interface DiversificationPanelProps {
  allocation: AllocationEntry[];
  companies: DisplayCompany[];
}

/**
 * A simple, descriptive visual of how the portfolio is spread across
 * companies/sectors (plus uninvested cash) - a stacked bar plus a
 * labelled list, since the bar's colour segments alone would fail the
 * "never colour alone" rule. Deliberately makes no judgement about
 * whether a given split is good or bad; the educational point is
 * simply "here is what spread out versus concentrated looks like."
 */
export function DiversificationPanel({ allocation, companies }: DiversificationPanelProps) {
  const t = useTranslations();
  const nonZero = allocation.filter((a) => a.valueMinorUnits > 0);

  if (nonZero.length <= 1) {
    return <p className="text-sm text-ink/60">{t("investingLab.diversificationAllCashHint")}</p>;
  }

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full" role="img" aria-label={t("investingLab.diversificationChartLabel")}>
        {nonZero.map((entry) => (
          <div
            key={entry.companyId}
            style={{ width: `${entry.percentOfPortfolio}%`, backgroundColor: COMPANY_COLORS[entry.companyId] ?? "#6E7B8B" }}
          />
        ))}
      </div>
      <ul className="mt-2xs grid gap-3xs">
        {nonZero.map((entry) => {
          const company = companies.find((c) => c.id === entry.companyId);
          const label = entry.companyId === "cash" ? t("investingLab.cashLabel") : company?.name ?? entry.companyId;
          return (
            <li key={entry.companyId} className="flex items-center gap-2xs text-sm text-ink/70">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COMPANY_COLORS[entry.companyId] ?? "#6E7B8B" }} />
              <span className="flex-1">{label}</span>
              <span className="font-medium text-ink">{entry.percentOfPortfolio.toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2xs text-xs text-ink/50">{t("investingLab.diversificationExplainer")}</p>
    </div>
  );
}
