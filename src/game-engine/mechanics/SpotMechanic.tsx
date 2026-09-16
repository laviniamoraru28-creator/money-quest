"use client";

import { useState } from "react";
import type { MechanicProps } from "../registry";
import type { SpotRound } from "../types";

export function SpotMechanic({ round, onAnswer, isResolved }: MechanicProps<SpotRound>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  function toggle(id: string) {
    if (isResolved || checked) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    const suspiciousIds = new Set(round.items.filter((i) => i.isSuspicious).map((i) => i.id));
    const exactMatch =
      selectedIds.size === suspiciousIds.size && [...selectedIds].every((id) => suspiciousIds.has(id));
    setChecked(true);
    onAnswer(exactMatch);
  }

  return (
    <div>
      <p className="rounded-sm bg-fog p-sm text-base italic text-ink/80">{round.scenario}</p>

      <p className="mt-sm text-sm text-ink/70">Tap anything that feels suspicious.</p>

      <div className="mt-2xs grid gap-2xs">
        {round.items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const showResult = checked;
          const correctlyFlagged = showResult && item.isSuspicious && isSelected;
          const missedFlag = showResult && item.isSuspicious && !isSelected;
          const wronglyFlagged = showResult && !item.isSuspicious && isSelected;

          return (
            <button
              key={item.id}
              type="button"
              disabled={isResolved || checked}
              aria-pressed={isSelected}
              onClick={() => toggle(item.id)}
              className={[
                "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-base",
                correctlyFlagged ? "border-success bg-success/10" : "",
                missedFlag ? "border-error bg-error/10" : "",
                wronglyFlagged ? "border-warning bg-warning/10" : "",
                !showResult && isSelected ? "border-teal bg-teal/10" : "",
                !showResult && !isSelected ? "border-ink/20" : "",
              ].join(" ")}
            >
              {item.text}
              {correctlyFlagged && <span className="ml-2xs text-sm font-medium text-success">✓ Good catch!</span>}
              {missedFlag && <span className="ml-2xs text-sm font-medium text-error">✗ This was a warning sign</span>}
              {wronglyFlagged && <span className="ml-2xs text-sm font-medium text-warning">This one was actually fine</span>}
            </button>
          );
        })}
      </div>

      {!checked && !isResolved && (
        <button
          type="button"
          disabled={selectedIds.size === 0}
          onClick={submit}
          className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
        >
          Check what I found
        </button>
      )}
    </div>
  );
}
