"use client";

import { ReadAloudControl } from "@/components/ui/ReadAloudButton";
import { useCallback, useEffect, useState } from "react";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

type Props = {
  /** All child-facing strings must be localized by the caller. */
  prompt: string;
  coinLabel: string;
  addLabel: string;
  removeLabel: string;
  replayLabel: string;
  checkLabel: string;
  successMessage: string;
  retryMessage: string;
  /** Small, concrete quantities only; this is counting, not currency valuation. */
  target: 1 | 2 | 3 | 4 | 5;
  onComplete?: () => void;
};

/**
 * Count equal-value pretend coins. Avoids confusing coin count with real
 * denomination value; real money values need a separate activity.
 * Child can use buttons, touch, or keyboard. Never requires reading.
 */
export function ExplorerCoinCount({
  prompt, coinLabel, addLabel, removeLabel, replayLabel, checkLabel,
  successMessage, retryMessage, target, onComplete,
}: Props) {
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);

  const speak = useCallback((message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = explorerSpeechLang();
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const adjust = (next: number) => {
    if (done) return;
    const bounded = Math.min(5, Math.max(0, next));
    setCount(bounded);
    setFeedback("");
    speak(String(bounded));
  };

  const check = () => {
    if (done) return;
    const correct = count === target;
    const message = correct ? successMessage : retryMessage;
    setFeedback(message);
    speak(message);
    if (correct) {
      setDone(true);
      onComplete?.();
    }
  };

  return (
    <section data-explorer-coin-count className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="text-xl font-bold">{prompt}</h2>
      <ReadAloudControl label={replayLabel} onClick={() => speak(prompt)} className="my-4" />
      <div aria-label={coinLabel} className="flex min-h-28 flex-wrap items-center justify-center gap-3 rounded-2xl bg-cream p-4">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} role="img" aria-label={coinLabel} className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-700 bg-amber-300 text-3xl text-amber-950 shadow-sm">
            <span aria-hidden="true">●</span>
          </span>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 text-center text-2xl font-bold">{count}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => adjust(count - 1)} disabled={count === 0 || done}
          className="min-h-16 rounded-2xl border-2 border-teal px-4 py-3 text-xl font-bold disabled:opacity-40">
          <span aria-hidden="true">− </span>{removeLabel}
        </button>
        <button type="button" onClick={() => adjust(count + 1)} disabled={count === 5 || done}
          className="min-h-16 rounded-2xl border-2 border-teal px-4 py-3 text-xl font-bold disabled:opacity-40">
          <span aria-hidden="true">+ </span>{addLabel}
        </button>
      </div>
      <button type="button" onClick={check} disabled={done}
        className="mt-4 min-h-14 w-full rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:opacity-60">
        {checkLabel}
      </button>
      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
    </section>
  );
}
