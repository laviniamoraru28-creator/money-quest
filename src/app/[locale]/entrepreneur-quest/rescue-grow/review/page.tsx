"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { computeProfitMinorUnits } from "@/lib/entrepreneur-quest/state";
import { Card } from "@/components/ui/Card";

/**
 * "Business Review" (brief section 23) — the ONE place structured
 * reflection is collected: free text, optional, never scored,
 * revisitable any time. Shows the child's OWN current company numbers
 * (not Rescue's separate dataset) since this reflects on the business
 * they've actually been building and running.
 */
export default function BusinessReviewPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, updateBusinessReview } = useEntrepreneurQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/rescue-grow"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.rescueGrow.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.rescueGrow.reviewLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.rescueGrow.review.intro")}</p>

        <Card variant="data" className="mt-md">
          <p className="text-sm text-ink/60">{t("entrepreneurQuest.dashboard.title")}</p>
          <div className="mt-2xs grid grid-cols-2 gap-2xs">
            <MiniStat label={t("entrepreneurQuest.dashboard.salesLabel")} value={String(state.stats.salesCount)} />
            <MiniStat label={t("entrepreneurQuest.dashboard.revenueLabel")} value={formatCurrency(state.stats.revenueMinorUnits, progressState.currencyCode, uiLocale)} />
            <MiniStat label={t("entrepreneurQuest.dashboard.costsLabel")} value={formatCurrency(state.stats.costsMinorUnits, progressState.currencyCode, uiLocale)} />
            <MiniStat label={t("entrepreneurQuest.dashboard.profitLabel")} value={formatCurrency(computeProfitMinorUnits(state.stats), progressState.currencyCode, uiLocale)} />
            <MiniStat label={t("entrepreneurQuest.dashboard.cashLabel")} value={formatCurrency(state.stats.cashMinorUnits, progressState.currencyCode, uiLocale)} />
            <MiniStat label={t("entrepreneurQuest.dashboard.reputationLabel")} value={t("entrepreneurQuest.dashboard.reputationValue", { stars: state.stats.reputationOutOf5.toFixed(1) })} />
          </div>
        </Card>

        <Card variant="activity" className="mt-sm">
          <ReviewField
            label={t("entrepreneurQuest.rescueGrow.review.whatWorkedLabel")}
            value={state.businessReview.whatWorked}
            onChange={(value) => updateBusinessReview("whatWorked", value)}
            placeholder={t("entrepreneurQuest.rescueGrow.review.whatWorkedPlaceholder")}
          />
          <ReviewField
            label={t("entrepreneurQuest.rescueGrow.review.whatDidntWorkLabel")}
            value={state.businessReview.whatDidntWork}
            onChange={(value) => updateBusinessReview("whatDidntWork", value)}
            placeholder={t("entrepreneurQuest.rescueGrow.review.whatDidntWorkPlaceholder")}
          />
          <ReviewField
            label={t("entrepreneurQuest.rescueGrow.review.whatWouldChangeLabel")}
            value={state.businessReview.whatWouldChange}
            onChange={(value) => updateBusinessReview("whatWouldChange", value)}
            placeholder={t("entrepreneurQuest.rescueGrow.review.whatWouldChangePlaceholder")}
          />
        </Card>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-ink/10 p-xs">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-base font-medium text-ink">{value}</p>
    </div>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-sm first:mt-0">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={300}
        rows={2}
        className="mt-2xs w-full rounded-sm border border-ink/20 px-xs py-2xs"
      />
    </div>
  );
}
