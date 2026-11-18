"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import type { AgeBand } from "@/types/database.types";
import { readBandScopedSlice, toBandScopedPayload } from "@/lib/band-scoped-storage";
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
 *
 * Scoped per age band under that one key (see band-scoped-storage.ts):
 * a child's Explorer business and Builder business are two completely
 * separate saves, and a legacy single-business save (from before this
 * change) is attributed to whichever band is active the first time it's
 * read, never silently duplicated across all three - see Issue #86.
 */
const STORAGE_KEY = "moneyquest_entrepreneur_quest_v1";

function mergeDefaults(defaults: EntrepreneurQuestState, parsed: unknown): EntrepreneurQuestState {
  const value = (parsed ?? {}) as Partial<EntrepreneurQuestState> & {business?: Record<string, unknown>; stats?: Record<string, unknown>};
  return {
    ...defaults,
    ...value,
    business: {
      ...defaults.business,
      ...value.business,
      logo: { ...defaults.business.logo, ...value.business?.logo },
    },
    stats: { ...defaults.stats, ...value.stats },
  };
}

function readFromStorage(band: AgeBand | null): EntrepreneurQuestState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return readBandScopedSlice(parsed, band, createDefaultState, mergeDefaults);
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(band: AgeBand | null, state: EntrepreneurQuestState): void {
  if (typeof window === "undefined" || !band) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toBandScopedPayload(parsed, band, state)));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — keep working in-memory for the rest of the session
    // rather than throw, matching use-local-progress.ts's own choice.
  }
}

export function resetEntrepreneurQuest(band: AgeBand | null): EntrepreneurQuestState {
  const fresh = createDefaultState();
  writeToStorage(band, fresh);
  return fresh;
}

export function useEntrepreneurQuest() {
  const { state: localProgress, isLoaded: localProgressLoaded } = useLocalProgress();
  const band = localProgress.ageBand;
  const [state, setState] = useState<EntrepreneurQuestState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);
  const latest = useRef(state);
  const bandRef = useRef(band);

  useEffect(() => {
    // Waiting for local-progress's OWN load matters, not just for a
    // correct first read: without it, this would read band=null first
    // (localProgress.ageBand defaults to null before ITS OWN mount
    // effect runs), flip isLoaded true on that wrong read, then read
    // again once the real band arrives - two reads, the first of which
    // a consumer could already have observed as "loaded" with default
    // data. That's exactly what made use-record-three-quest-completion's
    // legacy-vs-fresh distinction misfire: it saw isLoaded flip true
    // (with band=null's default pitchCompleted=false) before the real,
    // already-true value arrived, and read the second flip as a fresh
    // completion.
    if (!localProgressLoaded) return;
    bandRef.current = band;
    const restored = readFromStorage(band);
    latest.current = restored;
    setState(restored);
    setIsLoaded(true);
    // Re-reads whenever the family switches bands via the global level
    // selector (no page reload happens) - the other band's own saved
    // slice, not a blank state and not the band just left behind.
  }, [band, localProgressLoaded]);

  const persist = useCallback((change: (current: EntrepreneurQuestState) => EntrepreneurQuestState) => {
    const next = change(latest.current);
    latest.current = next;
    setState(next);
    writeToStorage(bandRef.current, next);
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
    const fresh = resetEntrepreneurQuest(bandRef.current);
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
