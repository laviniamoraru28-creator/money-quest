"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { deriveDominantTag } from "@/lib/leadership-quest/state";
import {
  getLQMissionById,
  LQ_MISSIONS,
  LQ_EFFECTS,
  LQ_BADGE_IDS,
  LQ_MISSING_TASK_CLUE_IDS,
  LQ_TEAM_CONFLICT_SPOT_ITEM_IDS,
  LQ_MOTIVATION_SPOT_ITEM_IDS,
  LQ_DEADLINE_TOTAL_MINUTES,
  LQ_DEADLINE_CATEGORIES,
  LQ_PRESSURE_TEST_BUCKET_KEYS,
  LQ_PRESSURE_TEST_ITEMS,
  LQ_UH_OH_EVENTS,
  LQ_CHARACTER_IDS,
  type LQArchetypeId,
  type LQCharacterId,
} from "@/content/leadership-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionScene } from "@/components/leadership-quest/MissionScene";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import { MatchMechanic } from "@/game-engine/mechanics/MatchMechanic";
import { SpotMechanic } from "@/game-engine/mechanics/SpotMechanic";
import { AllocateMechanic } from "@/game-engine/mechanics/AllocateMechanic";
import { SortMechanic } from "@/game-engine/mechanics/SortMechanic";
import type { MissionRound, MatchRound, SpotRound, AllocateRound, SortRound } from "@/game-engine/types";

type LQRoundKind = "match" | "spot" | "allocate" | "sort" | "mission";

/** Every scoreable event id follows one of 5 naming suffixes, so which
 * mechanic renders it is derived from the id itself rather than a
 * second parallel lookup table to keep in sync with LQ_EFFECTS. */
function roundKindForEvent(eventId: string): LQRoundKind {
  if (eventId.endsWith("-match")) return "match";
  if (eventId.endsWith("-spot")) return "spot";
  if (eventId.endsWith("-allocate")) return "allocate";
  if (eventId.endsWith("-sort")) return "sort";
  return "mission";
}

