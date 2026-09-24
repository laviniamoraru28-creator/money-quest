"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDefaultState,
  applyActivityCompletion,
  createGoal as createGoalPure,
  contributeToGoal as contributeToGoalPure,
  withdrawFromGoal as withdrawFromGoalPure,
  removeGoal as removeGoalPure,
  awardBadge as awardBadgePure,
  computeLevel,
  type LocalProgressState,
} from "./state";

/**
 * The ONLY place `window.localStorage` is touched directly — every
 * other file works with the pure `LocalProgressState` shape from
 * state.ts. Per the privacy-first redesign
 * (docs/data-flow-inventory-pre-redesign.md): this data never leaves
 * the device. There is no network call anywhere in this file.
 */
const STORAGE_KEY = "moneyquest_local_progress_v1";

function readFromStorage(): LocalProgressState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    return { ...createDefaultState(), ...parsed };
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(state: LocalProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — the app should keep working in-memory for the rest
    // of the session rather than throw, even though progress won't
    // persist across a reload in that case.
  }
}

export function resetLocalProgress(): LocalProgressState {
  const fresh = createDefaultState();
  writeToStorage(fresh);
  return fresh;
}

/**
 * The one hook every child-facing page uses to read and update
 * progress — replaces every Supabase query/Server Action the old
 * architecture used for XP, wallet, goals, and badges. `isLoaded`
 * exists because `localStorage` is only available after mount (the
 * server-rendered HTML can't know its contents) — pages should treat
 * the pre-load render as "we don't know yet," not "empty," to avoid a
 * flash of a fresh-looking state before the real saved data loads.
 */
export function useLocalProgress() {
  const [state, setState] = useState<LocalProgressState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: LocalProgressState) => {
    setState(next);
    writeToStorage(next);
  }, []);

  const setAgeBand = useCallback(
    (ageBand: LocalProgressState["ageBand"]) => {
      persist({ ...state, ageBand });
    },
    [state, persist]
  );

  const setCurrencyCode = useCallback(
    (currencyCode: string) => {
      persist({ ...state, currencyCode });
    },
    [state, persist]
  );

  const completeActivity = useCallback(
    (activityId: string, wasCorrect: boolean, xpReward: number, coinRewardMinorUnits: number) => {
      const result = applyActivityCompletion(state, activityId, wasCorrect, xpReward, coinRewardMinorUnits);
      persist(result.state);
      return result;
    },
    [state, persist]
  );

  const createGoal = useCallback(
    (name: string, targetMinorUnits: number) => {
      persist(createGoalPure(state, name, targetMinorUnits));
    },
    [state, persist]
  );

  const contributeToGoal = useCallback(
    (goalId: string, amountMinorUnits: number) => {
      const result = contributeToGoalPure(state, goalId, amountMinorUnits);
      persist(result.state);
      return result;
    },
    [state, persist]
  );

  const withdrawFromGoal = useCallback(
    (goalId: string, amountMinorUnits: number) => {
      const result = withdrawFromGoalPure(state, goalId, amountMinorUnits);
      persist(result.state);
      return result;
    },
    [state, persist]
  );

  const removeGoal = useCallback(
    (goalId: string) => {
      persist(removeGoalPure(state, goalId));
    },
    [state, persist]
  );

  const resetProgress = useCallback(() => {
    const fresh = resetLocalProgress();
    setState(fresh);
  }, []);

  const awardBadge = useCallback(
    (badgeId: string) => {
      persist(awardBadgePure(state, badgeId));
    },
    [state, persist]
  );

  return {
    state,
    isLoaded,
    level: computeLevel(state.xpTotal),
    setAgeBand,
    setCurrencyCode,
    completeActivity,
    createGoal,
    contributeToGoal,
    withdrawFromGoal,
    removeGoal,
    resetProgress,
    awardBadge,
  };
}
