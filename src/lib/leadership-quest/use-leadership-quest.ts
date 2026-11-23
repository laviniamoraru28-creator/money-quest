"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import type { AgeBand } from "@/types/database.types";
import { readBandScopedSlice, toBandScopedPayload } from "@/lib/band-scoped-storage";
import {
  createDefaultState,
  recordChoice as recordChoicePure,
  completeMission as completeMissionPure,
  completeLabScenario as completeLabScenarioPure,
  markUhOhSeen as markUhOhSeenPure,
  type LeadershipQuestState,
} from "./state";

/**
 * The Leadership Quest mirror of use-entrepreneur-quest.ts — same
 * pattern (pure state module + thin localStorage-backed hook), its own
 * storage key so nothing here can ever touch Entrepreneur Quest's or the
 * shared wallet's saved data (brief section 2/15).
 *
 * Scoped per age band under that one key, same as Entrepreneur Quest -
 * see use-entrepreneur-quest.ts's own comment and band-scoped-storage.ts
 * for why (Issue #86: a band's Leadership Quest completion must never
 * silently also complete it for the other two bands).
 */
const STORAGE_KEY = "moneyquest_leadership_quest_v1";

function mergeDefaults(defaults: LeadershipQuestState, parsed: unknown): LeadershipQuestState {
  const value = (parsed ?? {}) as Partial<LeadershipQuestState> & {team?: Record<string, unknown>};
  return { ...defaults, ...value, team: { ...defaults.team, ...value.team } };
}

function readFromStorage(band: AgeBand | null): LeadershipQuestState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return readBandScopedSlice(parsed, band, createDefaultState, mergeDefaults);
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(band: AgeBand | null, state: LeadershipQuestState): void {
  if (typeof window === "undefined" || !band) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const previous=readBandScopedSlice(parsed,band,createDefaultState,mergeDefaults);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toBandScopedPayload(parsed, band, state)));
    window.dispatchEvent(new CustomEvent(STORAGE_KEY,{detail:{band,state}}));
    if (!previous.completedMissionIds.includes("final-challenge") && state.completedMissionIds.includes("final-challenge")) window.dispatchEvent(new CustomEvent("moneyquest-quest-complete",{detail:"leadership"}));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — keep working in-memory for the rest of the session
    // rather than throw, matching every other local-progress hook here.
  }
}

export function resetLeadershipQuest(band: AgeBand | null): LeadershipQuestState {
  const fresh = createDefaultState();
  writeToStorage(band, fresh);
  return fresh;
}

export function useLeadershipQuest() {
  const { state: localProgress, isLoaded: localProgressLoaded } = useLocalProgress();
  const band = localProgress.ageBand;
  const [state, setState] = useState<LeadershipQuestState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);
  const bandRef = useRef(band);

  useEffect(() => {
    // See use-entrepreneur-quest.ts's own version of this same guard for
    // why: without it, this flips isLoaded true once on a transient
    // band=null read, before local-progress's real band has loaded.
    if (!localProgressLoaded) return;
    bandRef.current = band;
    setState(readFromStorage(band));
    setIsLoaded(true);
    // Re-reads on a band switch (no page reload) - that band's own save.
  }, [band, localProgressLoaded]);

  useEffect(()=>{
    const sync=(event:Event)=>{
      const saved=(event as CustomEvent<{band:AgeBand;state:LeadershipQuestState}>).detail;
      if(saved.band!==band)return;

      setState(saved.state);
    };
    window.addEventListener(STORAGE_KEY,sync);
    return ()=>window.removeEventListener(STORAGE_KEY,sync);
  },[band]);

  const persist = useCallback((next: LeadershipQuestState) => {
    setState(next);
    writeToStorage(bandRef.current, next);
  }, []);

  const recordChoice = useCallback(
    (eventId: string, choiceKey: string) => {
      persist(recordChoicePure(state, eventId, choiceKey));
    },
    [state, persist]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      persist(completeMissionPure(state, missionId));
    },
    [state, persist]
  );

  const completeLabScenario = useCallback(
    (scenarioId: string) => {
      persist(completeLabScenarioPure(state, scenarioId));
    },
    [state, persist]
  );

  const markUhOhSeen = useCallback(
    (uhOhId: string) => {
      persist(markUhOhSeenPure(state, uhOhId));
    },
    [state, persist]
  );

  const resetQuest = useCallback(() => {
    const fresh = resetLeadershipQuest(bandRef.current);
    setState(fresh);
  }, []);

  return { state, isLoaded, recordChoice, completeMission, completeLabScenario, markUhOhSeen, resetQuest };
}
