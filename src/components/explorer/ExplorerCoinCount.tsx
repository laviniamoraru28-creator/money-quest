"use client";

import {useState} from "react";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

type Props = {
  /** All child-facing strings must be localized by the caller. */
  prompt: string;
  coinLabel: string;
  addLabel: string;
  removeLabel: string;
  checkLabel: string;
  nextLabel: string;
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
  prompt, coinLabel, addLabel, removeLabel, checkLabel, nextLabel,
  successMessage, retryMessage, target, onComplete,
}: Props) {
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);



  const adjust = (next: number) => {
    if (done) return;
    const bounded = Math.min(5, Math.max(0, next));
    setCount(bounded);
    setFeedback("");
  };

  const check = () => {
    if (done) return;
    const correct = count === target;
    const message = correct ? successMessage : retryMessage;
    setFeedback(message);
    if (correct) {
      setDone(true);
    }
  };

  return (
    <section data-explorer-coin-count className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="break-words text-[1.25rem] font-bold leading-snug sm:text-lg">{prompt}</h2>
      <ReadAloudButton text={feedback || prompt} uiLocale={explorerSpeechLang()} />
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
          className="min-h-16 rounded-2xl border-2 border-teal min-w-0 break-words px-2 py-3 text-md font-bold disabled:opacity-40">
          <span aria-hidden="true">− </span>{removeLabel}
        </button>
        <button type="button" onClick={() => adjust(count + 1)} disabled={count === 5 || done}
          className="min-h-16 rounded-2xl border-2 border-teal min-w-0 break-words px-2 py-3 text-md font-bold disabled:opacity-40">
          <span aria-hidden="true">+ </span>{addLabel}
        </button>
      </div>
      <button type="button" onClick={check} disabled={done}
        className="mt-4 min-h-14 w-full rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:opacity-60">
        {checkLabel}
      </button>
      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
      {done && onComplete && <button type="button" onClick={onComplete} className="mt-3 min-h-12 w-full rounded-full bg-teal px-4 py-3 text-base font-bold text-white">{nextLabel}</button>}
    </section>
  );
}
