"use client";

import { useState } from "react";
import { useAnswerOrder } from "@/lib/answer-order";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { MatchRound } from "../types";

/** Tap-tap matching (select a left item, then its right pair) rather than
 * drag — same accessibility rationale as SortMechanic. */
export function MatchMechanic({ round, onAnswer, isResolved, isExplorer }: MechanicProps<MatchRound>) {
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

  const shuffledLeft = useAnswerOrder(round.pairs);
  const shuffledRight = useAnswerOrder(round.pairs);

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
      <p role="status" aria-live="polite" className={isExplorer ? "min-h-[1.5em] text-base font-bold text-ink/70" : "min-h-[1.5em] text-sm font-medium text-ink/70"}>
        {statusMessage}
      </p>

      <div className="mt-2xs grid grid-cols-2 gap-md">
        <div className="grid gap-2xs" role="group" aria-label={t("game.matchThese")}>
          {shuffledLeft.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isResolved || isMatched}
                aria-pressed={selectedLeftId === pair.id}
                    onClick={() => handleLeftTap(pair.id)}
                className={[
                  "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left",
                  isExplorer ? "text-lg font-bold" : "text-base",
                  isMatched ? "border-success bg-success/10 opacity-60" : "",
                  selectedLeftId === pair.id ? "border-teal bg-teal/10" : "border-ink/20",
                ].join(" ")}
              >
                <span className="answer-label">{pair.left}</span>
                {isMatched && (
                  <span className="ml-2xs text-success-text">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only"> {t("game.matchedBadge")}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="grid gap-2xs" role="group" aria-label={t("game.withThese")}>
          {shuffledRight.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            const isWrongFlash = wrongFlash === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isResolved || isMatched}
                    onClick={() => handleRightTap(pair.id)}
                className={[
                  "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left",
                  isExplorer ? "text-lg font-bold" : "text-base",
                  isMatched ? "border-success bg-success/10 opacity-60" : "",
                  isWrongFlash ? "border-error bg-error/10" : "border-ink/20",
                ].join(" ")}
              >
                <span className="answer-label">{pair.right}</span>
                {isMatched && (
                  <span className="ml-2xs text-success-text">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only"> {t("game.matchedBadge")}</span>
                  </span>
                )}
                {isWrongFlash && (
                  <span className="ml-2xs text-error-text">
                    <span aria-hidden="true">✗</span>
                    <span className="sr-only"> {t("game.notAMatchBadge")}</span>
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
