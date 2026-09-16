"use client";

import { useCallback, useState } from "react";

/**
 * Uses the browser's built-in Web Speech API (SpeechSynthesis) —
 * exactly like the sound system (src/lib/audio/sound-manager.ts) uses
 * the browser's built-in Web Audio API, no external service, no
 * account, nothing to load or fail to load. Same defensive posture
 * throughout: every call is wrapped so a browser without speech
 * support, or a device with no matching voice for the current
 * language, degrades to simply doing nothing — the lesson's text is
 * always fully readable on screen regardless, so read-aloud is
 * additive, never required to understand an activity.
 */
export function useReadAloud(uiLocale: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      try {
        window.speechSynthesis.cancel(); // one utterance at a time — a second tap restarts, it never queues up
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = uiLocale;
        utterance.rate = 0.95; // very slightly slower than default — easier for a child to follow, not so slow it drags
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [isSupported, uiLocale]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing to fall back to — stopping speech that already failed
      // to start is a no-op, not an error worth surfacing.
    }
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, stop };
}
