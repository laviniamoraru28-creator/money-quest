"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_BUSINESS_PROBLEM_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Phase 2 — "Run Your Business" hub. Unlocks once the child has
 * completed Phase 1 (the 18-stage Build flow, including the first
 * pitch) — the company must exist before there's anything to run.
 */
export default function EntrepreneurQuestRunPage() {
  const t = useTranslations();
  const { state, isLoaded } = useEntrepreneurQuest();
  const { isLoaded: progressLoaded } = useLocalProgress();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!state.pitchCompleted) {
    return (
      <div className="min-h-screen bg-fog px-sm py-lg">
        <main className="mx-auto max-w-[700px] text-center">
          <h1 className="font-display text-xl font-bold">{t("entrepreneurQuest.run.lockedTitle")}</h1>
          <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.run.lockedHint")}</p>
          <Link href="/entrepreneur-quest/build" className="mt-sm inline-block">
            <Button variant="quest-primary">{t("entrepreneurQuest.continueBuildingButton")}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const problemsDoneCount = EQ_BUSINESS_PROBLEM_IDS.filter((id) => state.completedProblemIds.includes(id)).length;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.run.hubTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.run.hubIntro")}</p>

        <div className="mt-md grid gap-sm">
          <RunActivityCard
            href="/entrepreneur-quest/run/pricing-experiment"
            emoji="💰"
            title={t("entrepreneurQuest.run.pricingExperimentLink")}
            isDone={state.completedRunActivityIds.includes("pricing-experiment")}
          />
          <RunActivityCard
            href="/entrepreneur-quest/run/supplier-and-stock"
            emoji="📦"
            title={t("entrepreneurQuest.run.supplierAndStockLink")}
            isDone={state.completedRunActivityIds.includes("supplier-and-stock")}
          />
          <RunActivityCard
            href="/entrepreneur-quest/run/cash-flow"
            emoji="🏦"
            title={t("entrepreneurQuest.run.cashFlowLink")}
            isDone={state.completedRunActivityIds.includes("cash-flow")}
          />
          <Link href="/entrepreneur-quest/run/problems">
            <Card variant="activity" className="flex items-center justify-between transition-shadow hover:shadow-floating">
              <span className="flex items-center gap-xs font-medium">
                <span aria-hidden="true" className="text-xl">
                  🧭
                </span>
                {t("entrepreneurQuest.run.problemsLink")}
              </span>
              <span className="text-sm text-ink/60">{t("entrepreneurQuest.run.problemsProgress", { done: problemsDoneCount, total: EQ_BUSINESS_PROBLEM_IDS.length })}</span>
            </Card>
          </Link>
          <Link href="/entrepreneur-quest/ai-lab">
            <Card variant="activity" className="flex items-center justify-between transition-shadow hover:shadow-floating">
              <span className="flex items-center gap-xs font-medium">
                <span aria-hidden="true" className="text-xl">
                  🤖
                </span>
                {t("entrepreneurQuest.aiLab.hubLink")}
              </span>
            </Card>
          </Link>
        </div>

        {problemsDoneCount > 0 && (
          <Link href="/entrepreneur-quest/rescue-grow" className="mt-md block">
            <Button variant="secondary" className="w-full">
              {t("entrepreneurQuest.rescueGrow.hubLink")}
            </Button>
          </Link>
        )}
      </main>
    </div>
  );
}

function RunActivityCard({ href, emoji, title, isDone }: { href: string; emoji: string; title: string; isDone: boolean }) {
  const t = useTranslations();
  return (
    <Link href={href}>
      <Card variant="activity" className="flex items-center justify-between transition-shadow hover:shadow-floating">
        <span className="flex items-center gap-xs font-medium">
          <span aria-hidden="true" className="text-xl">
            {emoji}
          </span>
          {title}
        </span>
        {isDone && <span className="rounded-full bg-gold/20 px-sm py-3xs text-xs font-medium">✓ {t("entrepreneurQuest.challengeCompletedBadge")}</span>}
      </Card>
    </Link>
  );
}
