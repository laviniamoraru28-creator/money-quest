"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { getLessonStructureById, getNextActivityAcrossWorlds, getPreviousActivityAcrossWorlds, getActivityPosition, getActivityHref } from "@/content/catalog";
import { buildActivityDetailFromLesson } from "@/lib/domain/activity";
import type { LocalizedLessonText } from "@/content/curriculum/localized-types";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export default function LessonPage() {
  const params = useParams<{ worldId: string; activityId: string }>();
  const t = useTranslations();
  const { state, isLoaded, completeActivity } = useLocalProgress();

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;

  const structure = getLessonStructureById(params.activityId);
  if (!structure || !state.ageBand) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.lessonNotAvailable")}</p>
          <Link href={`/play/world/${params.worldId}`} className="mt-sm inline-block text-teal hover:underline">
            {t("play.backToTheWorld")}
          </Link>
        </div>
      </div>
    );
  }

  // t.raw() — next-intl's API for a structured JSON value, not a
  // single interpolated string — since a lesson's shape doesn't
  // decompose into flat per-field t() calls (see activity.ts's own
  // comment on buildActivityDetailFromLesson).
  const localizedText = t.raw(`curriculum.${structure.id}`) as LocalizedLessonText;
  const activity = buildActivityDetailFromLesson(structure, localizedText, state.completedActivityIds, state.currencyCode, state.ageBand);

  const nextEntry = getNextActivityAcrossWorlds(params.worldId, state.ageBand, structure.id, t);
  const nextActivityHref = nextEntry ? getActivityHref(nextEntry.worldId, nextEntry) : null;
  const previousEntry = getPreviousActivityAcrossWorlds(params.worldId, state.ageBand, structure.id, t);
  const previousActivityHref = previousEntry ? getActivityHref(previousEntry.worldId, previousEntry) : null;
  const activityPosition = getActivityPosition(params.worldId, state.ageBand, structure.id, t);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <LessonPlayer
          activity={activity}
          backToWorldHref={`/play/world/${params.worldId}`}
          nextActivityHref={nextActivityHref}
          previousActivityHref={previousActivityHref}
          activityPosition={activityPosition}
          onComplete={(activityId, wasCorrect, xpReward, coinRewardMinorUnits) => {
            const result = completeActivity(activityId, wasCorrect, xpReward, coinRewardMinorUnits);
            return { xpAwarded: result.xpAwarded, coinsAwarded: result.coinsAwarded };
          }}
        />
      </main>
    </div>
  );
}
