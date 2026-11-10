"use client";

import { useCallback, useEffect, useState } from "react";
import { useTapOrDrag } from "@/lib/explorer/use-tap-or-drag";

export type ExplorerSortItem = {
  id: string;
  symbol: string;
  label: string;
  destinationId: string;
};

export type ExplorerSortDestination = {
  id: string;
  symbol: string;
  label: string;
};

type Props = {
  prompt: string;
  items: readonly ExplorerSortItem[];
  destinations: readonly ExplorerSortDestination[];
  replayLabel: string;
  tryAgainMessage: string;
  successMessage: string;
  onComplete?: () => void;
};

/** Tap-first picture sorting; no drag requirement, timers, or reading gate. */
export function ExplorerPictureSort({
  prompt, items, destinations, replayLabel, tryAgainMessage,
  successMessage, onComplete,
}: Props) {
  const { selected: selectedId, setSelected: setSelectedId, dragSource, dropTarget } = useTapOrDrag<string>();
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const total = items.length;
  const correctCount = items.filter(item => placed[item.id] === item.destinationId).length;

  const speak = useCallback((message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = document.documentElement.lang || "en";
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const place = (destinationId: string, itemId: string | null = selectedId) => {
    if (!itemId || finished) return;
    const item = items.find(entry => entry.id === itemId);
    if (!item) return;
    if (item.destinationId !== destinationId) {
      setFeedback(tryAgainMessage);
      speak(tryAgainMessage);
      return;
    }
    const next = { ...placed, [itemId]: destinationId };
    setPlaced(next);
    setSelectedId(null);
    const allCorrect = items.every(entry => next[entry.id] === entry.destinationId);
    const message = allCorrect ? successMessage : item.label;
    setFeedback(message);
    speak(message);
    if (allCorrect) {
      setFinished(true);
      onComplete?.();
    }
  };

  return (
    <section data-explorer-picture-sort className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="text-xl font-bold">{prompt}</h2>
      <button type="button" onClick={() => speak(prompt)}
        className="my-4 min-h-12 rounded-xl border-2 border-teal px-5 py-3 font-bold">
        <span aria-hidden="true">🔊 </span>{replayLabel}
      </button>
      <div className="grid grid-cols-2 gap-3">
        {items.filter(item => !placed[item.id]).map(item => (
          <button type="button" key={item.id}
            aria-pressed={selectedId === item.id}
            onClick={() => { setSelectedId(item.id); setFeedback(""); speak(item.label); }}
            {...dragSource(item.id)}
            className="flex min-h-28 cursor-grab flex-col items-center justify-center rounded-2xl border-2 border-teal/30 p-3 aria-pressed:border-teal aria-pressed:bg-teal/10 active:cursor-grabbing">
            <span aria-hidden="true" className="text-5xl">{item.symbol}</span>
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {destinations.map(destination => (
          // Not a native `disabled` button even when nothing is tap-selected
          // yet: a disabled element's pointer-events are suppressed in most
          // browsers, which would silently swallow a drag-and-drop onto it.
          // place() itself already no-ops without a valid item id.
          <button type="button" key={destination.id} aria-disabled={finished}
            onClick={() => place(destination.id)}
            {...dropTarget(itemId => place(destination.id, itemId))}
            className={`flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-teal bg-teal/5 p-4 ${finished ? "opacity-60" : !selectedId ? "opacity-80" : ""}`}>
            <span aria-hidden="true" className="text-5xl">{destination.symbol}</span>
            <span className="font-bold">{destination.label}</span>
            <span aria-label={String(items.filter(item => placed[item.id] === destination.id).length)}>
              {items.filter(item => placed[item.id] === destination.id).map(item => item.symbol).join(" ")}
            </span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
      <progress aria-label={prompt} value={correctCount} max={Math.max(1, total)} className="w-full" />
    </section>
  );
}
