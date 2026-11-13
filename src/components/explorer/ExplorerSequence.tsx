"use client";

import {useState} from "react";
import { useTapOrDrag } from "@/lib/explorer/use-tap-or-drag";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
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
  nextLabel: string;
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
  prompt, steps, nextLabel, tryAgainMessage, successMessage, onComplete,
}: Props) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const { dragSource, dropTarget } = useTapOrDrag<string>();
  const ordered = [...steps].sort((a, b) => a.order - b.order);
  const nextStep = ordered[placed.length];



  const tryPlace = (id: string) => {
    if (finished || !nextStep) return;
    if (id !== nextStep.id) {
      setFeedback(tryAgainMessage);
      return;
    }
    const next = [...placed, id];
    setPlaced(next);
    const done = next.length === ordered.length;
    const message = done ? successMessage : nextStep.label;
    setFeedback(message);
    if (done) {
      setFinished(true);
    }
  };

  return (
    <section data-explorer-sequence className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="break-words text-[1.25rem] font-bold leading-snug sm:text-lg">{prompt}</h2>
      <ReadAloudButton text={feedback || prompt} uiLocale={explorerSpeechLang()} />

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
            className="flex min-h-24 w-24 cursor-grab flex-col items-center justify-center gap-1 rounded-2xl border-2 border-teal/30 p-2 font-semibold text-ink active:cursor-grabbing focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
            <span aria-hidden="true" className="text-4xl">{step.symbol}</span>
            <span className="text-xs"><span className="answer-label">{step.label}</span></span>
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
      <progress aria-label={prompt} value={placed.length} max={ordered.length} className="w-full" />
      {finished && onComplete && <button type="button" onClick={onComplete} className="mt-3 min-h-12 w-full rounded-full bg-teal px-4 py-3 text-base font-bold text-white">{nextLabel}</button>}
    </section>
  );
}
