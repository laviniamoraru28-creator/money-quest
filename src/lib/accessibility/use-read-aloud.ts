"use client";

import { useCallback, useState, useEffect } from "react";
import {speechChunks} from "./speech-chunks";
let speechSession = 0;

/**
 * Uses the browser's built-in Web Speech API (SpeechSynthesis) —
 * exactly like the sound system (src/lib/audio/sound-manager.ts) uses
 * the browser's built-in Web Audio API, no new website API or
 * account. Voice availability and any voice network use depend on the browser/OS. Same defensive posture
 * throughout: every call is wrapped so a browser without speech
 * support, or a device with no matching voice for the current
 * language, degrades to simply doing nothing — the lesson's text is
 * always fully readable on screen regardless, so read-aloud is
 * additive, never required to understand an activity.
 */
export function useReadAloud(uiLocale: string, localOnly = false) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isSupported, setIsSupported] = useState(false);
  const localVoice = useCallback(() => {
    const language = uiLocale.toLowerCase();
    const voices = window.speechSynthesis?.getVoices().filter((voice) => voice.localService) ?? [];
    return voices.find((voice) => voice.lang.toLowerCase() === language) ??
      voices.find((voice) => voice.lang.toLowerCase().split("-")[0] === language.split("-")[0]);
  }, [uiLocale]);
  useEffect(() => {
    const update = () => setIsSupported("speechSynthesis" in window && (!localOnly || !!localVoice()));
    update();
    if (localOnly) window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () => {
      if (localOnly) window.speechSynthesis?.removeEventListener("voiceschanged", update);
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, [localOnly, localVoice]);
  useEffect(() => { setIsSpeaking(false); try { window.speechSynthesis?.cancel(); } catch {} }, [uiLocale]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      try {
        const voice = localOnly ? localVoice() : undefined;
        if (localOnly && !voice) return;
        window.dispatchEvent(new Event("moneyquest-stop-audio"));
        const session = ++speechSession;
        window.speechSynthesis.cancel();
        const chunks = speechChunks(text);
        let index = 0;
        const readNext = () => {
          if (session !== speechSession) { setIsSpeaking(false); return; }
          const chunk = chunks[index++];
          if (!chunk) { setIsSpeaking(false); return; }
          try {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.lang = uiLocale;
            if (voice) utterance.voice = voice;
            utterance.rate = 0.95;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = readNext;
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          } catch { setIsSpeaking(false); }
        };
        readNext();
      } catch {
        setIsSpeaking(false);
      }
    },
    [isSupported, localOnly, localVoice, uiLocale]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    ++speechSession;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing to fall back to — stopping speech that already failed
      // to start is a no-op, not an error worth surfacing.
    }
    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => {
    window.addEventListener("moneyquest-stop-speech", stop);
    return () => window.removeEventListener("moneyquest-stop-speech", stop);
  }, [stop]);

  return { isSupported, isSpeaking, speak, stop };
}
