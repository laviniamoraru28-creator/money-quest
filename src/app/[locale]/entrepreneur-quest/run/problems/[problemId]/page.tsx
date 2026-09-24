"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { formatCurrency } from "@/lib/currency/format";
import { EQ_BUSINESS_PROBLEM_IDS } from "@/content/entrepreneur-quest/structures";
import { computeProfitMinorUnits } from "@/lib/entrepreneur-quest/state";
import { Card } from "@/components/ui/Card";
import { BusinessProblemMechanic } from "@/components/entrepreneur-quest/BusinessProblemMechanic";

export default function BusinessProblemDetailPage() {
  const params = useParams<{ problemId: string }>();
  const router = useRouter();
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision, completeProblem, completeRunActivity } = useEntrepreneurQuest();

  const problemId = params.problemId;
  const isValidProblem = EQ_BUSINESS_PROBLEM_IDS.includes(problemId);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!isValidProblem) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/entrepreneur-quest/run/problems" className="mt-sm inline-block text-teal hover:underline">
            {t("entrepreneurQuest.run.problemsLink")}
          </Link>
        </div>
      </div>
    );
  }

  const statLines = [
    { label: t("entrepreneurQuest.dashboard.salesLabel"), value: String(state.stats.salesCount) },
    { label: t("entrepreneurQuest.dashboard.revenueLabel"), value: formatCurrency(state.stats.revenueMinorUnits, progressState.currencyCode, uiLocale) },
    { label: t("entrepreneurQuest.dashboard.costsLabel"), value: formatCurrency(state.stats.costsMinorUnits, progressState.currencyCode, uiLocale) },
    { label: t("entrepreneurQuest.dashboard.profitLabel"), value: formatCurrency(computeProfitMinorUnits(state.stats), progressState.currencyCode, uiLocale) },
  ];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/run/problems"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.run.problemsLink")}
        </Link>

        <Card variant="activity" className="mt-sm">
          <h1 className="font-display text-xl font-bold">{t(`entrepreneurQuest.problems.${problemId}.title`)}</h1>
          <BusinessProblemMechanic
            problemId={problemId}
            statLines={statLines}
            currencyCode={progressState.currencyCode}
            uiLocale={uiLocale}
            onRespond={(responseKey) => recordDecision(problemId, responseKey)}
            onFinish={() => {
              completeProblem(problemId);
              completeRunActivity("business-problems");
              router.push("/entrepreneur-quest/run/problems");
            }}
          />
        </Card>
      </main>
    </div>
  );
}
