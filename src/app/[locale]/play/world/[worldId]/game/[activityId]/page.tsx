"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { getGameByKey, parseGameActivityId, getNextActivityAcrossWorlds, getPreviousActivityAcrossWorlds, getActivityPosition, getActivityHref } from "@/content/catalog";
import { GameShell } from "@/game-engine/GameShell";
import { getLevelLabelKey } from "@/content/level-options";

export default function GamePage() {
  const params = useParams<{ worldId: string; activityId: string }>();
  const router = useRouter();
  const t = useTranslations();
  const { state, isLoaded, completeActivity } = useLocalProgress();

  const parsed = parseGameActivityId(params.activityId);
  const config = parsed ? getGameByKey(parsed.key, t) : undefined;
  // Mirrors the lesson page's same-topic redirect (see
  // play/world/[worldId]/lesson/[activityId]/page.tsx): a game
  // activity id bakes its age band into the id itself
  // (`game-{ageBand}-{key}`), so switching levels elsewhere in the app
  // (e.g. via /play's "Change level") leaves an already-open game page
  // pointed at the OLD band's id. Without this, the page would keep
  // rendering the old band's rounds under the new band's "Your level"
  // label — only redirect when the new band actually has a variant for
  // this game key, since unlike lessons, not every game has a variant
  // for every band.
  const bandHasVariant = !!config && !!state.ageBand && config.variants.some((v) => v.ageBand === state.ageBand);
  const correctId = parsed && state.ageBand && parsed.ageBand !== state.ageBand && bandHasVariant ? `game-${state.ageBand}-${parsed.key}` : null;

  useEffect(() => {
    if (isLoaded && correctId) {
      router.replace(`/play/world/${params.worldId}/game/${correctId}`);
    }
  }, [isLoaded, correctId, params.worldId, router]);

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;

  if (!config || !parsed || !state.ageBand || correctId || (parsed.ageBand !== state.ageBand && !bandHasVariant)) {
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
      <main id="main-content" tabIndex={-1} data-explorer-answers={state.ageBand === "explorer" ? "" : undefined} className="mx-auto max-w-[700px]">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/70">
          {t("play.yourLevelLabel", { level: t(getLevelLabelKey(state.ageBand)) })}
        </p>
        <GameShell key={params.activityId}
          config={config}
          ageBand={state.ageBand}
          currencyCode={state.currencyCode}
          gameActivityId={params.activityId}
          backHref={`/play/world/${params.worldId}`}
          nextActivityHref={nextActivityHref}
          previousActivityHref={previousActivityHref}
          activityPosition={activityPosition}
          worldId={params.worldId}
          onComplete={(activityId, wasCorrect, xpReward, coinRewardMinorUnits) => {
            const result = completeActivity(activityId, wasCorrect, xpReward, coinRewardMinorUnits, {inlineReward: true});
            return { xpAwarded: result.xpAwarded, coinsAwarded: result.coinsAwarded };
          }}
        />
      </main>
    </div>
  );
}
