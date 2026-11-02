"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { getGameByKey, parseGameActivityId, getNextActivityAcrossWorlds, getPreviousActivityAcrossWorlds, getActivityPosition, getActivityHref } from "@/content/catalog";
import { GameShell } from "@/game-engine/GameShell";
import { getLevelLabelKey } from "@/content/level-options";

export default function GamePage() {
  const params = useParams<{ worldId: string; activityId: string }>();
  const t = useTranslations();
  const { state, isLoaded, completeActivity } = useLocalProgress();

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;

  const parsed = parseGameActivityId(params.activityId);
  const config = parsed ? getGameByKey(parsed.key, t) : undefined;

  if (!config || !parsed || !state.ageBand) {
    return (
      <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.gameNotAvailable")}</p>
          <Link href={`/play/world/${params.worldId}`} className="mt-sm inline-block text-teal-text hover:underline">
            {t("play.backToTheWorld")}
          </Link>
        </div>
      </main>
    );
  }

  const nextEntry = getNextActivityAcrossWorlds(params.worldId, state.ageBand, params.activityId, t);
  const nextActivityHref = nextEntry ? getActivityHref(nextEntry.worldId, nextEntry) : null;
  const previousEntry = getPreviousActivityAcrossWorlds(params.worldId, state.ageBand, params.activityId, t);
  const previousActivityHref = previousEntry ? getActivityHref(previousEntry.worldId, previousEntry) : null;
  const activityPosition = getActivityPosition(params.worldId, state.ageBand, params.activityId, t);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[700px]">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/70">
          {t("play.yourLevelLabel", { level: t(getLevelLabelKey(state.ageBand)) })}
        </p>
        <GameShell key={params.activityId}
          config={config}
          ageBand={parsed.ageBand}
          currencyCode={state.currencyCode}
          gameActivityId={params.activityId}
          backHref={`/play/world/${params.worldId}`}
          nextActivityHref={nextActivityHref}
          previousActivityHref={previousActivityHref}
          activityPosition={activityPosition}
          worldId={params.worldId}
          onComplete={(activityId, wasCorrect, xpReward, coinRewardMinorUnits) => {
            const result = completeActivity(activityId, wasCorrect, xpReward, coinRewardMinorUnits);
            return { xpAwarded: result.xpAwarded, coinsAwarded: result.coinsAwarded };
          }}
        />
      </main>
    </div>
  );
}
