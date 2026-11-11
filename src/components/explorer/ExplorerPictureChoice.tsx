"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReadAloudControl } from "@/components/ui/ReadAloudButton";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

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
    next.lang = explorerSpeechLang();
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
    <section role="group" aria-label={prompt} className="overflow-hidden rounded-[2rem] border-2 border-sky-200 bg-gradient-to-b from-sky-100 via-white to-amber-50 p-4 shadow-xl md:p-7" data-explorer-picture-choice>
      <p className="mb-4 rounded-2xl bg-white/90 p-4 text-center font-display text-2xl font-extrabold text-teal-text shadow-sm">{prompt}</p>
      <ReadAloudControl label={replayLabel} onClick={() => speak(prompt)} className="mb-5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map(option => (
          <button type="button" key={option.id}
            onClick={() => choose(option.id)}
            disabled={completed}
            aria-pressed={choice === option.id}
            aria-label={option.label}
            className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-3xl border-4 border-white bg-gradient-to-b from-white to-cyan-50 p-5 text-center shadow-md transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal aria-pressed:border-teal aria-pressed:from-teal/10 aria-pressed:to-teal/10 disabled:opacity-80 motion-reduce:transform-none">
            <span className="text-7xl sm:text-8xl" aria-hidden="true">{option.symbol}</span>
            <span className="text-xl font-extrabold text-teal-text">{option.label}</span>
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 min-h-12 rounded-xl bg-white/80 p-3 text-center text-lg font-bold text-teal-text">
        {feedback}
      </div>
      {correct && !completed && (
        <Button type="button" variant="quest-primary" size="large" onClick={finish}>
          {nextLabel}
        </Button>
      )}
    </section>
  );
}
