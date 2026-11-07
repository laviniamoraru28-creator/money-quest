"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const latest = useRef(state);

  useEffect(() => {
    const restored = readFromStorage();
    latest.current = restored;
    setState(restored);
    setIsLoaded(true);
  }, []);

  const persist = useCallback((change: (current: EntrepreneurQuestState) => EntrepreneurQuestState) => {
    const next = change(latest.current);
    latest.current = next;
    setState(next);
    writeToStorage(next);
  }, []);

  const updateBusinessField = useCallback(
    <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) => {
      persist(current => updateBusinessFieldPure(current, field, value));
    },
    [persist]
  );

  const updateLogo = useCallback(
    <K extends keyof BusinessLogo>(field: K, value: BusinessLogo[K]) => {
      persist(current => updateLogoPure(current, field, value));
    },
    [persist]
  );

  const completeStage = useCallback(
    (stageId: string) => {
      persist(current => completeStagePure(current, stageId));
    },
    [persist]
  );

  const recordDecision = useCallback(
    (eventId: string, choiceKey: string) => {
      persist(current => recordDecisionPure(current, eventId, choiceKey));
    },
    [persist]
  );

  const completeChallenge = useCallback(
    (challengeId: string) => {
      persist(current => completeChallengePure(current, challengeId));
    },
    [persist]
  );

  const toggleRealWorldMission = useCallback(
    (missionId: string) => {
      persist(current => toggleRealWorldMissionPure(current, missionId));
    },
    [persist]
  );

  const completePitch = useCallback(() => {
    persist(current => completePitchPure(current));
  }, [persist]);

  const runBusinessSimulator = useCallback(
    (input: SimulatorInput) => {
      const run = runSimulator(latest.current.business, input);
      persist(current => applySimulatorRun(current, run));
      return run;
    },
    [persist]
  );

  const resetBusiness = useCallback(() => {
    const fresh = resetEntrepreneurQuest();
    latest.current = fresh;
    setState(fresh);
  }, []);

  const completeRunActivity = useCallback(
    (activityId: string) => {
      persist(current => completeRunActivityPure(current, activityId));
    },
    [persist]
  );

  const completeProblem = useCallback(
    (problemId: string) => {
      persist(current => completeProblemPure(current, problemId));
    },
    [persist]
  );

  const setStockLevel = useCallback(
    (level: EQStockLevel) => {
      persist(current => setStockLevelPure(current, level));
    },
    [persist]
  );

  const applyPivotChoice = useCallback(
    (choiceKey: string) => {
      persist(current => applyPivotChoicePure(current, choiceKey));
    },
    [persist]
  );

  const applyGrowDecision = useCallback(
    (choiceKey: string) => {
      persist(current => applyGrowDecisionPure(current, choiceKey));
    },
    [persist]
  );

  const completeAiLabActivity = useCallback(
    (activityId: string) => {
      persist(current => completeAiLabActivityPure(current, activityId));
    },
    [persist]
  );

  const updateBusinessReview = useCallback(
    <K extends keyof BusinessReview>(field: K, value: BusinessReview[K]) => {
      persist(current => updateBusinessReviewPure(current, field, value));
    },
    [persist]
  );

  const startRescue = useCallback(() => {
    persist(current => startRescuePure(current));
  }, [persist]);

  const recordRescueDecision = useCallback(
    (problemId: string, responseKey: string) => {
      persist(current => recordRescueDecisionPure(current, problemId, responseKey));
    },
    [persist]
  );

  const finishRescue = useCallback(() => {
    persist(current => finishRescuePure(current));
  }, [persist]);

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
