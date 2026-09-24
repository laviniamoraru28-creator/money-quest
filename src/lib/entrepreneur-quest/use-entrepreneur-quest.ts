"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDefaultState,
  updateBusinessField as updateBusinessFieldPure,
  updateLogo as updateLogoPure,
  completeStage as completeStagePure,
  recordDecision as recordDecisionPure,
  completeChallenge as completeChallengePure,
  toggleRealWorldMission as toggleRealWorldMissionPure,
  completePitch as completePitchPure,
  runSimulator,
  applySimulatorRun,
  completeRunActivity as completeRunActivityPure,
  completeProblem as completeProblemPure,
  setStockLevel as setStockLevelPure,
  applyPivotChoice as applyPivotChoicePure,
  applyGrowDecision as applyGrowDecisionPure,
  completeAiLabActivity as completeAiLabActivityPure,
  updateBusinessReview as updateBusinessReviewPure,
  startRescue as startRescuePure,
  recordRescueDecision as recordRescueDecisionPure,
  finishRescue as finishRescuePure,
  type EntrepreneurQuestState,
  type BusinessProfile,
  type BusinessLogo,
  type BusinessReview,
  type EQStockLevel,
  type SimulatorInput,
} from "./state";

/**
 * The Entrepreneur Quest mirror of use-local-progress.ts — same
 * pattern (pure state module + thin localStorage-backed hook), same
 * `isLoaded` guard for the same reason (localStorage only exists after
 * mount), but its own storage key so a bug here can never corrupt the
 * shared wallet/goals/XP data every other feature depends on.
 */
const STORAGE_KEY = "moneyquest_entrepreneur_quest_v1";

function readFromStorage(): EntrepreneurQuestState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const defaults = createDefaultState();
    return {
      ...defaults,
      ...parsed,
      business: {
        ...defaults.business,
        ...parsed.business,
        logo: { ...defaults.business.logo, ...parsed.business?.logo },
      },
      stats: { ...defaults.stats, ...parsed.stats },
    };
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(state: EntrepreneurQuestState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — keep working in-memory for the rest of the session
    // rather than throw, matching use-local-progress.ts's own choice.
  }
}

export function resetEntrepreneurQuest(): EntrepreneurQuestState {
  const fresh = createDefaultState();
  writeToStorage(fresh);
  return fresh;
}

export function useEntrepreneurQuest() {
  const [state, setState] = useState<EntrepreneurQuestState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: EntrepreneurQuestState) => {
    setState(next);
    writeToStorage(next);
  }, []);

  const updateBusinessField = useCallback(
    <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) => {
      persist(updateBusinessFieldPure(state, field, value));
    },
    [state, persist]
  );

  const updateLogo = useCallback(
    <K extends keyof BusinessLogo>(field: K, value: BusinessLogo[K]) => {
      persist(updateLogoPure(state, field, value));
    },
    [state, persist]
  );

  const completeStage = useCallback(
    (stageId: string) => {
      persist(completeStagePure(state, stageId));
    },
    [state, persist]
  );

  const recordDecision = useCallback(
    (eventId: string, choiceKey: string) => {
      persist(recordDecisionPure(state, eventId, choiceKey));
    },
    [state, persist]
  );

  const completeChallenge = useCallback(
    (challengeId: string) => {
      persist(completeChallengePure(state, challengeId));
    },
    [state, persist]
  );

  const toggleRealWorldMission = useCallback(
    (missionId: string) => {
      persist(toggleRealWorldMissionPure(state, missionId));
    },
    [state, persist]
  );

  const completePitch = useCallback(() => {
    persist(completePitchPure(state));
  }, [state, persist]);

  const runBusinessSimulator = useCallback(
    (input: SimulatorInput) => {
      const run = runSimulator(state.business, input);
      persist(applySimulatorRun(state, run));
      return run;
    },
    [state, persist]
  );

  const resetBusiness = useCallback(() => {
    const fresh = resetEntrepreneurQuest();
    setState(fresh);
  }, []);

  const completeRunActivity = useCallback(
    (activityId: string) => {
      persist(completeRunActivityPure(state, activityId));
    },
    [state, persist]
  );

  const completeProblem = useCallback(
    (problemId: string) => {
      persist(completeProblemPure(state, problemId));
    },
    [state, persist]
  );

  const setStockLevel = useCallback(
    (level: EQStockLevel) => {
      persist(setStockLevelPure(state, level));
    },
    [state, persist]
  );

  const applyPivotChoice = useCallback(
    (choiceKey: string) => {
      persist(applyPivotChoicePure(state, choiceKey));
    },
    [state, persist]
  );

  const applyGrowDecision = useCallback(
    (choiceKey: string) => {
      persist(applyGrowDecisionPure(state, choiceKey));
    },
    [state, persist]
  );

  const completeAiLabActivity = useCallback(
    (activityId: string) => {
      persist(completeAiLabActivityPure(state, activityId));
    },
    [state, persist]
  );

  const updateBusinessReview = useCallback(
    <K extends keyof BusinessReview>(field: K, value: BusinessReview[K]) => {
      persist(updateBusinessReviewPure(state, field, value));
    },
    [state, persist]
  );

  const startRescue = useCallback(() => {
    persist(startRescuePure(state));
  }, [state, persist]);

  const recordRescueDecision = useCallback(
    (problemId: string, responseKey: string) => {
      persist(recordRescueDecisionPure(state, problemId, responseKey));
    },
    [state, persist]
  );

  const finishRescue = useCallback(() => {
    persist(finishRescuePure(state));
  }, [state, persist]);

  return {
    state,
    isLoaded,
    updateBusinessField,
    updateLogo,
    completeStage,
    recordDecision,
    completeChallenge,
    toggleRealWorldMission,
    completePitch,
    runBusinessSimulator,
    resetBusiness,
    completeRunActivity,
    completeProblem,
    setStockLevel,
    applyPivotChoice,
    applyGrowDecision,
    completeAiLabActivity,
    updateBusinessReview,
    startRescue,
    recordRescueDecision,
    finishRescue,
  };
}
