"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_ETHICS_SCENARIO_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Phase 3 — "Rescue & Grow" hub. Unlocks once the child has tried at
 * least one Business Problem in Run — a light gate (not "every Run
 * activity"), so this doesn't feel like a second full course stacked
 * on top of the first.
 */
export default function RescueGrowHubPage() {
  const t = useTranslations();
  const { state, isLoaded } = useEntrepreneurQuest();
  const { isLoaded: progressLoaded } = useLocalProgress();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (state.completedProblemIds.length === 0) {
    return (
      <div className="min-h-screen bg-fog px-sm py-lg">
        <main className="mx-auto max-w-[700px] text-center">
          <h1 className="font-display text-xl font-bold">{t("entrepreneurQuest.rescueGrow.lockedTitle")}</h1>
          <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.rescueGrow.lockedHint")}</p>
          <Link href="/entrepreneur-quest/run/problems" className="mt-sm inline-block">
            <Button variant="quest-primary">{t("entrepreneurQuest.run.problemsLink")}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const pivotDone = state.decisionChoices["business-pivot"] !== undefined;
  const growDone = state.decisionChoices["grow-or-stay-small"] !== undefined;
  const ethicsDone = EQ_ETHICS_SCENARIO_IDS.every((id) => state.decisionChoices[id] !== undefined);
  const rescueDone = state.rescue.outcome !== null;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.backToHub")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.rescueGrow.hubTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.rescueGrow.hubIntro")}</p>

        <div className="mt-md grid gap-sm">
          <ActivityCard href="/entrepreneur-quest/rescue-grow/pivot" emoji="🔄" title={t("entrepreneurQuest.rescueGrow.pivotLink")} isDone={pivotDone} />
          <ActivityCard href="/entrepreneur-quest/rescue-grow/grow" emoji="📈" title={t("entrepreneurQuest.rescueGrow.growLink")} isDone={growDone} />
          <ActivityCard href="/entrepreneur-quest/rescue-grow/ethics" emoji="⚖️" title={t("entrepreneurQuest.rescueGrow.ethicsLink")} isDone={ethicsDone} />
          <ActivityCard href="/entrepreneur-quest/rescue-grow/business-rescue" emoji="🚨" title={t("entrepreneurQuest.rescueGrow.businessRescueLink")} isDone={rescueDone} />
          <ActivityCard href="/entrepreneur-quest/rescue-grow/review" emoji="📝" title={t("entrepreneurQuest.rescueGrow.reviewLink")} isDone={false} />
        </div>
      </main>
    </div>
  );
}

function ActivityCard({ href, emoji, title, isDone }: { href: string; emoji: string; title: string; isDone: boolean }) {
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
