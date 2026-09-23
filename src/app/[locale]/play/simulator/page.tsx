"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { getStandardScenarioForAgeBand } from "@/simulator/all-scenarios";
import { SimulatorShell } from "@/simulator/components/SimulatorShell";
import { getLevelLabelKey } from "@/content/level-options";

/**
 * Connects the Money Life Simulator — found during the final pre-launch
 * audit to be fully built (engine, 4 scenarios, 5 UI components,
 * already decoupled from the old Server Action) but reachable from no
 * page at all. `SimulatorShell` already took the same onComplete
 * callback signature GameShell and LessonPlayer use, so this page is a
 * thin wrapper, not new architecture — no account, no database, same
 * localStorage-only model as everything else under /play.
 */
export default function SimulatorPage() {
  const t = useTranslations();
  const { state, isLoaded, completeActivity } = useLocalProgress();

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;

  const scenario = state.ageBand ? getStandardScenarioForAgeBand(state.ageBand, t) : undefined;

  if (!scenario || !state.ageBand) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.chooseLevelFirst")}</p>
          <Link href="/play" className="mt-sm inline-block text-teal hover:underline">
            {t("play.goToWorldMap")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
          {t("play.yourLevelLabel", { level: t(getLevelLabelKey(state.ageBand)) })}
        </p>
        <p className="mb-sm mt-2xs text-xs text-ink/50">{t("play.virtualMoneyExplainer")}</p>
        <SimulatorShell
          scenario={scenario}
          currencyCode={state.currencyCode}
          simulationActivityId={`simulator-${state.ageBand}`}
          backHref="/play"
          onComplete={(activityId, wasCorrect, xpReward, coinRewardMinorUnits) => {
            const result = completeActivity(activityId, wasCorrect, xpReward, coinRewardMinorUnits);
            return { xpAwarded: result.xpAwarded, coinsAwarded: result.coinsAwarded };
          }}
        />
      </main>
    </div>
  );
}
