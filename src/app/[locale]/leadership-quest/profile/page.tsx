"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { computeLeadershipProfile } from "@/lib/leadership-quest/state";
import { Card } from "@/components/ui/Card";

/**
 * The Leadership Profile (brief section 13) — deliberately NOT a score,
 * NOT a ranking. computeLeadershipProfile derives 0-2 archetypes purely
 * from the child's own recorded choices; every archetype is presented
 * with equal, neutral framing (no archetype is styled as "better").
 */
export default function LeadershipProfilePage() {
  const t = useTranslations();
  const { state, isLoaded } = useLeadershipQuest();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const isUnlocked = state.completedMissionIds.includes("final-challenge");
  const archetypeIds = isUnlocked ? computeLeadershipProfile(state.reflectionHistory) : [];

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/leadership-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("leadershipQuest.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("leadershipQuest.profile.title")}</h1>

        {!isUnlocked && (
          <Card variant="data" className="mt-sm">
            <p className="text-base text-ink/70">{t("leadershipQuest.profile.lockedHint")}</p>
          </Card>
        )}

        {isUnlocked && (
          <>
            <p className="mt-2xs text-base text-ink/70">{t("leadershipQuest.profile.intro")}</p>

            {archetypeIds.length === 0 ? (
              <Card variant="data" className="mt-sm">
                <p className="text-base text-ink/70">{t("leadershipQuest.profile.noPatternYetHint")}</p>
              </Card>
            ) : (
              <div className="mt-sm grid gap-sm">
                {archetypeIds.map((archetypeId) => {
                  const statements = t.raw(`leadershipQuest.profile.archetypes.${archetypeId}.statements`) as string[];
                  return (
                    <Card key={archetypeId} variant="reward">
                      <h2 className="font-display text-xl font-bold text-teal">{t(`leadershipQuest.profile.archetypes.${archetypeId}.title`)}</h2>
                      <ul className="mt-sm grid gap-2xs">
                        {statements.map((statement, i) => (
                          <li key={i} className="flex items-start gap-2xs text-base text-ink/80">
                            <span aria-hidden="true">•</span> {statement}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  );
                })}
              </div>
            )}

            <p className="mt-sm text-sm text-ink/50">{t("leadershipQuest.profile.noBetterOrWorseNote")}</p>
          </>
        )}
      </main>
    </div>
  );
}
