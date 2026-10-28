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
// Keep the current visit usable when browser storage is blocked.
let memoryState = createDefaultState();

function readFromStorage(): LocalProgressState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return memoryState;
    const next = { ...createDefaultState(), ...parsed };
    if (![null,"explorer","builder","strategist"].includes(next.ageBand)) next.ageBand = null;
    if (typeof next.currencyCode !== "string" || !/^[A-Z]{3}$/.test(next.currencyCode)) next.currencyCode = "GBP";
    for (const field of ["xpTotal","walletBalanceMinorUnits"] as const) if (!Number.isSafeInteger(next[field]) || next[field] < 0) next[field] = 0;
    next.completedActivityIds = Array.isArray(next.completedActivityIds) ? next.completedActivityIds.filter((id: unknown) => typeof id === "string") : [];
    next.earnedBadgeIds = Array.isArray(next.earnedBadgeIds) ? next.earnedBadgeIds.filter((id: unknown) => typeof id === "string") : [];
    next.goals = Array.isArray(next.goals) ? next.goals.filter((goal: unknown) => {
      if (!goal || typeof goal !== "object") return false;
      const value=goal as Record<string,unknown>;
      return typeof value.id === "string" && typeof value.name === "string" && typeof value.targetMinorUnits === "number" && Number.isSafeInteger(value.targetMinorUnits) && value.targetMinorUnits > 0 && typeof value.currentMinorUnits === "number" && Number.isSafeInteger(value.currentMinorUnits) && value.currentMinorUnits >= 0 && (value.achievedAt === null || typeof value.achievedAt === "string");
    }) : [];
    memoryState = next;
    return next;
  } catch {
    return memoryState;
  }
}

function writeToStorage(state: LocalProgressState): void {
  if (typeof window === "undefined") return;
  memoryState = state;
  window.dispatchEvent(new CustomEvent("moneyquest-progress", {detail: state}));
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
  if (typeof window !== "undefined") {
    for (const key of ["money-quest-discovery-v1", "moneyquest_labs_v1", "moneyquest_entrepreneur_quest_v1", "moneyquest_leadership_quest_v1", "moneyquest_real_life_quests_v1"]) {
      try { window.localStorage.removeItem(key); } catch {}
    }
  }
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
    const sync = (event: Event) => setState(event instanceof CustomEvent ? event.detail : readFromStorage());
    window.addEventListener("moneyquest-progress", sync);
    window.addEventListener("storage", sync);
    return () => {window.removeEventListener("moneyquest-progress", sync);window.removeEventListener("storage", sync)};
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
      if(result.coinsAwarded>0 && typeof window!=="undefined")window.dispatchEvent(new CustomEvent("moneyquest-coin-award",{detail:{amount:result.coinsAwarded,currency:state.currencyCode}}));
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
