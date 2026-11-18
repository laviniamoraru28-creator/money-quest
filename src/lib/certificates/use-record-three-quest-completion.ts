"use client";
import { useEffect, useRef } from "react";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import type { AgeBand } from "@/types/database.types";

/**
 * Records the three-quest certificate date for `band` the moment
 * `ready` is FIRST observed to transition from not-ready to ready
 * during THIS mount - never on a mount that starts already ready.
 *
 * That distinction matters: a family who had Money Quest, Entrepreneur
 * Quest and Leadership Quest all done before this feature shipped
 * would otherwise get today's date stamped the first time they open
 * any page that mounts this - which is exactly the "invents a
 * completion date" bug the existing MQ-only certificateCompletionDates
 * field was already built to avoid (see its own "legacy completion
 * never invents a completion or download date" test). A genuinely
 * fresh completion - the family finishes the last of the three quests
 * while a page using this hook happens to be open - DOES still get
 * recorded, since `ready` visibly flips from false to true in front of
 * this hook rather than starting true.
 *
 * Tracked per band (not a single flag) so switching the selected band
 * mid-session is judged independently for each one.
 *
 * `loaded` must reflect every piece of state `ready` depends on having
 * actually finished its own async localStorage read (MQ, EQ and LQ
 * each have one) - NOT just whether this hook has rendered once. Every
 * one of those hooks is false→true itself right after mount, before
 * any of them have read real data; treating that transient "not ready
 * because not loaded yet" as a genuine not-ready observation caused
 * this hook to then read the very next render's `ready=true` (as soon
 * as loading finished) as a "fresh" transition and stamp a fake date
 * for exactly the legacy case this is meant to rule out.
 */
export function useRecordThreeQuestCompletion(band: AgeBand | null, ready: boolean, loaded: boolean): void {
  const { state, recordThreeQuestCompletion } = useLocalProgress();
  const seenNotReady = useRef<Partial<Record<AgeBand, boolean>>>({});

  useEffect(() => {
    if (!band || !loaded) return;
    if (!ready) {
      seenNotReady.current[band] = true;
      return;
    }
    if (seenNotReady.current[band] && !state.threeQuestCertificateDates[band]) {
      recordThreeQuestCompletion(band);
    }
  }, [band, ready, loaded, state.threeQuestCertificateDates, recordThreeQuestCompletion]);
}
