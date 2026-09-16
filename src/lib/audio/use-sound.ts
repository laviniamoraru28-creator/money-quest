"use client";

import { useCallback, useEffect, useState } from "react";
import { playCorrectSound, playIncorrectSound, playCompleteSound, playGoalReachedSound } from "./sound-manager";

/**
 * The mute preference lives in its own localStorage key, deliberately
 * separate from moneyquest_local_progress_v1 (src/lib/local-progress/)
 * — it's a device/browser preference, not learning progress, and
 * keeping it out of the progress reducer means this feature can never
 * accidentally affect progress state or vice versa. Same
 * read/write-defensively pattern as local-progress's own storage
 * functions (guarded for SSR, wrapped in try/catch for private
 * browsing or a full/disabled storage quota).
 */
const MUTE_STORAGE_KEY = "moneyquest_sound_muted_v1";

function readMutedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMutedToStorage(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // Storage can fail (private browsing, quota, disabled storage) —
    // sound simply won't remember the preference across visits in
    // that case, same graceful-degradation approach as everywhere
    // else in this app that touches localStorage.
  }
}

/**
 * The single hook every sound-playing component uses — both for
 * reading/toggling the mute preference and for playing a sound, so
 * "is the user muted" is checked in exactly one place, never
 * duplicated at each call site.
 */
export function useSound() {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsMuted(readMutedFromStorage());
    setIsLoaded(true);
  }, []);

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      writeMutedToStorage(next);
      return next;
    });
  }, []);

  const playCorrect = useCallback(() => {
    if (!isMuted) playCorrectSound();
  }, [isMuted]);

  const playIncorrect = useCallback(() => {
    if (!isMuted) playIncorrectSound();
  }, [isMuted]);

  const playComplete = useCallback(() => {
    if (!isMuted) playCompleteSound();
  }, [isMuted]);

  const playGoalReached = useCallback(() => {
    if (!isMuted) playGoalReachedSound();
  }, [isMuted]);

  return { isMuted, isLoaded, toggleMuted, playCorrect, playIncorrect, playComplete, playGoalReached };
}
