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
  nightView: boolean;
  imageSize: "full" | "small" | "minimal";
  textSize: "normal" | "large" | "extra";
  highContrast: boolean;
}

const DEFAULT_PREFS: AccessibilityPrefs = { reducedMotion: false, focusMode: false, nightView: false, imageSize: "full", textSize: "normal", highContrast: false };

function readPrefsFromStorage(): AccessibilityPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      reducedMotion: Boolean(parsed.reducedMotion),
      focusMode: Boolean(parsed.focusMode),
      nightView: Boolean(parsed.nightView),
      imageSize: ["full","small","minimal"].includes(parsed.imageSize) ? parsed.imageSize : "full",
      textSize: ["normal","large","extra"].includes(parsed.textSize) ? parsed.textSize : "normal",
      highContrast: Boolean(parsed.highContrast),
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
    const sync = (event: Event) => setPrefs(event instanceof CustomEvent ? event.detail : readPrefsFromStorage());
    window.addEventListener("moneyquest-prefs", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("moneyquest-prefs", sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !isLoaded) return;
    document.documentElement.setAttribute("data-reduced-motion", prefs.reducedMotion ? "true" : "false");
    document.documentElement.setAttribute("data-focus-mode", prefs.focusMode ? "true" : "false");
    document.documentElement.setAttribute("data-night-view", prefs.nightView ? "true" : "false");
    document.documentElement.setAttribute("data-image-size", prefs.imageSize);
    document.documentElement.setAttribute("data-text-size", prefs.textSize);
    document.documentElement.setAttribute("data-high-contrast", prefs.highContrast ? "true" : "false");
  }, [prefs, isLoaded]);

  const setPreference = useCallback(<K extends keyof AccessibilityPrefs>(key: K, value: AccessibilityPrefs[K]) => {
    setPrefs(previous => {
      const next = { ...previous, [key]: value };
      writePrefsToStorage(next);
      window.dispatchEvent(new CustomEvent("moneyquest-prefs", {detail: next}));
      return next;
    });
  }, []);
  const update = useCallback((key: "reducedMotion" | "focusMode" | "nightView" | "highContrast") => {
    setPreference(key, !prefs[key]);
  }, [prefs, setPreference]);
  const toggleReducedMotion = useCallback(() => update("reducedMotion"), [update]);
  const toggleFocusMode = useCallback(() => update("focusMode"), [update]);
  const toggleNightView = useCallback(() => update("nightView"), [update]);
  const resetPreferences = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    writePrefsToStorage(DEFAULT_PREFS);
    window.dispatchEvent(new CustomEvent("moneyquest-prefs", {detail: DEFAULT_PREFS}));
  }, []);
  return { ...prefs, isLoaded, toggleReducedMotion, toggleFocusMode, toggleNightView, setPreference, resetPreferences };
}
