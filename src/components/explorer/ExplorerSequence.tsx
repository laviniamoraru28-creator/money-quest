"use client";

import { useCallback, useEffect, useState } from "react";
import { useTapOrDrag } from "@/lib/explorer/use-tap-or-drag";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

export type ExplorerSequenceStep = {
  id: string;
  symbol: string;
  label: string;
  /** 0-based correct position in the finished sequence. */
  order: number;
};

type Props = {
  prompt: string;
  steps: readonly ExplorerSequenceStep[];
  replayLabel: string;
  tryAgainMessage: string;
  successMessage: string;
  onComplete?: () => void;
};

/**
 * Tap-first (with drag reorder as an enhancement) step-ordering activity:
 * "put these in the right order" — used for a financial plan's steps and
 * for a plant-growth patience sequence. Steps start shuffled; tapping one
 * places it in the next open slot only if it is the correct next step,
 * otherwise gentle retry feedback — this keeps the activity an "order
 * recognition" check rather than a free rearrange-then-submit puzzle,
 * which stays closer to a 6-8-year-old's working-memory span.
 */
export function ExplorerSequence({
  prompt, steps, replayLabel, tryAgainMessage, successMessage, onComplete,
}: Props) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const { dragSource, dropTarget } = useTapOrDrag<string>();
  const ordered = [...steps].sort((a, b) => a.order - b.order);
  const nextStep = ordered[placed.length];

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

  const tryPlace = (id: string) => {
    if (finished || !nextStep) return;
    if (id !== nextStep.id) {
      setFeedback(tryAgainMessage);
      speak(tryAgainMessage);
      return;
    }
    const next = [...placed, id];
    setPlaced(next);
    const done = next.length === ordered.length;
    const message = done ? successMessage : nextStep.label;
    setFeedback(message);
    speak(message);
    if (done) {
      setFinished(true);
      onComplete?.();
    }
  };

  return (
    <section data-explorer-sequence className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="text-xl font-bold">{prompt}</h2>
      <button type="button" onClick={() => speak(prompt)}
        className="my-4 min-h-12 rounded-xl border-2 border-teal px-5 py-3 font-bold">
        <span aria-hidden="true">🔊 </span>{replayLabel}
      </button>

      <ol className="flex flex-wrap items-center gap-2" aria-label={prompt}>
        {ordered.map((step, index) => {
          const isPlaced = index < placed.length;
          return (
            <li key={step.id} className="contents">
              <div
                aria-label={isPlaced ? step.label : undefined}
                aria-hidden={!isPlaced}
                {...(index === placed.length ? dropTarget(tryPlace) : {})}
                className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 text-center ${isPlaced ? "border-emerald-400 bg-emerald-50" : "border-dashed border-teal/40 bg-fog"}`}
              >
                {isPlaced && <span aria-hidden="true" className="text-3xl">{step.symbol}</span>}
              </div>
              {index < ordered.length - 1 && <span aria-hidden="true" className="text-teal/50">→</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        {ordered.filter(step => !placed.includes(step.id)).map(step => (
          <button type="button" key={step.id}
            onClick={() => tryPlace(step.id)}
            {...dragSource(step.id)}
            aria-label={step.label}
            className="flex min-h-24 w-24 cursor-grab flex-col items-center justify-center gap-1 rounded-2xl border-2 border-teal/30 p-2 font-semibold text-indigo-900 active:cursor-grabbing focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
            <span aria-hidden="true" className="text-4xl">{step.symbol}</span>
            <span className="text-xs">{step.label}</span>
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
      <progress aria-label={prompt} value={placed.length} max={ordered.length} className="w-full" />
    </section>
  );
}
