"use client";

import { useCallback, useEffect, useState } from "react";
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
 */
const STORAGE_KEY = "moneyquest_leadership_quest_v1";

function readFromStorage(): LeadershipQuestState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const defaults = createDefaultState();
    return {
      ...defaults,
      ...parsed,
      team: { ...defaults.team, ...parsed.team },
    };
  } catch {
    return createDefaultState();
  }
}

function writeToStorage(state: LeadershipQuestState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) — keep working in-memory for the rest of the session
    // rather than throw, matching every other local-progress hook here.
  }
}

export function resetLeadershipQuest(): LeadershipQuestState {
  const fresh = createDefaultState();
  writeToStorage(fresh);
  return fresh;
}

export function useLeadershipQuest() {
  const [state, setState] = useState<LeadershipQuestState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: LeadershipQuestState) => {
    setState(next);
    writeToStorage(next);
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
    const fresh = resetLeadershipQuest();
    setState(fresh);
  }, []);

  return { state, isLoaded, recordChoice, completeMission, completeLabScenario, markUhOhSeen, resetQuest };
}
