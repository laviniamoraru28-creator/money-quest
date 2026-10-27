"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRealLifeQuests } from "@/lib/real-life-quests/use-real-life-quests";
import { RLQ_CATEGORIES, RLQ_MISSIONS, getRLQMissionsByCategory, type RLQCategory } from "@/content/real-life-quests/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MissionIcon, CategoryIcon, CompletedBadge } from "@/components/real-life-quests/MissionIcon";

/**
 * The Real Life Quests hub — the landing page for all 12 missions,
 * grouped into the 3 categories the brief asks for. Follows the exact
 * same hub shape Entrepreneur Quest and Leadership Quest already use
 * (intro story, a progress summary, a grouped list of entry points,
 * a reset button) rather than inventing a new page layout.
 */
export default function RealLifeQuestsHubPage() {
  const t = useTranslations();
  const { state, isLoaded, getMissionProgress } = useRealLifeQuests();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;
  }

  const allMissionIds = RLQ_MISSIONS.map((m) => m.id);
  const completedCount = allMissionIds.filter((id) => getMissionProgress(id).status === "completed").length;
  const percent = (completedCount / allMissionIds.length) * 100;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-between gap-xs">
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal-text transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Link>
        </div>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("realLifeQuests.hubTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("realLifeQuests.hubTagline")}</p>
        <p className="mt-sm text-base text-ink/80">{t("realLifeQuests.hubIntro")}</p>

        <Card variant="data" className="mt-md">
          <div className="flex items-center justify-between gap-sm">
            <p className="text-sm font-medium text-ink/70">
              {t("realLifeQuests.missionsCompletedCount", { completed: completedCount, total: allMissionIds.length })}
            </p>
          </div>
          <div className="mt-2xs h-2 w-full">
            <ProgressBar percent={percent} label={t("realLifeQuests.missionsCompletedCount", { completed: completedCount, total: allMissionIds.length })} />
          </div>
        </Card>

        {RLQ_CATEGORIES.map((category: RLQCategory) => {
          const missions = getRLQMissionsByCategory(category);
          return (
            <section key={category} className="mt-lg">
              <div className="flex items-center gap-2xs">
                <CategoryIcon category={category} className="h-7 w-7 text-teal-text" />
                <h2 className="font-display text-xl font-bold">{t(`realLifeQuests.categories.${category}.title`)}</h2>
              </div>
              <p className="mt-2xs text-sm text-ink/70">{t(`realLifeQuests.categories.${category}.description`)}</p>
              <div className="mt-sm grid gap-sm sm:grid-cols-2">
                {missions.map((mission) => {
                  const progress = getMissionProgress(mission.id);
                  return (
                    <Link
                      key={mission.id}
                      href={`/real-life-quests/missions/${mission.id}`}
                      className="relative block rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow duration-quick hover:shadow-floating hover:border-teal"
                    >
                      {progress.status === "completed" && (
                        <CompletedBadge className="absolute right-2xs top-2xs h-6 w-6 text-teal-text" />
                      )}
                      <div className="flex items-start gap-xs">
                        <MissionIcon missionId={mission.id} className="mt-3xs h-10 w-10 shrink-0 text-teal-text" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-ink/70">
                            {t(`realLifeQuests.supervision.${mission.supervision}`)}
                          </p>
                          <h3 className="mt-2xs font-display text-md font-bold leading-tight">
                            {t(`realLifeQuests.missions.${mission.id}.title`)}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-2xs text-sm text-ink/70">{t(`realLifeQuests.missions.${mission.id}.intro`)}</p>
                      <p className="mt-sm text-xs font-semibold text-teal-text">{t(`realLifeQuests.status.${progress.status}`)}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <Card variant="data" className="mt-lg">
          <h2 className="font-display text-lg font-bold">{t("realLifeQuests.parentIntroTitle")}</h2>
          <p className="mt-2xs text-sm text-ink/70">{t("realLifeQuests.parentIntro")}</p>
        </Card>

        <div className="mt-md flex justify-end">
          <ResetRLQProgressButton />
        </div>
      </main>
    </div>
  );
}

function ResetRLQProgressButton() {
  const t = useTranslations();
  const { resetProgress } = useRealLifeQuests();
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => {
        if (window.confirm(t("realLifeQuests.resetConfirm"))) {
          resetProgress();
        }
      }}
    >
      {t("realLifeQuests.resetButton")}
    </Button>
  );
}
