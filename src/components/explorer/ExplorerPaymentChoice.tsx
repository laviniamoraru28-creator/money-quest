"use client";

import { useCallback, useEffect, useState } from "react";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

export type ExplorerPaymentMethod = "coins" | "banknote" | "card";

type Props = {
  prompt: string;
  coinLabel: string;
  banknoteLabel: string;
  cardLabel: string;
  replayLabel: string;
  retryMessage: string;
  successMessage: string;
  /** The correct method for this particular learning scenario. */
  correctMethod: ExplorerPaymentMethod;
  onComplete?: () => void;
};

/**
 * Introduces three ways of paying without claiming a card contains
 * unlimited money. The caller supplies localized, age-appropriate prompts.
 * Visual symbols are supplementary to spoken and written labels.
 */
export function ExplorerPaymentChoice({
  prompt, coinLabel, banknoteLabel, cardLabel, replayLabel,
  retryMessage, successMessage, correctMethod, onComplete,
}: Props) {
  const [selected, setSelected] = useState<ExplorerPaymentMethod | null>(null);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");

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

  const options: { id: ExplorerPaymentMethod; label: string; symbol: string }[] = [
    { id: "coins", label: coinLabel, symbol: "🪙" },
    { id: "banknote", label: banknoteLabel, symbol: "💵" },
    { id: "card", label: cardLabel, symbol: "💳" },
  ];

  const choose = (method: ExplorerPaymentMethod) => {
    if (finished) return;
    setSelected(method);
    const correct = method === correctMethod;
    const message = correct ? successMessage : retryMessage;
    setFeedback(message);
    speak(message);
    if (correct) {
      setFinished(true);
      onComplete?.();
    }
  };

  return (
    <section data-explorer-payment-choice className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="text-xl font-bold">{prompt}</h2>
      <button type="button" onClick={() => speak(prompt)}
        className="my-4 min-h-12 rounded-full border-2 border-teal bg-white px-5 py-3 font-bold text-teal-text">
        <span aria-hidden="true">🔊 </span>{replayLabel}
      </button>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map(option => (
          <button type="button" key={option.id}
            onClick={() => choose(option.id)}
            aria-pressed={selected === option.id}
            disabled={finished}
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal/30 p-4 aria-pressed:border-teal aria-pressed:bg-teal/10 disabled:opacity-80">
            <span aria-hidden="true" className="text-5xl">{option.symbol}</span>
            <span className="text-lg font-bold">{option.label}</span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
    </section>
  );
}
