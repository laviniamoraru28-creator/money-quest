"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { SortRound } from "../types";

/**
 * Tap-to-select-then-tap-to-place, per the accessibility baseline (design
 * system Section 10.4: every drag interaction needs a non-drag
 * alternative — this mechanic simply never uses drag at all, so there's
 * nothing to provide an alternative to).
 */
export function SortMechanic({ round, onAnswer, isResolved, isExplorer }: MechanicProps<SortRound>) {
  const t = useTranslations();
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const allPlaced = round.items.every((item) => placements[item.id]);

  function placeInBucket(bucketKey: string) {
    if (!selectedItemId || isResolved) return;
    setPlacements((prev) => ({ ...prev, [selectedItemId]: bucketKey }));
    setSelectedItemId(null);
    setChecked(false);
  }

  function checkAnswers() {
    const allCorrect = round.items.every((item) => placements[item.id] === item.correctBucketKey);
    setChecked(true);
    onAnswer(allCorrect);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2xs" role="group" aria-label={t("game.itemsToSort")}>
        {round.items.map((item) => {
          const isPlaced = Boolean(placements[item.id]);
          return (
            <button
              key={item.id}
              type="button"
                disabled={isResolved || (isPlaced && checked)}
              aria-pressed={selectedItemId === item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={[
                "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs",
                isExplorer ? "max-w-full break-words text-md font-bold leading-snug" : "text-base",
                selectedItemId === item.id ? "border-teal bg-teal/10" : "border-ink/20",
                isPlaced ? "opacity-50" : "",
              ].join(" ")}
            >
              <span className="answer-label">{item.label}</span>
              {isPlaced && (
                <span className={isExplorer ? "ml-2xs text-base text-ink/70" : "ml-2xs text-sm text-ink/70"}>
                  → {round.buckets.find((b) => b.key === placements[item.id])?.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className={isExplorer ? "mt-sm text-base text-ink/70" : "mt-sm text-sm text-ink/70"} aria-live="polite">
        {selectedItemId
          ? t("game.selectedItemHint", { item: round.items.find((i) => i.id === selectedItemId)?.label ?? "" })
          : t("game.tapItemThenBucket")}
      </p>

      <div className={isExplorer ? "mt-2xs grid grid-cols-2 gap-2" : "mt-2xs grid grid-cols-2 gap-sm"}>
        {round.buckets.map((bucket) => (
          <button
            key={bucket.key}
            type="button"
            disabled={isResolved}
            onClick={() => placeInBucket(bucket.key)}
            className={isExplorer ? "min-h-touch-min-child min-w-0 break-words rounded-lg border-2 border-dashed border-teal/50 bg-teal/5 px-2 py-3 text-base font-bold leading-snug text-teal-text sm:text-md" : "min-h-touch-min-child rounded-lg border-2 border-dashed border-teal/50 bg-teal/5 px-sm py-md font-medium text-teal-text"}
          >
            <span className="answer-label">{bucket.label}</span>
          </button>
        ))}
      </div>

      {allPlaced && !checked && !isResolved && (
        <button
          type="button"
          onClick={checkAnswers}
          className={isExplorer ? "mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs text-lg font-bold text-white shadow-resting" : "mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting"}
        >
          {t("game.checkMySorting")}
        </button>
      )}
    </div>
  );
}
