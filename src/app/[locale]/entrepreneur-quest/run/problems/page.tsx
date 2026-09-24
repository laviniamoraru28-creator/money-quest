"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_BUSINESS_PROBLEM_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";

/** Mirrors challenges/page.tsx's list pattern exactly — the same
 * "pick one, see the detail page" shape, applied to the reusable
 * Business Problems library instead of the standalone Challenges. */
export default function BusinessProblemsListPage() {
  const t = useTranslations();
  const { state, isLoaded } = useEntrepreneurQuest();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/run"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.run.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.run.problemsLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.problemsListIntro")}</p>

        <div className="mt-md grid gap-sm">
          {EQ_BUSINESS_PROBLEM_IDS.map((problemId) => {
            const isDone = state.completedProblemIds.includes(problemId);
            return (
              <Link key={problemId} href={`/entrepreneur-quest/run/problems/${problemId}`}>
                <Card variant="activity" className="flex items-center justify-between transition-shadow hover:shadow-floating">
                  <span className="font-medium">{t(`entrepreneurQuest.problems.${problemId}.title`)}</span>
                  {isDone && <span className="rounded-full bg-gold/20 px-sm py-3xs text-xs font-medium">✓ {t("entrepreneurQuest.challengeCompletedBadge")}</span>}
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
