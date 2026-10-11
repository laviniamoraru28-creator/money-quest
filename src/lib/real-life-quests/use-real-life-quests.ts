"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDefaultState,
  startMission as startMissionPure,
  setMissionVariant as setMissionVariantPure,
  completeMission as completeMissionPure,
  setReflection as setReflectionPure,
  setVisualChoice as setVisualChoicePure,
  setFilledSteps as setFilledStepsPure,
  getMissionProgress,
  type RealLifeQuestsState,
} from "./state";
import type { RLQVariant, RLQReflectionChoice } from "@/content/real-life-quests/structures";

/**
 * The Real Life Quests mirror of use-leadership-quest.ts/
 * use-entrepreneur-quest.ts — same pattern (pure state module + thin
 * localStorage-backed hook), its own storage key so nothing here can
 * ever touch Entrepreneur Quest's, Leadership Quest's, or the shared
 * wallet's saved data.
 */
const STORAGE_KEY = "moneyquest_real_life_quests_v1";

function readFromStorage(): RealLifeQuestsState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    return { ...createDefaultState(), ...parsed, missions: { ...(parsed.missions ?? {}) } };
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(state: RealLifeQuestsState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — keep working in-memory for the rest of the session
    // rather than throw, matching every other local-progress hook here.
  }
}

export function resetRealLifeQuests(): RealLifeQuestsState {
  const fresh = createDefaultState();
  writeToStorage(fresh);
  return fresh;
}

export function useRealLifeQuests() {
  const [state, setState] = useState<RealLifeQuestsState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: RealLifeQuestsState) => {
    setState(next);
    writeToStorage(next);
  }, []);

  const startMission = useCallback(
    (missionId: string) => {
      persist(startMissionPure(state, missionId));
    },
    [state, persist]
  );

  const setMissionVariant = useCallback(
    (missionId: string, variant: RLQVariant) => {
      persist(setMissionVariantPure(state, missionId, variant));
    },
    [state, persist]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      const result = completeMissionPure(state, missionId);
      persist(result.state);
      return result;
    },
    [state, persist]
  );

  const setReflection = useCallback(
    (missionId: string, reflectionChoice: RLQReflectionChoice | null, reflectionText: string) => {
      persist(setReflectionPure(state, missionId, reflectionChoice, reflectionText));
    },
    [state, persist]
  );

  const setVisualChoice = useCallback(
    (missionId: string, choiceId: string) => {
      persist(setVisualChoicePure(state, missionId, choiceId));
    },
    [state, persist]
  );

  const setFilledSteps = useCallback(
    (missionId: string, filledSteps: number) => {
      persist(setFilledStepsPure(state, missionId, filledSteps));
    },
    [state, persist]
  );

  const resetProgress = useCallback(() => {
    const fresh = resetRealLifeQuests();
    setState(fresh);
  }, []);

  return {
    state,
    isLoaded,
    getMissionProgress: (missionId: string) => getMissionProgress(state, missionId),
    startMission,
    setMissionVariant,
    completeMission,
    setReflection,
    setVisualChoice,
    setFilledSteps,
    resetProgress,
  };
}
