"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Both preferences live in their own localStorage key, following the
 * exact same pattern as the sound-mute preference
 * (src/lib/audio/use-sound.ts) — a device/browser preference, kept
 * deliberately separate from moneyquest_local_progress_v1's learning
 * progress, guarded for SSR, wrapped in try/catch for private
 * browsing or a disabled/full storage quota.
 */
const PREFS_STORAGE_KEY = "moneyquest_accessibility_prefs_v1";

interface AccessibilityPrefs {
  reducedMotion: boolean;
  focusMode: boolean;
}

const DEFAULT_PREFS: AccessibilityPrefs = { reducedMotion: false, focusMode: false };

function readPrefsFromStorage(): AccessibilityPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      reducedMotion: Boolean(parsed.reducedMotion),
      focusMode: Boolean(parsed.focusMode),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefsToStorage(prefs: AccessibilityPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage can fail (private browsing, quota, disabled storage) —
    // the preference simply won't persist across visits in that case,
    // same graceful-degradation approach as sound and progress state.
  }
}

/**
 * The single hook every accessibility-aware component uses. Also
 * applies data-reduced-motion to <html> directly here (not left to
 * each consuming component to remember) — that attribute is what the
 * already-existing CSS in globals.css keys off of (see its own doc
 * comment there), so wiring it in one place means it's never possible
 * for a component to toggle the preference without the visual effect
 * actually applying app-wide, not just to whichever screen is open.
 */
export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = readPrefsFromStorage();
    setPrefs(loaded);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-reduced-motion", prefs.reducedMotion ? "true" : "false");
  }, [prefs.reducedMotion]);

  const toggleReducedMotion = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, reducedMotion: !prev.reducedMotion };
      writePrefsToStorage(next);
      return next;
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, focusMode: !prev.focusMode };
      writePrefsToStorage(next);
      return next;
    });
  }, []);

  return { ...prefs, isLoaded, toggleReducedMotion, toggleFocusMode };
}
