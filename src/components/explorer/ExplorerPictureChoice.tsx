"use client";

import {useState} from "react";
import {useAnswerOrder} from "@/lib/answer-order";
import {ExplorerPicture} from "./ExplorerPicture";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
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
  nextLabel: string;
  onComplete?: () => void;
  completeOnCorrect?: boolean;
};

/**
 * A pre-reader-friendly choice activity. Parent provides fully localized copy.
 * No images or emoji alone convey correctness; spoken labels are included.
 * No autoplay: speech starts only on the child's Replay action.
 */
export function ExplorerPictureChoice({
  prompt, options, correctId, successMessage, retryMessage,
  nextLabel, onComplete, completeOnCorrect = false,
}: Props) {
  const displayOptions = useAnswerOrder(options);
  const [choice, setChoice] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const correct = choice === correctId;
  const feedback = choice === null ? "" : correct ? successMessage : retryMessage;



  const choose = (id: string) => {
    if (completed) return;
    setChoice(id);
    if (id === correctId && completeOnCorrect) {
      setCompleted(true);
      onComplete?.();
    }
  };

  const finish = () => {
    if (!correct || completed) return;
    setCompleted(true);
    onComplete?.();
  };

  return (
    <section role="group" aria-label={prompt} className="overflow-hidden rounded-[2rem] border-2 border-soft-blue/50 bg-gradient-to-b from-soft-blue/20 via-white to-coral/10 p-4 shadow-xl md:p-7" data-explorer-picture-choice>
      <p className="mb-4 rounded-2xl bg-white/90 break-words px-3 py-3 text-center font-display text-[1.25rem] font-extrabold leading-snug sm:text-lg text-ink shadow-sm">{prompt}</p>
      <ReadAloudButton text={feedback || [prompt, ...displayOptions.map(option => option.label)].join(" ")} uiLocale={explorerSpeechLang()} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {displayOptions.map(option => (
          <button type="button" key={option.id}
            onClick={() => choose(option.id)}
            disabled={completed}
            aria-pressed={choice === option.id}
            aria-label={option.label}
            className="flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 sm:min-h-44 rounded-3xl border-4 border-white bg-gradient-to-b from-white to-soft-blue/10 p-5 text-center shadow-md transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal aria-pressed:border-teal aria-pressed:bg-teal/10 disabled:opacity-80 motion-reduce:transform-none">
            {option.symbol && <ExplorerPicture symbol={option.symbol} />}
            <span className="w-full break-words text-[1.125rem] font-extrabold leading-snug text-ink sm:text-lg"><span className="answer-label">{option.label}</span></span>
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="text-center text-lg font-bold text-ink empty:p-0 [&:not(:empty)]:mt-5 [&:not(:empty)]:rounded-xl [&:not(:empty)]:bg-white/80 [&:not(:empty)]:p-3">
        {feedback}
      </div>
      {correct && !completed && onComplete && (
        <button type="button" onClick={finish}
          className="min-h-12 rounded-full bg-teal px-7 py-3 font-bold text-white shadow-md hover:bg-teal/90">
          {nextLabel}
        </button>
      )}
    </section>
  );
}