export default function LeadershipQuestMissionPage() {
  const params = useParams<{ missionId: string }>();
  const uiLocale = useLocale();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded, awardBadge } = useLocalProgress();
  const { state, isLoaded, recordChoice, completeMission, markUhOhSeen } = useLeadershipQuest();
  const [eventStepIndex, setEventStepIndex] = useState(0);
  const [revealedClueIds, setRevealedClueIds] = useState<string[]>([]);

  const missionId = params.missionId;
  const mission = getLQMissionById(missionId);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  if (!mission) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("errors.genericTryAgain")}</p>
          <Link href="/leadership-quest" className="mt-sm inline-block text-teal hover:underline">
            {t("leadershipQuest.hubTitle")}
          </Link>
        </div>
      </div>
    );
  }

  /** One shared handler for every scoreable choice/completion in this
   * page (match/spot/allocate/sort completions use a fixed "completed"
   * choiceKey) — awardBadge and recordChoice are two independent hooks'
   * state, so calling both in one click handler is safe; calling two
   * mutator callbacks from the SAME hook in one handler would not be
   * (each closes over this render's now-stale `state`), which is why
   * every button below triggers exactly one leadership-quest mutation. */
  function handleEventEffect(eventId: string, choiceKey: string) {
    recordChoice(eventId, choiceKey);
    const tag = LQ_EFFECTS[eventId]?.[choiceKey]?.archetypeTag as LQArchetypeId | undefined;
    if (tag === "the-listener") awardBadge(LQ_BADGE_IDS.goodListener);
    if (tag === "the-problem-solver") awardBadge(LQ_BADGE_IDS.problemSolver);
  }

  function handleFinishMission() {
    completeMission(mission!.id);
    if (mission!.id === "meet-your-team") awardBadge(LQ_BADGE_IDS.firstLeader);
    if (mission!.id === "first-challenge") awardBadge(LQ_BADGE_IDS.teamBuilder);
    if (mission!.id === "pressure-test") awardBadge(LQ_BADGE_IDS.calmUnderPressure);
    if (mission!.id === "final-challenge") awardBadge(LQ_BADGE_IDS.finalLeader);
  }

  const missionIndex = LQ_MISSIONS.findIndex((m) => m.id === mission.id);
  const nextMission = LQ_MISSIONS[missionIndex + 1];
  const isMissionAlreadyDone = state.completedMissionIds.includes(mission.id);
  const allEventsAnswered = eventStepIndex >= mission.eventIds.length;
  const uhOhForThisMission = LQ_UH_OH_EVENTS.find((e) => e.triggerAfterMissionId === mission.id);
  const showUhOh = allEventsAnswered && Boolean(uhOhForThisMission) && !state.uhOhEventsSeenIds.includes(uhOhForThisMission!.id);
  const uhOhAnswered = uhOhForThisMission ? state.leadershipChoices[uhOhForThisMission.id] !== undefined : false;
  const isDone = allEventsAnswered && !showUhOh;
  const currentEventId = allEventsAnswered ? undefined : mission.eventIds[eventStepIndex];
  const isFirstStep = eventStepIndex === 0;

  const title = t(`leadershipQuest.missions.${mission.id}.title`);
  const dialogueLines = isFirstStep && !allEventsAnswered ? (t.raw(`leadershipQuest.missions.${mission.id}.dialogue`) as { character: string; text: string }[]) : undefined;
  const alertText = isFirstStep && !allEventsAnswered ? t(`leadershipQuest.missions.${mission.id}.alertText`) : undefined;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/leadership-quest"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("leadershipQuest.hubTitle")}
        </Link>

        <Card variant="activity" className="mt-sm">
          <MissionScene
            title={title}
            alertText={alertText}
            dialogueLines={dialogueLines?.map((line) => ({ characterId: line.character as LQCharacterId, text: line.text }))}
          >
            {!allEventsAnswered && currentEventId && (
              <MissionEventBody
                key={currentEventId}
                mission={mission}
                eventId={currentEventId}
                revealedClueIds={revealedClueIds}
                setRevealedClueIds={setRevealedClueIds}
                currencyCode={progressState.currencyCode}
                uiLocale={uiLocale}
                isResolved={state.leadershipChoices[currentEventId] !== undefined}
                dominantTag={deriveDominantTag(state.reflectionHistory)}
                onEffect={handleEventEffect}
              />
            )}

            {!allEventsAnswered && currentEventId && state.leadershipChoices[currentEventId] !== undefined && (
              <>
                {roundKindForEvent(currentEventId) !== "mission" && (
                  <p className="mt-sm rounded-md border border-teal/30 bg-teal/5 p-sm text-sm text-ink/80">
                    {t(`leadershipQuest.missions.${mission.id}.outro`)}
                  </p>
                )}
                {mission.id === "meet-your-team" && currentEventId === "meet-your-team-match" && (
                  <div className="mt-sm grid gap-2xs sm:grid-cols-2">
                    {LQ_CHARACTER_IDS.map((characterId) => (
                      <div key={characterId} className="rounded-md border border-ink/10 bg-white p-sm">
                        <p className="font-semibold text-ink">{t(`leadershipQuest.characters.${characterId}.name`)}</p>
                        <p className="mt-2xs text-sm text-ink/70">{t(`leadershipQuest.characters.${characterId}.personality`)}</p>
                        <p className="mt-2xs text-xs text-ink/60">💪 {t(`leadershipQuest.characters.${characterId}.strength`)}</p>
                        <p className="mt-2xs text-xs text-ink/60">🌱 {t(`leadershipQuest.characters.${characterId}.challenge`)}</p>
                        <p className="mt-2xs text-xs text-ink/60">❤️ {t(`leadershipQuest.characters.${characterId}.interest`)}</p>
                        <p className="mt-2xs text-xs text-ink/60">💬 {t(`leadershipQuest.characters.${characterId}.communicationStyle`)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="quest-primary" className="mt-sm w-full" onClick={() => setEventStepIndex((i) => i + 1)}>
                  {t("leadershipQuest.continueButton")}
                </Button>
              </>
            )}

            {showUhOh && uhOhForThisMission && (
              <div className="mt-md border-t border-ink/10 pt-md">
                <UhOhEventBody
                  uhOhId={uhOhForThisMission.id}
                  currencyCode={progressState.currencyCode}
                  uiLocale={uiLocale}
                  isResolved={uhOhAnswered}
                  onEffect={handleEventEffect}
                />
                {uhOhAnswered && (
                  <Button variant="quest-primary" className="mt-sm w-full" onClick={() => markUhOhSeen(uhOhForThisMission.id)}>
                    {t("leadershipQuest.continueButton")}
                  </Button>
                )}
              </div>
            )}

            {isDone && (
              <div className="mt-md border-t border-ink/10 pt-md">
                {!isMissionAlreadyDone ? (
                  <Button variant="quest-primary" className="w-full" onClick={handleFinishMission}>
                    {t("leadershipQuest.finishMissionButton")}
                  </Button>
                ) : (
                  <div className="grid gap-2xs">
                    <p className="text-sm font-medium text-success">✓ {t("leadershipQuest.missionCompleteBadge")}</p>
                    {nextMission ? (
                      <Link href={`/leadership-quest/missions/${nextMission.id}`}>
                        <Button variant="quest-primary" className="w-full">
                          {t("leadershipQuest.continueToNextMissionButton")}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/leadership-quest/profile">
                        <Button variant="reward" className="w-full">
                          {t("leadershipQuest.profileLink")}
                        </Button>
                      </Link>
                    )}
                    <Link href="/leadership-quest" className="text-center text-sm text-teal hover:underline">
                      {t("leadershipQuest.backToTeamHub")}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </MissionScene>
        </Card>
      </main>
    </div>
  );
}

function MissionEventBody({
  mission,
  eventId,
  revealedClueIds,
  setRevealedClueIds,
  currencyCode,
  uiLocale,
  isResolved,
  dominantTag,
  onEffect,
}: {
  mission: ReturnType<typeof getLQMissionById>;
  eventId: string;
  revealedClueIds: string[];
  setRevealedClueIds: (updater: (prev: string[]) => string[]) => void;
  currencyCode: string;
  uiLocale: string;
  isResolved: boolean;
  dominantTag: LQArchetypeId | null;
  onEffect: (eventId: string, choiceKey: string) => void;
}) {
  const t = useTranslations();
  if (!mission) return null;
  const kind = roundKindForEvent(eventId);

  if (kind === "match" && mission.matchPairs) {
    const round: MatchRound = {
      id: eventId,
      mechanic: "match",
      prompt: "",
      hint: "",
      explanation: "",
      pairs: mission.matchPairs.map((p) => ({
        id: p.id,
        left: t(`leadershipQuest.missions.${mission.id}.tasks.${p.id}`),
        right: t(`leadershipQuest.characters.${p.characterId}.name`),
      })),
    };
    return (
      <MatchMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(isCorrect) => {
          if (isCorrect) onEffect(eventId, "completed");
        }}
        isResolved={isResolved}
      />
    );
  }

  if (kind === "spot") {
    const itemIds = eventId === "team-conflict-spot" ? LQ_TEAM_CONFLICT_SPOT_ITEM_IDS : LQ_MOTIVATION_SPOT_ITEM_IDS;
    const scenarioKey = eventId === "team-conflict-spot" ? "leadershipQuest.missions.team-conflict.spotScenario" : "leadershipQuest.missions.motivation-problem.spotScenario";
    const itemTextNamespace = eventId === "team-conflict-spot" ? "leadershipQuest.spotItems.teamConflict" : "leadershipQuest.spotItems.motivationProblem";
    const round: SpotRound = {
      id: eventId,
      mechanic: "spot",
      prompt: "",
      hint: "",
      explanation: "",
      scenario: t(scenarioKey),
      items: itemIds.map((item) => ({ id: item.id, text: t(`${itemTextNamespace}.${item.id}`), isSuspicious: item.isSuspicious })),
    };
    return (
      <SpotMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(isCorrect) => {
          if (isCorrect) onEffect(eventId, "completed");
        }}
        isResolved={isResolved}
      />
    );
  }

  if (kind === "allocate") {
    const round: AllocateRound = {
      id: eventId,
      mechanic: "allocate",
      prompt: "",
      hint: "",
      explanation: "",
      totalMinorUnits: LQ_DEADLINE_TOTAL_MINUTES,
      categories: LQ_DEADLINE_CATEGORIES.map((c) => ({ key: c.key, label: t(`leadershipQuest.missions.the-deadline.tasks.${c.key}`) })),
      targets: LQ_DEADLINE_CATEGORIES.map((c) => ({ categoryKey: c.key, targetMinorUnits: c.targetMinutes, toleranceMinorUnits: c.toleranceMinutes })),
    };
    return (
      <AllocateMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(isCorrect) => {
          if (isCorrect) onEffect(eventId, "completed");
        }}
        isResolved={isResolved}
      />
    );
  }

  if (kind === "sort") {
    const round: SortRound = {
      id: eventId,
      mechanic: "sort",
      prompt: "",
      hint: "",
      explanation: "",
      buckets: LQ_PRESSURE_TEST_BUCKET_KEYS.map((key) => ({ key, label: t(`leadershipQuest.missions.pressure-test.buckets.${key}`) })),
      items: LQ_PRESSURE_TEST_ITEMS.map((item) => ({ id: item.id, label: t(`leadershipQuest.missions.pressure-test.problems.${item.id}`), correctBucketKey: item.correctBucketKey })),
    };
    return (
      <SortMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(isCorrect) => {
          if (isCorrect) onEffect(eventId, "completed");
        }}
        isResolved={isResolved}
      />
    );
  }

  // "mission" kind — a real branching decision, or the missing-task
  // investigate-then-decide flow, or the final-challenge choice whose
  // framing text depends on the child's dominant archetype so far.
  const choices = t.raw(`leadershipQuest.missions.${mission.id}.events.${eventId}.choices`) as MissionRound["choices"];
  let situation: string;
  if (eventId === "final-challenge-choice-1") {
    situation = t(`leadershipQuest.missions.final-challenge.events.final-challenge-choice-1.situationByTag.${dominantTag ?? "none"}`);
  } else {
    situation = t(`leadershipQuest.missions.${mission.id}.events.${eventId}.situation`);
  }
  const round: MissionRound = { id: eventId, mechanic: "mission", prompt: "", hint: "", explanation: "", situation, choices };

  return (
    <div>
      {mission.id === "missing-task" && eventId === "missing-task-choice" && (
        <div className="mb-sm">
          <p className="text-sm font-medium">{t("leadershipQuest.missions.missing-task.investigateLabel")}</p>
          <div className="mt-2xs grid gap-2xs sm:grid-cols-3">
            {LQ_MISSING_TASK_CLUE_IDS.map((clueId) => {
              const isRevealed = revealedClueIds.includes(clueId);
              return (
                <button
                  key={clueId}
                  type="button"
                  onClick={() => setRevealedClueIds((prev) => (prev.includes(clueId) ? prev : [...prev, clueId]))}
                  className={[
                    "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-sm",
                    isRevealed ? "border-teal bg-teal/5 text-ink" : "border-ink/15 text-ink/60",
                  ].join(" ")}
                >
                  {isRevealed ? t(`leadershipQuest.missions.missing-task.investigate.${clueId}`) : t("entrepreneurQuest.problemFlow.tapToReveal")}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <MissionMechanic
        round={round}
        currencyCode={currencyCode}
        uiLocale={uiLocale}
        usesCurrency={false}
        onAnswer={(_isCorrect, choiceKey) => {
          if (choiceKey) onEffect(eventId, choiceKey);
        }}
        isResolved={isResolved}
      />
    </div>
  );
}

function UhOhEventBody({
  uhOhId,
  currencyCode,
  uiLocale,
  isResolved,
  onEffect,
}: {
  uhOhId: string;
  currencyCode: string;
  uiLocale: string;
  isResolved: boolean;
  onEffect: (eventId: string, choiceKey: string) => void;
}) {
  const t = useTranslations();
  const choices = t.raw(`leadershipQuest.uhOh.${uhOhId}.choices`) as MissionRound["choices"];
  const round: MissionRound = {
    id: uhOhId,
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t(`leadershipQuest.uhOh.${uhOhId}.situation`),
    choices,
  };
  return (
    <div>
      <p className="rounded-md border-2 border-coral/40 bg-coral/5 p-sm text-base font-medium text-ink">
        <span aria-hidden="true">⚠️</span> {t(`leadershipQuest.uhOh.${uhOhId}.title`)}
      </p>
      <div className="mt-sm">
        <MissionMechanic
          round={round}
          currencyCode={currencyCode}
          uiLocale={uiLocale}
          usesCurrency={false}
          onAnswer={(_isCorrect, choiceKey) => {
            if (choiceKey) onEffect(uhOhId, choiceKey);
          }}
          isResolved={isResolved}
        />
      </div>
    </div>
  );
}
