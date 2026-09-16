import type { AgeBand } from "@/types/database.types";

/**
 * Pure state-transition logic for the entirely local, on-device
 * progress model that replaces every server-side table the old
 * architecture used for a child's XP, wallet, goals, and badges (see
 * docs/data-flow-inventory-pre-redesign.md). Nothing in this file
 * touches `localStorage` directly — see local-progress-storage.ts for
 * the thin read/write wrapper — so every rule here is testable without
 * a browser environment.
 *
 * A genuine improvement made possible by rebuilding this from scratch:
 * the old server-side XP system awarded XP on activity completion, not
 * gated on correctness (a real, documented design debt from
 * money-quest-gamification-ethics.md — badges were the workaround
 * since the core XP RPC couldn't safely be changed without touching
 * every dependent system). Rebuilding locally has no such legacy
 * constraint: XP and coins here are only ever awarded when
 * `wasCorrect` is true, from the very first line of this file.
 */
export interface LocalGoal {
  id: string;
  name: string;
  targetMinorUnits: number;
  currentMinorUnits: number;
  achievedAt: string | null;
}

export interface LocalProgressState {
  ageBand: AgeBand | null;
  currencyCode: string;
  xpTotal: number;
  walletBalanceMinorUnits: number;
  completedActivityIds: string[];
  goals: LocalGoal[];
  earnedBadgeIds: string[];
}

export function createDefaultState(): LocalProgressState {
  return {
    ageBand: null,
    currencyCode: "GBP",
    xpTotal: 0,
    walletBalanceMinorUnits: 0,
    completedActivityIds: [],
    goals: [],
    earnedBadgeIds: [],
  };
}

export function computeLevel(xpTotal: number): number {
  return Math.floor(xpTotal / 100) + 1;
}

export interface CompletionResult {
  state: LocalProgressState;
  xpAwarded: number;
  coinsAwarded: number;
  wasFirstCompletion: boolean;
}

/**
 * Records an activity completion. XP/coins are only ever awarded when
 * `wasCorrect` is true, and only on the FIRST correct completion of a
 * given activity — replaying an already-completed activity earns
 * nothing further, matching the old system's anti-farming rule.
 */
export function applyActivityCompletion(
  state: LocalProgressState,
  activityId: string,
  wasCorrect: boolean,
  xpReward: number,
  coinRewardMinorUnits: number
): CompletionResult {
  const wasFirstCompletion = !state.completedActivityIds.includes(activityId);

  if (!wasCorrect || !wasFirstCompletion) {
    return { state, xpAwarded: 0, coinsAwarded: 0, wasFirstCompletion: wasFirstCompletion && !wasCorrect };
  }

  return {
    state: {
      ...state,
      xpTotal: state.xpTotal + xpReward,
      walletBalanceMinorUnits: state.walletBalanceMinorUnits + coinRewardMinorUnits,
      completedActivityIds: [...state.completedActivityIds, activityId],
    },
    xpAwarded: xpReward,
    coinsAwarded: coinRewardMinorUnits,
    wasFirstCompletion: true,
  };
}

export function createGoal(state: LocalProgressState, name: string, targetMinorUnits: number): LocalProgressState {
  const goal: LocalGoal = {
    id: `goal-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    name,
    targetMinorUnits,
    currentMinorUnits: 0,
    achievedAt: null,
  };
  return { ...state, goals: [...state.goals, goal] };
}

export interface ContributeResult {
  state: LocalProgressState;
  success: boolean;
  goalAchieved: boolean;
}

export function contributeToGoal(state: LocalProgressState, goalId: string, amountMinorUnits: number): ContributeResult {
  if (amountMinorUnits <= 0 || amountMinorUnits > state.walletBalanceMinorUnits) {
    return { state, success: false, goalAchieved: false };
  }

  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal || goal.achievedAt) {
    return { state, success: false, goalAchieved: false };
  }

  const newCurrent = goal.currentMinorUnits + amountMinorUnits;
  const goalAchieved = newCurrent >= goal.targetMinorUnits;

  const updatedGoals = state.goals.map((g) =>
    g.id === goalId ? { ...g, currentMinorUnits: newCurrent, achievedAt: goalAchieved ? new Date().toISOString() : null } : g
  );

  return {
    state: {
      ...state,
      walletBalanceMinorUnits: state.walletBalanceMinorUnits - amountMinorUnits,
      goals: updatedGoals,
    },
    success: true,
    goalAchieved,
  };
}

export function removeGoal(state: LocalProgressState, goalId: string): LocalProgressState {
  return { ...state, goals: state.goals.filter((g) => g.id !== goalId) };
}

/**
 * The reverse of contributeToGoal — moves money back from a goal into
 * the wallet. Exists specifically for the Savings Goal Adventure's
 * "what happens if I spend some of what I've saved?" experimentation
 * (see the Goals page), not as a general undo — a child trying this
 * out should see their own goal's progress bar move backward and the
 * projected time-to-goal grow, which is the actual lesson, not just a
 * button that reverses a mistake.
 */
export function withdrawFromGoal(state: LocalProgressState, goalId: string, amountMinorUnits: number): ContributeResult {
  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal || goal.achievedAt || amountMinorUnits <= 0 || amountMinorUnits > goal.currentMinorUnits) {
    return { state, success: false, goalAchieved: false };
  }

  const newCurrent = goal.currentMinorUnits - amountMinorUnits;
  const updatedGoals = state.goals.map((g) => (g.id === goalId ? { ...g, currentMinorUnits: newCurrent } : g));

  return {
    state: {
      ...state,
      walletBalanceMinorUnits: state.walletBalanceMinorUnits + amountMinorUnits,
      goals: updatedGoals,
    },
    success: true,
    goalAchieved: false,
  };
}

/**
 * A pure calculation, deliberately separate from any state mutation —
 * the Goals page calls this on every keystroke while a child
 * experiments with a hypothetical weekly saving rate, so it needs to
 * be cheap and side-effect-free. Returns null when the rate is zero or
 * negative (an undefined "how long," not zero weeks) rather than
 * Infinity, so the UI never has to special-case a non-finite number.
 */
export function computeWeeksToGoal(remainingMinorUnits: number, weeklyRateMinorUnits: number): number | null {
  if (weeklyRateMinorUnits <= 0) return null;
  if (remainingMinorUnits <= 0) return 0;
  return Math.ceil(remainingMinorUnits / weeklyRateMinorUnits);
}
