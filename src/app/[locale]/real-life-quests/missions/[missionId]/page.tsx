"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useRealLifeQuests } from "@/lib/real-life-quests/use-real-life-quests";
import {
  getRLQMissionById,
  RLQ_VARIANTS,
  RLQ_REFLECTION_CHOICES,
  RLQ_LINKED_ACTIVITY_HREFS,
  type RLQVariant,
  type RLQReflectionChoice,
} from "@/content/real-life-quests/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { VariantIcon, SelectedCheckIcon } from "@/components/real-life-quests/VariantIcon";
import { MissionIcon, CompletedBadge } from "@/components/real-life-quests/MissionIcon";

/**
 * One generic page renders every mission, driven entirely by
 * RLQ_MISSIONS + the `realLifeQuests.missions.<id>.*` translation keys —
 * the same "structural id in, localized content out" pattern every other
 * mission/lesson/quest page in this app already uses, rather than 12
 * hand-written, near-duplicate page files (brief section 4: "structured
 * and reusable content rather than hardcoded, duplicated page markup").
 */
export default function RealLifeQuestMissionPage() {
  const params = useParams<{ missionId: string }>();
  const t = useTranslations();
  const uiLocale = useLocale();
  const { isLoaded: progressLoaded, completeActivity } = useLocalProgress();
  const { isLoaded, getMissionProgress, startMission, setMissionVariant, completeMission, setReflection } = useRealLifeQuests();
  const [reflectionText, setReflectionText] = useState("");
  const [justEarnedXp, setJustEarnedXp] = useState<number | null>(null);

  const missionId = params.missionId;
  const mission = getRLQMissionById(missionId);

  // Keep the local textarea value in sync with the saved reflection
  // whenever the mission itself changes (a client-side nav between two
  // mission pages re-renders this same component rather than remounting
  // it) — without this, a stale draft from the previous mission could
  // briefly show on the new one.
  useEffect(() => {
    setReflectionText(getMissionProgress(missionId).reflectionText);
    setJustEarnedXp(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!mission) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/real-life-quests" className="mt-sm inline-block text-teal hover:underline">
            {t("realLifeQuests.backToHub")}
          </Link>
        </div>
      </div>
    );
  }

  const progress = getMissionProgress(missionId);
  const base = `realLifeQuests.missions.${missionId}`;

  function handleMarkCompleted() {
    const result = completeMission(missionId);
    if (result.wasFirstCompletion) {
      completeActivity(`rlq-${missionId}`, true, mission!.xpReward, 0);
      setJustEarnedXp(mission!.xpReward);
    }
  }

  function handleReflectionChoice(choice: RLQReflectionChoice) {
    const next = progress.reflectionChoice === choice ? null : choice;
    setReflection(missionId, next, reflectionText);
  }

  function handleReflectionTextBlur() {
    setReflection(missionId, progress.reflectionChoice, reflectionText);
  }

  const linkedHref = mission.linkedActivity ? RLQ_LINKED_ACTIVITY_HREFS[mission.linkedActivity] : null;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/real-life-quests"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("realLifeQuests.backToHub")}
        </Link>

        <div className="mt-sm flex items-start gap-sm">
          <MissionIcon missionId={missionId} className="h-16 w-16 shrink-0 text-teal" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
              {t(`realLifeQuests.supervision.${mission.supervision}`)}
            </p>
            <h1 className="mt-2xs font-display text-2xl font-bold">{t(`${base}.title`)}</h1>
          </div>
        </div>
        <p className="mt-2xs text-base text-ink/80">{t(`${base}.intro`)}</p>
        <div className="mt-xs">
          <ReadAloudButton
            text={[
              t(`${base}.intro`),
              ...(t.raw(`${base}.objectives`) as string[]),
              ...(t.raw(`${base}.steps`) as string[]),
            ].join(". ")}
            uiLocale={uiLocale}
          />
        </div>
        <p className="mt-sm flex items-center gap-2xs text-sm font-semibold text-teal">
          {progress.status === "completed" && <CompletedBadge className="h-5 w-5" />}
          {t(`realLifeQuests.status.${progress.status}`)}
        </p>

        <Card variant="activity" className="mt-sm">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.objectivesTitle")}</h2>
          <ul className="mt-2xs list-disc space-y-1 pl-5 text-sm text-ink/80">
            {(t.raw(`${base}.objectives`) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card variant="activity" className="mt-sm">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.materialsTitle")}</h2>
          <ul className="mt-2xs list-disc space-y-1 pl-5 text-sm text-ink/80">
            {(t.raw(`${base}.materials`) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="mt-sm text-sm text-ink/60">
            <span className="font-medium">{t("realLifeQuests.durationLabel")}:</span> {t(`${base}.durationEstimate`)}
          </p>
        </Card>

        <Card variant="activity" className="mt-sm">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.stepsTitle")}</h2>
          <ol className="mt-2xs space-y-2">
            {(t.raw(`${base}.steps`) as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-xs">
                <span
                  aria-hidden="true"
                  className="mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal text-sm font-bold text-white"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm text-ink/80">{item}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card variant="activity" className="mt-sm">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.variantsTitle")}</h2>
          <div className="mt-2xs flex flex-wrap gap-2xs">
            {RLQ_VARIANTS.map((variant: RLQVariant) => (
              <button
                key={variant}
                type="button"
                onClick={() => setMissionVariant(missionId, variant)}
                aria-pressed={progress.variant === variant}
                className={[
                  "inline-flex min-h-touch-min items-center gap-2xs rounded-sm border-[1.5px] px-sm py-2xs text-sm font-medium transition-colors duration-quick",
                  progress.variant === variant
                    ? "border-teal bg-teal text-white"
                    : "border-ink/20 bg-white text-ink/80 hover:border-teal",
                ].join(" ")}
              >
                <VariantIcon variant={variant} />
                {t(`realLifeQuests.variantLabels.${variant}`)}
                {progress.variant === variant && <SelectedCheckIcon />}
              </button>
            ))}
          </div>
          {progress.variant !== "standard" && (
            <p className="mt-sm text-sm text-ink/80">{t(`${base}.${progress.variant}Version`)}</p>
          )}
        </Card>

        <Card variant="activity" className="mt-sm">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.nonverbalTitle")}</h2>
          <p className="mt-2xs text-sm text-ink/80">{t(`${base}.nonverbalAdaptation`)}</p>
        </Card>

        <div className="mt-md flex flex-wrap gap-xs">
          {progress.status === "not-started" && (
            <Button type="button" variant="secondary" size="large" onClick={() => startMission(missionId)}>
              {t("realLifeQuests.markStartedButton")}
            </Button>
          )}
          <Button type="button" variant="quest-primary" size="large" onClick={handleMarkCompleted} disabled={progress.status === "completed"}>
            {progress.status === "completed" && <CompletedBadge className="h-5 w-5" />}
            {t("realLifeQuests.markCompletedButton")}
          </Button>
        </div>
        {progress.status === "completed" && (
          <p className="mt-2xs text-sm text-ink/60">
            {justEarnedXp !== null ? t("realLifeQuests.rewardEarnedText", { xp: justEarnedXp }) : t("realLifeQuests.missionCompletedHint")}
          </p>
        )}

        <Card variant="reward" className="mt-md">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.reflectionTitle")}</h2>
          <p className="mt-2xs text-sm text-ink/80">{t(`${base}.reflectionPrompt`)}</p>
          <p className="mt-2xs text-xs text-ink/50">{t("realLifeQuests.reflectionHint")}</p>
          <div className="mt-sm flex flex-wrap gap-2xs">
            {RLQ_REFLECTION_CHOICES.map((choice: RLQReflectionChoice) => (
              <button
                key={choice}
                type="button"
                onClick={() => handleReflectionChoice(choice)}
                aria-pressed={progress.reflectionChoice === choice}
                className={[
                  "min-h-touch-min rounded-sm border-[1.5px] px-sm py-2xs text-sm font-medium transition-colors duration-quick",
                  progress.reflectionChoice === choice
                    ? "border-gold bg-gold text-ink"
                    : "border-ink/20 bg-white text-ink/80 hover:border-gold",
                ].join(" ")}
              >
                {t(`realLifeQuests.reflectionChoices.${choice}`)}
              </button>
            ))}
          </div>
          <label htmlFor="reflection-text" className="mt-sm block text-sm text-ink/60">
            {t("realLifeQuests.reflectionTextLabel")}
          </label>
          <textarea
            id="reflection-text"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            onBlur={handleReflectionTextBlur}
            placeholder={t("realLifeQuests.reflectionTextPlaceholder")}
            className="mt-2xs w-full rounded-sm border border-ink/20 p-2xs text-sm"
            rows={3}
          />
        </Card>

        <Card variant="data" className="mt-md">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.parentGuidanceTitle")}</h2>
          <p className="mt-2xs text-sm text-ink/70">{t(`${base}.parentGuidance`)}</p>
        </Card>

        {linkedHref && mission.linkedActivity && (
          <p className="mt-md text-center">
            <span className="block text-sm text-ink/60">{t("realLifeQuests.linkedActivityIntro")}</span>
            <Link href={linkedHref} className="mt-2xs inline-block text-teal hover:underline">
              {t(`realLifeQuests.linkedActivity.${mission.linkedActivity}`)}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
