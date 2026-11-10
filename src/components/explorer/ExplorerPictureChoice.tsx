"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ExplorerPictureOption = {
  id: string;
  label: string;
  symbol: string;
  explanation: string;
};

type Props = {
  prompt: string;
  options: readonly ExplorerPictureOption[];
  correctId: string;
  successMessage: string;
  retryMessage: string;
  replayLabel: string;
  nextLabel: string;
  onComplete?: () => void;
};

/**
 * A pre-reader-friendly choice activity. Parent provides fully localized copy.
 * No images or emoji alone convey correctness; spoken labels are included.
 * No autoplay: speech starts only on the child's Replay action.
 */
export function ExplorerPictureChoice({
  prompt, options, correctId, successMessage, retryMessage,
  replayLabel, nextLabel, onComplete,
}: Props) {
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const correct = choice === correctId;
  const feedback = choice === null ? "" : correct ? successMessage : retryMessage;

  const speak = useCallback((message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const next = new SpeechSynthesisUtterance(message);
    next.lang = document.documentElement.lang || "en";
    utterance.current = next;
    window.speechSynthesis.speak(next);
  }, []);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const choose = (id: string) => {
    if (completed) return;
    setChoice(id);
    speak(id === correctId ? successMessage : retryMessage);
  };

  const finish = () => {
    if (!correct || completed) return;
    setCompleted(true);
    onComplete?.();
  };

  return (
    <section aria-label={prompt} className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6" data-explorer-picture-choice>
      <p className="mb-4 text-xl font-bold">{prompt}</p>
      <button type="button" onClick={() => speak(prompt)}
        className="mb-5 min-h-12 rounded-xl border-2 border-teal px-5 py-3 font-bold">
        <span aria-hidden="true">🔊 </span>{replayLabel}
      </button>
      <div className="grid grid-cols-2 gap-4">
        {options.map(option => (
          <button type="button" key={option.id}
            onClick={() => choose(option.id)}
            disabled={completed}
            aria-pressed={choice === option.id}
            aria-label={option.label}
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal/30 p-4 text-center focus-visible:outline-4 aria-pressed:border-teal aria-pressed:bg-teal/10 disabled:opacity-80">
            <span className="text-5xl" aria-hidden="true">{option.symbol}</span>
            <span className="text-lg font-semibold">{option.label}</span>
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 min-h-12 text-lg">
        {feedback}
      </div>
      {correct && !completed && (
        <button type="button" onClick={finish}
          className="min-h-12 rounded-xl bg-teal px-6 py-3 font-bold text-white">
          {nextLabel}
        </button>
      )}
    </section>
  );
}
