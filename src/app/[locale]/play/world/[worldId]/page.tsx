"use client";

import { GuidePanel } from "@/components/GuidePanel";
import { MoneyExamples } from "@/components/MoneyExamples";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { getWorldById } from "@/content/worlds";
import { getWorldCatalog } from "@/content/catalog";
import { LevelBadgeStar } from "@/components/ui/LevelBadgeStar";
import { Button } from "@/components/ui/Button";
import type { AgeBand } from "@/types/database.types";

export default function WorldPage() {
  const params = useParams<{ worldId: string }>();
  const router = useRouter();
  const t = useTranslations();
  const { state, isLoaded } = useLocalProgress();

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;
  if (!state.ageBand) {
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

  const world = getWorldById(params.worldId);
  const catalog = getWorldCatalog(params.worldId, state.ageBand as AgeBand, t);

  if (!world) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.worldNotFound")}</p>
          <Link href="/play" className="mt-sm inline-block text-teal hover:underline">
            {t("nav.backToWorldMap")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[700px]">
        <div className="flex flex-wrap gap-xs">
          <Button variant="secondary" onClick={() => router.push("/")}>
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/play")}>
            <span aria-hidden="true">←</span> {t("nav.backToWorldMap")}
          </Button>
        </div>
        <div className="mt-sm flex items-center gap-xs">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/70">
              {t("play.levelLabel", { number: world.orderIndex })}
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight">{t(`levels.${world.id}`)}</h1>
            <p className="text-sm text-ink/70">{world.name}</p>
          </div>
          {catalog.length > 0 && catalog.every((entry) => state.completedActivityIds.includes(entry.id)) && (
            <LevelBadgeStar size={36} className="ml-auto shrink-0" />
          )}
        </div>
        <img src={`/images/money-quest/worlds/${world.id}.webp`} alt="" width={768} height={768} className="mt-5 max-h-96 w-full rounded-2xl bg-cream object-contain" />
        <GuidePanel message={`Welcome to ${world.name}. ${world.description} Choose a lesson or a game below. You can take your time.`}/>
        {world.id === "coin-cove" && <MoneyExamples/>}
        <p className="mt-2xs text-base text-ink/70">{world.description}</p>

        <div className="mt-md grid gap-sm">
          {catalog.map((entry) => {
            const isDone = state.completedActivityIds.includes(entry.id);
            const href = entry.activityType === "lesson" ? `/play/world/${world.id}/lesson/${entry.id}` : `/play/world/${world.id}/game/${entry.id}`;
            return (
              <Link
                key={entry.id}
                href={href}
                className="flex items-center justify-between rounded-md border border-ink/10 bg-white p-sm shadow-resting hover:border-teal"
              >
                <span>
                  <span className="text-xs uppercase tracking-wide text-ink/70">{entry.activityType === "lesson" ? t("play.typeLesson") : t("play.typeGame")}</span>
                  <span className="block font-medium">{entry.title}</span>
                </span>
                {isDone && (
                  <span className="text-success" aria-label={t("play.completedLabel")}>
                    ✓
                  </span>
                )}
              </Link>
            );
          })}
          {catalog.length === 0 && <p className="text-base text-ink/70">{t("play.noActivitiesYet")}</p>}
        </div>

        <div className="mt-lg rounded-md border border-ink/10 bg-white p-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/70">{t("lesson.forParentsLabel")}</p>
          <p className="mt-2xs text-xs text-ink/70">{t("lesson.parentChallengeLabel")}</p>
          <p className="mt-3xs text-sm text-ink/70">{t(`parentChallenges.${world.id}`)}</p>
        </div>
      </main>
    </div>
  );
}
