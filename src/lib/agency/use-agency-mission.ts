"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgeBand } from "@/types/database.types";
import { readBandScopedSlice, toBandScopedPayload } from "@/lib/band-scoped-storage";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import {
  availableChoices,
  decide as decidePure,
  requestRecovery as requestRecoveryPure,
  startMission,
  type Choice,
  type MissionDefinition,
  type MissionState,
} from "./engine";

/**
 * Agency's own storage key - entirely separate from
 * `moneyquest_local_progress_v1` (XP, wallet, certificates, badges) by
 * design: brief section 2/15, "Children must never lose previously
 * earned certificates, achievements or permanent progress because of
 * an unsuccessful simulation." A reset or a bad mission run can only
 * ever touch THIS key.
 *
 * Scoped per age band under that one key, same pattern as Leadership
 * Quest (see use-leadership-quest.ts and band-scoped-storage.ts) - a
 * mission run under one band must never leak into another's slice.
 *
 * Keyed by mission id WITHIN a band's slice (not one mission per key),
 * so a child's progress across several Agency missions in the same
 * band is one small object, not one storage key per mission.
 */
const STORAGE_KEY = "moneyquest_agency_v1";

type MissionsByIdState = Readonly<Record<string, MissionState>>;

function mergeDefaults(_defaults: MissionsByIdState, parsed: unknown): MissionsByIdState {
  // Defensive: a stored mission state's own shape is only trusted as
  // far as "an object keyed by mission id" - any per-mission entry
  // that doesn't look like a real MissionState (missing fields, wrong
  // types) is dropped rather than risking a crash reading corrupted
  // or out-of-date saved state (brief: "Corrupted or outdated saved
  // state is handled safely").
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const result: Record<string, MissionState> = {};
  for (const [missionId, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (isLikelyMissionState(value)) result[missionId] = value;
  }
  return result;
}

function isLikelyMissionState(value: unknown): value is MissionState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.missionId === "string" &&
    typeof v.currentNodeId === "string" &&
    typeof v.resources === "object" &&
    v.resources !== null &&
    Array.isArray(v.history) &&
    Array.isArray(v.pendingEffects) &&
    (v.status === "in-progress" || v.status === "completed" || v.status === "recovering") &&
    typeof v.stepCount === "number"
  );
}

function readFromStorage(band: AgeBand | null): MissionsByIdState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return readBandScopedSlice(parsed, band, () => ({}), mergeDefaults);
  } catch {
    return {};
  }
}

function writeToStorage(band: AgeBand | null, state: MissionsByIdState): void {
  if (typeof window === "undefined" || !band) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toBandScopedPayload(parsed, band, state)));
    window.dispatchEvent(new CustomEvent(STORAGE_KEY, { detail: { band, state } }));
  } catch {
    // Storage can fail (private browsing, quota, disabled) - keep
    // working in-memory for the rest of the session, same as every
    // other local-progress hook here.
  }
}

/** Clears ONLY this mission's saved state for the current band -
 * never touches any other mission's slice, any other band's slice, or
 * (by construction, since it's a different storage key entirely) any
 * educational achievement. This is the "reset experimental missions
 * without losing educational achievements" requirement, concretely. */
export function resetAgencyMission(band: AgeBand | null, missionId: string): void {
  if (typeof window === "undefined" || !band) return;
  const current = readFromStorage(band);
  const { [missionId]: _removed, ...rest } = current;
  writeToStorage(band, rest);
}

export function useAgencyMission(def: MissionDefinition) {
  const { state: localProgress, isLoaded: localProgressLoaded } = useLocalProgress();
  const band = localProgress.ageBand;
  const [missions, setMissions] = useState<MissionsByIdState>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const bandRef = useRef(band);

  useEffect(() => {
    if (!localProgressLoaded) return;
    bandRef.current = band;
    setMissions(readFromStorage(band));
    setIsLoaded(true);
  }, [band, localProgressLoaded]);

  useEffect(() => {
    const sync = (event: Event) => {
      const saved = (event as CustomEvent<{ band: AgeBand; state: MissionsByIdState }>).detail;
      if (saved.band !== band) return;
      setMissions(saved.state);
    };
    window.addEventListener(STORAGE_KEY, sync);
    return () => window.removeEventListener(STORAGE_KEY, sync);
  }, [band]);

  const persist = useCallback(
    (nextForMission: MissionState) => {
      setMissions((prev) => {
        const next = { ...prev, [def.id]: nextForMission };
        writeToStorage(bandRef.current, next);
        return next;
      });
    },
    [def.id]
  );

  const state: MissionState = missions[def.id] ?? startMission(def);

  const decide = useCallback((choiceId: string) => persist(decidePure(def, state, choiceId)), [def, state, persist]);

  const requestRecovery = useCallback(() => persist(requestRecoveryPure(def, state)), [def, state, persist]);

  const restart = useCallback(() => persist(startMission(def)), [def, persist]);

  const reset = useCallback(() => {
    resetAgencyMission(bandRef.current, def.id);
    setMissions((prev) => {
      const { [def.id]: _removed, ...rest } = prev;
      return rest;
    });
  }, [def.id]);

  const choices: ReadonlyArray<Choice & { readonly affordable: boolean }> = availableChoices(def, state);

  return { state, choices, isLoaded, decide, requestRecovery, restart, reset };
}
