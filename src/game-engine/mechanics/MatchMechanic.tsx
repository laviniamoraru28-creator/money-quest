"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { MatchRound } from "../types";

/** Tap-tap matching (select a left item, then its right pair) rather than
 * drag — same accessibility rationale as SortMechanic. */
export function MatchMechanic({ round, onAnswer, isResolved }: MechanicProps<MatchRound>) {
  const t = useTranslations();
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  // A real, textual status announcement — not decoration. This is what a
  // screen-reader user actually hears after a match attempt; without it,
  // a wrong match was previously completely silent for them (the only
  // signal was a 500ms colour flash on the button, both too brief for
  // many sighted users to register and entirely invisible to anyone
  // using a screen reader or with a colour-vision difference).
  const [statusMessage, setStatusMessage] = useState<string>("");

  const shuffledRight = shuffleDeterministic(round.pairs, round.id);

  function handleLeftTap(pairId: string) {
    if (isResolved || matchedIds.has(pairId)) return;
    setSelectedLeftId(pairId);
  }

  function handleRightTap(pairId: string) {
    if (isResolved || !selectedLeftId || matchedIds.has(pairId)) return;

    if (pairId === selectedLeftId) {
      const next = new Set(matchedIds);
      next.add(pairId);
      setMatchedIds(next);
      setSelectedLeftId(null);
      setStatusMessage(t("game.matched"));

      if (next.size === round.pairs.length) {
        onAnswer(true); // matching mechanic: reaching full completion IS the correct answer
      }
    } else {
      setWrongFlash(pairId);
      setStatusMessage(t("game.notAMatch"));
      setTimeout(() => setWrongFlash(null), 1200); // long enough to actually register, not just a flicker
      setSelectedLeftId(null);
    }
  }

  return (
    <div>
      {/* The actual accessible feedback mechanism — announced to screen
          readers via aria-live, and visible on-screen for sighted users
          too, so the same real information reaches everyone rather than
          relying on the colour flash alone. */}
      <p role="status" aria-live="polite" className="min-h-[1.5em] text-sm font-medium text-ink/70">
        {statusMessage}
      </p>

      <div className="mt-2xs grid grid-cols-2 gap-md">
        <div className="grid gap-2xs" role="list" aria-label={t("game.matchThese")}>
          {round.pairs.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isResolved || isMatched}
                aria-pressed={selectedLeftId === pair.id}
                role="listitem"
                onClick={() => handleLeftTap(pair.id)}
                className={[
                  "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-base",
                  isMatched ? "border-success bg-success/10 opacity-60" : "",
                  selectedLeftId === pair.id ? "border-teal bg-teal/10" : "border-ink/20",
                ].join(" ")}
              >
                {pair.left}
                {isMatched && (
                  <span className="ml-2xs text-success">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only"> Matched</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="grid gap-2xs" role="list" aria-label={t("game.withThese")}>
          {shuffledRight.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            const isWrongFlash = wrongFlash === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isResolved || isMatched}
                role="listitem"
                onClick={() => handleRightTap(pair.id)}
                className={[
                  "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-base",
                  isMatched ? "border-success bg-success/10 opacity-60" : "",
                  isWrongFlash ? "border-error bg-error/10" : "border-ink/20",
                ].join(" ")}
              >
                {pair.right}
                {isMatched && (
                  <span className="ml-2xs text-success">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only"> Matched</span>
                  </span>
                )}
                {isWrongFlash && (
                  <span className="ml-2xs text-error">
                    <span aria-hidden="true">✗</span>
                    <span className="sr-only"> Not a match</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A small, deterministic shuffle (Fibonacci-hash-based) so the same
 * round always shuffles the same way within a session — avoids a
 * dependency on Math.random() inside render, which would reshuffle on
 * every re-render and make the game feel broken. */
function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const j = hash % (i + 1);
    const temp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = temp;
  }
  return arr;
}
