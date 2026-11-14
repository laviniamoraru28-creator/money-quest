"use client";

import {useState} from "react";
import {useAnswerOrder} from "@/lib/answer-order";
import {ExplorerPicture} from "./ExplorerPicture";
import { useTapOrDrag } from "@/lib/explorer/use-tap-or-drag";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import { explorerSpeechLang } from "@/lib/explorer/speech-lang";

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
  nextLabel: string;
  tryAgainMessage: string;
  successMessage: string;
  onComplete?: () => void;
  interchangeableItems?: boolean;
};

/** Tap-first picture sorting; no drag requirement, timers, or reading gate. */
export function ExplorerPictureSort({
  prompt, items, destinations, nextLabel, tryAgainMessage,
  successMessage, onComplete, interchangeableItems = false,
}: Props) {
  const { selected: selectedId, setSelected: setSelectedId, dragSource, dropTarget } = useTapOrDrag<string>();
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const displayItems = useAnswerOrder(items);
  const displayDestinations = useAnswerOrder(destinations);
  const total = items.length;
  const correctCount = Object.keys(placed).length;



  const place = (destinationId: string, itemId: string | null = selectedId) => {
    if (!itemId || finished) return;
    const item = items.find(entry => entry.id === itemId);
    if (!item || placed[itemId]) return;
    const fitsDestination = interchangeableItems
      ? Object.values(placed).filter(id => id === destinationId).length < items.filter(entry => entry.destinationId === destinationId).length
      : item.destinationId === destinationId;
    if (!fitsDestination) {
      setFeedback(tryAgainMessage);
      return;
    }
    const next = { ...placed, [itemId]: destinationId };
    setPlaced(next);
    setSelectedId(null);
    const allCorrect = Object.keys(next).length === total;
    const destinationLabel = destinations.find(entry => entry.id === destinationId)?.label ?? item.label;
    const message = allCorrect ? successMessage : destinationLabel;
    setFeedback(message);
    if (allCorrect) {
      setFinished(true);
    }
  };

  return (
    <section data-explorer-picture-sort className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
      <h2 className="break-words text-[1.25rem] font-bold leading-snug sm:text-lg">{prompt}</h2>
      <ReadAloudButton text={feedback || prompt} uiLocale={explorerSpeechLang()} />
      <div className="grid grid-cols-2 gap-3">
        {displayItems.filter(item => !placed[item.id]).map(item => (
          <button type="button" key={item.id}
            aria-pressed={selectedId === item.id}
            onClick={() => { setSelectedId(item.id); setFeedback(""); }}
            {...dragSource(item.id)}
            className="flex min-h-28 min-w-0 cursor-grab flex-col items-center justify-center rounded-2xl border-2 border-teal/30 p-3 aria-pressed:border-teal aria-pressed:bg-teal/10 active:cursor-grabbing">
            <ExplorerPicture symbol={item.symbol} size={40} />
            <span className="answer-label w-full font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {displayDestinations.map(destination => (
          // Not a native `disabled` button even when nothing is tap-selected
          // yet: a disabled element's pointer-events are suppressed in most
          // browsers, which would silently swallow a drag-and-drop onto it.
          // place() itself already no-ops without a valid item id.
          <button type="button" key={destination.id} aria-disabled={finished}
            onClick={() => place(destination.id)}
            {...dropTarget(itemId => place(destination.id, itemId))}
            className={`flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal bg-teal/5 p-3 min-[420px]:p-4 ${finished ? "opacity-60" : !selectedId ? "opacity-80" : ""}`}>
            <ExplorerPicture symbol={destination.symbol} size={40} />
            <span className="answer-label w-full text-center text-base font-bold leading-snug sm:text-lg">{destination.label}</span>
            <span aria-label={String(items.filter(item => placed[item.id] === destination.id).length)} className="flex flex-wrap justify-center gap-1">
              {items.filter(item => placed[item.id] === destination.id).map(item => <ExplorerPicture key={item.id} symbol={item.symbol} size={24} />)}
            </span>
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
      <progress aria-label={prompt} value={correctCount} max={Math.max(1, total)} className="w-full" />
      {finished && onComplete && <button type="button" onClick={onComplete} className="mt-3 min-h-12 w-full rounded-full bg-teal px-4 py-3 text-base font-bold text-white">{nextLabel}</button>}
    </section>
  );
}
