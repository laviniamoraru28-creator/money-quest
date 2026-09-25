"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { LQ_MISSIONS, LQ_BADGE_IDS } from "@/content/leadership-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TeamStatusBar } from "@/components/leadership-quest/TeamStatusBar";

const LQ_BADGE_ID_LIST = Object.values(LQ_BADGE_IDS);

export default function LeadershipQuestHubPage() {
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded } = useLeadershipQuest();

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const hasStarted = state.completedMissionIds.length > 0;
  const missionsDone = state.completedMissionIds.length;
  const totalMissions = LQ_MISSIONS.length;
  const isQuestComplete = state.completedMissionIds.includes("final-challenge");
  const earnedLQBadges = LQ_BADGE_ID_LIST.filter((id) => progressState.earnedBadgeIds.includes(id));

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <div className="flex flex-wrap gap-2xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Link>
          <Link
            href="/play"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
          >
            {t("play.yourWorldMap")}
          </Link>
        </div>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("leadershipQuest.hubTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("leadershipQuest.hubIntro")}</p>

        {hasStarted && (
          <div className="mt-sm">
            <TeamStatusBar team={state.team} />
          </div>
        )}

        {hasStarted ? (
          <Card variant="data" className="mt-sm">
            <div className="h-2 w-full">
              <ProgressBar percent={(missionsDone / totalMissions) * 100} label={t("leadershipQuest.missionProgress", { current: missionsDone, total: totalMissions })} />
            </div>
            <p className="mt-2xs text-xs text-ink/50">{t("leadershipQuest.missionProgress", { current: missionsDone, total: totalMissions })}</p>
          </Card>
        ) : (
          <Card variant="reward" className="mt-md">
            <p className="text-base text-ink/80">{t("leadershipQuest.introStory")}</p>
          </Card>
        )}

        <div className="mt-sm grid gap-2xs">
          {LQ_MISSIONS.map((mission, index) => {
            const isDone = state.completedMissionIds.includes(mission.id);
            const isNext = !isDone && (index === 0 || state.completedMissionIds.includes(LQ_MISSIONS[index - 1]?.id ?? ""));
            const isLocked = !isDone && !isNext;

            if (isLocked) {
              return (
                <div key={mission.id} className="flex items-center gap-xs rounded-md border border-ink/10 bg-white/60 p-sm opacity-60">
                  <span aria-hidden="true" className="text-xl">
                    🔒
                  </span>
                  <span className="text-sm text-ink/60">{t(`leadershipQuest.missions.${mission.id}.title`)}</span>
                </div>
              );
            }

            return (
              <Link
                key={mission.id}
                href={`/leadership-quest/missions/${mission.id}`}
                className="flex items-center gap-xs rounded-md border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal"
              >
                <span aria-hidden="true" className="text-xl">
                  {isDone ? "✅" : "▶️"}
                </span>
                <span className="font-medium text-ink">{t(`leadershipQuest.missions.${mission.id}.title`)}</span>
              </Link>
            );
          })}
        </div>

        <Link href="/leadership-quest/lab" className="mt-sm flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
          <span aria-hidden="true" className="text-2xl">
            🧭
          </span>
          <span className="font-medium">{t("leadershipQuest.labLink")}</span>
        </Link>

        {isQuestComplete ? (
          <Link href="/leadership-quest/profile" className="mt-sm flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white p-sm shadow-resting transition-shadow hover:shadow-floating hover:border-teal">
            <span aria-hidden="true" className="text-2xl">
              🌟
            </span>
            <span className="font-medium">{t("leadershipQuest.profileLink")}</span>
          </Link>
        ) : (
          <div className="mt-sm flex items-center gap-xs rounded-lg border-2 border-ink/10 bg-white/60 p-sm opacity-60">
            <span aria-hidden="true" className="text-2xl">
              🌟
            </span>
            <span className="text-sm text-ink/60">{t("leadershipQuest.profileLinkLockedHint")}</span>
          </div>
        )}

        <Card variant="data" className="mt-md">
          <p className="font-medium">{t("leadershipQuest.badgesEarnedTitle")}</p>
          {earnedLQBadges.length === 0 ? (
            <p className="mt-2xs text-sm text-ink/60">{t("leadershipQuest.noBadgesYetHint")}</p>
          ) : (
            <div className="mt-2xs flex flex-wrap gap-2xs">
              {earnedLQBadges.map((badgeId) => (
                <span key={badgeId} className="rounded-full bg-gold/20 px-sm py-3xs text-sm font-medium">
                  🏅 {t(`leadershipQuest.badges.${badgeId}.name`)}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card variant="data" className="mt-sm">
          <p className="font-medium">{t("leadershipQuest.entrepreneurQuestLinkTitle")}</p>
          <p className="mt-2xs text-sm text-ink/70">{t("leadershipQuest.entrepreneurQuestLinkText")}</p>
          <Link href="/entrepreneur-quest" className="mt-sm inline-block text-teal hover:underline">
            {t("entrepreneurQuest.hubTitle")}
          </Link>
        </Card>

        {hasStarted && (
          <div className="mt-md flex justify-end">
            <ResetLeadershipQuestButton />
          </div>
        )}
      </main>
    </div>
  );
}

function ResetLeadershipQuestButton() {
  const t = useTranslations();
  const { resetQuest } = useLeadershipQuest();
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => {
        if (window.confirm(t("leadershipQuest.resetConfirm"))) {
          resetQuest();
        }
      }}
    >
      {t("leadershipQuest.resetButton")}
    </Button>
  );
}
