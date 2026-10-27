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
import {
  MissionIcon,
  CompletedBadge,
  StartIcon,
  MarkCompleteIcon,
  RewardIcon,
  GreatFaceIcon,
  OkayFaceIcon,
  TrickyFaceIcon,
  NewIdeaIcon,
} from "@/components/real-life-quests/MissionIcon";
import { SaveForGoalVisual } from "@/components/real-life-quests/visuals/SaveForGoalVisual";
import { MiniBusinessVisual } from "@/components/real-life-quests/visuals/MiniBusinessVisual";
import { ShareIdeaVisual } from "@/components/real-life-quests/visuals/ShareIdeaVisual";

/** Maps each reflection choice to its visual symbol (module-scope: a
 * plain lookup, not per-render). Keeps the choice's existing meaning and
 * translated, emoji-prefixed label untouched — this is a second,
 * design-owned visual on top of what's already there, not a replacement
 * requiring any locale file to change. */
const REFLECTION_CHOICE_ICONS: Record<RLQReflectionChoice, typeof GreatFaceIcon> = {
  great: GreatFaceIcon,
  okay: OkayFaceIcon,
  tricky: TrickyFaceIcon,
  idea: NewIdeaIcon,
};

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
  const {
    isLoaded,
    getMissionProgress,
    startMission,
    setMissionVariant,
    completeMission,
    setReflection,
    setVisualChoice,
    setFilledSteps,
  } = useRealLifeQuests();
  const [reflectionText, setReflectionText] = useState("");
  const [justEarnedXp, setJustEarnedXp] = useState<number | null>(null);

  const missionId = params.missionId;
  const mission = getRLQMissionById(missionId);

  // Keep the local textarea value in sync with the saved reflection
  // whenever the mission changes (a client-side nav between two mission
  // pages re-renders this same component rather than remounting it), AND
  // once the hook's own async localStorage read finishes (`isLoaded`
  // flips false -> true exactly once, right after mount). Without the
  // `isLoaded` dependency, this effect's first run reads the hook's
  // still-default, not-yet-loaded state, writes "" into the textarea, and
  // then never re-runs for the SAME mission once the real saved data
  // arrives moments later — leaving a non-empty saved reflection
  // permanently invisible in the textarea despite being correctly in
  // localStorage. `isLoaded` only ever flips once per mount, so this
  // can't re-fire later and clobber a child's in-progress typing.
  useEffect(() => {
    setReflectionText(getMissionProgress(missionId).reflectionText);
    setJustEarnedXp(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, isLoaded]);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/70">{t("common.loading")}</div>;
  }

  if (!mission) {
    return (
      <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/real-life-quests" className="mt-sm inline-block text-teal-text hover:underline">
            {t("realLifeQuests.backToHub")}
          </Link>
        </div>
      </main>
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
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[700px]">
        <Link
          href="/real-life-quests"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal-text transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("realLifeQuests.backToHub")}
        </Link>

        <div className="mt-sm flex items-start gap-sm">
          <MissionIcon missionId={missionId} className="h-16 w-16 shrink-0 text-teal-text" />
          {/* min-w-0: a flex item's default min-width is "auto", meaning
              it refuses to shrink below its content's unwrapped intrinsic
              width even though the sibling icon is shrink-0 and takes a
              fixed share of the row. Without this, a long translated
              title or supervision label (e.g. German/Dutch/Romanian)
              pushes the row past the viewport at 320-375px instead of
              wrapping. min-w-0 lets this column shrink to the row's
              actual available width so normal (space/hyphen) text
              wrapping takes over.
              break-words (overflow-wrap: break-word) on the title and
              supervision text themselves: min-w-0 alone still isn't
              enough when a SINGLE word has no space or hyphen to wrap
              at and is simply too long for the column at this width —
              German compound nouns are the real-world case ("Mein
              erstes Mini-Unternehmen" wraps at the hyphen, but
              "Unternehmen" alone still doesn't fit at 320px and was
              overflowing the viewport by ~53px, confirmed visually,
              until this was added). break-words lets that one long word
              wrap mid-word as a last resort instead of overflowing. */}
          <div className="min-w-0">
            <p className="break-words text-xs font-medium uppercase tracking-wide text-ink/70">
              {t(`realLifeQuests.supervision.${mission.supervision}`)}
            </p>
            <h1 className="mt-2xs break-words font-display text-2xl font-bold">{t(`${base}.title`)}</h1>
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
        <p className="mt-sm flex items-center gap-2xs text-sm font-semibold text-teal-text">
          {progress.status === "completed" && <CompletedBadge className="h-5 w-5" />}
          {t(`realLifeQuests.status.${progress.status}`)}
        </p>

        {missionId === "save-for-something-you-love" && (
          <SaveForGoalVisual
            selectedChoiceId={progress.visualProgress.selectedChoiceId}
            filledSteps={progress.visualProgress.filledSteps}
            onSelectChoice={(choiceId) => setVisualChoice(missionId, choiceId)}
            onSetFilledSteps={(filledSteps) => setFilledSteps(missionId, filledSteps)}
          />
        )}
        {missionId === "my-first-mini-business" && (
          <MiniBusinessVisual
            selectedChoiceId={progress.visualProgress.selectedChoiceId}
            onSelectChoice={(choiceId) => setVisualChoice(missionId, choiceId)}
          />
        )}
        {missionId === "share-my-idea" && (
          <ShareIdeaVisual
            selectedChoiceId={progress.visualProgress.selectedChoiceId}
            onSelectChoice={(choiceId) => setVisualChoice(missionId, choiceId)}
          />
        )}

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
          <p className="mt-sm text-sm text-ink/70">
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
              <StartIcon className="h-5 w-5" />
              {t("realLifeQuests.markStartedButton")}
            </Button>
          )}
          <Button type="button" variant="quest-primary" size="large" onClick={handleMarkCompleted} disabled={progress.status === "completed"}>
            {progress.status === "completed" ? (
              // text-ink override: CompletedBadge's circle uses
              // `fill="currentColor"` and its checkmark is a hardcoded
              // white stroke. Everywhere else it sits inside teal text
              // (e.g. the status line above), so the circle naturally
              // comes out teal and the white check reads clearly. This
              // button's own text is white (quest-primary), which would
              // make the circle white too -- an invisible white check on
              // a white circle. Forcing a dark circle here keeps the
              // checkmark visible regardless of the button's own text
              // color, without changing the shared component or its
              // other (already-correct) usage.
              <CompletedBadge className="h-5 w-5 text-ink" />
            ) : (
              <MarkCompleteIcon className="h-5 w-5" />
            )}
            {t("realLifeQuests.markCompletedButton")}
          </Button>
        </div>
        {progress.status === "completed" && (
          <p className="mt-2xs inline-flex items-center gap-2xs rounded-full border border-gold/50 bg-gold/15 px-sm py-2xs text-sm text-ink/70">
            {justEarnedXp !== null && <RewardIcon className="h-5 w-5 text-gold" />}
            {justEarnedXp !== null ? t("realLifeQuests.rewardEarnedText", { xp: justEarnedXp }) : t("realLifeQuests.missionCompletedHint")}
          </p>
        )}

        <Card variant="reward" className="mt-md">
          <h2 className="font-display text-md font-bold">{t("realLifeQuests.reflectionTitle")}</h2>
          <p className="mt-2xs text-sm text-ink/80">{t(`${base}.reflectionPrompt`)}</p>
          <p className="mt-2xs text-xs text-ink/70">{t("realLifeQuests.reflectionHint")}</p>
          <div className="mt-sm grid grid-cols-2 gap-2xs sm:grid-cols-4">
            {RLQ_REFLECTION_CHOICES.map((choice: RLQReflectionChoice) => {
              const ReflectionIcon = REFLECTION_CHOICE_ICONS[choice];
              const selected = progress.reflectionChoice === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleReflectionChoice(choice)}
                  aria-pressed={selected}
                  className={[
                    "flex min-h-touch-min-child w-full flex-col items-center gap-2xs rounded-lg border-[1.5px] p-xs text-center text-sm font-medium transition-colors duration-quick",
                    selected ? "border-gold bg-gold text-ink" : "border-ink/20 bg-white text-ink/80 hover:border-gold",
                  ].join(" ")}
                >
                  <ReflectionIcon className="h-7 w-7" />
                  <span className="inline-flex items-center gap-2xs">
                    {t(`realLifeQuests.reflectionChoices.${choice}`)}
                    {selected && <SelectedCheckIcon />}
                  </span>
                </button>
              );
            })}
          </div>
          <label htmlFor="reflection-text" className="mt-sm block text-sm text-ink/70">
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
            <span className="block text-sm text-ink/70">{t("realLifeQuests.linkedActivityIntro")}</span>
            <Link href={linkedHref} className="mt-2xs inline-block text-teal-text hover:underline">
              {t(`realLifeQuests.linkedActivity.${mission.linkedActivity}`)}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
