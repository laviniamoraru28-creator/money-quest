import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import type { WeekLogEntry } from "../types";

interface WeekSummaryCardProps {
  entry: WeekLogEntry;
  currencyCode: string;
  uiLocale: string;
  newBalanceMinorUnits: number;
  onContinue: () => void;
  isLastWeek: boolean;
}

export function WeekSummaryCard({ entry, currencyCode, uiLocale, newBalanceMinorUnits, onContinue, isLastWeek }: WeekSummaryCardProps) {
  const t = useTranslations();
  return (
    <div className="rounded-md border border-success/30 bg-success/5 p-sm">
      <p className="font-display text-lg font-bold">{t("simulator.weekComplete", { week: entry.weekLabel })}</p>

      {entry.eventChoiceLabel && (
        <p className="mt-2xs text-sm text-ink/70">{t("simulator.youChose", { choice: entry.eventChoiceLabel })}</p>
      )}

      {entry.eventConsequence && (
        <p className="mt-2xs text-base text-ink/80">{entry.eventConsequence}</p>
      )}

      <p className="mt-sm text-sm text-ink/70">
        {t("simulator.balanceNow", { amount: formatCurrency(newBalanceMinorUnits, currencyCode, uiLocale) })}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting"
      >
        {isLastWeek ? t("simulator.seeMyFinalReport") : t("simulator.continueToNextWeek")}
      </button>
    </div>
  );
}
