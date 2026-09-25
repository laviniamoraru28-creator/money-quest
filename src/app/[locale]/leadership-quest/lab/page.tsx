"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { LQ_LAB_SCENARIO_IDS, LQ_EFFECTS, LQ_BADGE_IDS, type LQArchetypeId } from "@/content/leadership-quest/structures";
import { LeadershipLabCard } from "@/components/leadership-quest/LeadershipLabCard";

/**
 * Leadership Lab (brief section 11) — short standalone practice, always
 * available, never gated behind mission progress. Each scenario reuses
 * MissionMechanic via LeadershipLabCard; effects here never touch the
 * Team State (see LQ_EFFECTS's Lab entries), only the shared badge
 * mechanism when a listening/problem-solving choice is picked.
 */
export default function LeadershipLabPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded, awardBadge } = useLocalProgress();
  const { state, isLoaded, recordChoice, completeLabScenario } = useLeadershipQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  function handleAnswer(scenarioId: string, choiceKey: string) {
    recordChoice(scenarioId, choiceKey);
    completeLabScenario(scenarioId);
    const tag = LQ_EFFECTS[scenarioId]?.[choiceKey]?.archetypeTag as LQArchetypeId | undefined;
    if (tag === "the-listener") awardBadge(LQ_BADGE_IDS.goodListener);
    if (tag === "the-problem-solver") awardBadge(LQ_BADGE_IDS.problemSolver);
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/leadership-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("leadershipQuest.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("leadershipQuest.labTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("leadershipQuest.labIntro")}</p>

        <div className="mt-sm grid gap-2xs">
          {LQ_LAB_SCENARIO_IDS.map((scenarioId) => (
            <LeadershipLabCard
              key={scenarioId}
              scenarioId={scenarioId}
              choiceKeys={Object.keys(LQ_EFFECTS[scenarioId] ?? {})}
              currencyCode={progressState.currencyCode}
              uiLocale={uiLocale}
              isCompleted={state.completedLabScenarioIds.includes(scenarioId)}
              onAnswer={(choiceKey) => handleAnswer(scenarioId, choiceKey)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
