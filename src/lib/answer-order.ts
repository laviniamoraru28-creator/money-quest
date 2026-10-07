import { useState } from "react";

/**
 * Shared "answer order" architecture — the website's equivalent of the
 * AnswerOrder approach used in Money Quest World (the Godot game) to
 * fix the same bug there: quiz/game options were always rendered in
 * their raw, content-authored array order, and that order happened to
 * put the correct answer first far more often than chance (29 of 30
 * curriculum lesson quizzes). This file is the one place that gets
 * fixed, rather than patching each component's own render order by
 * hand, so the fix can't be silently undone by a future quiz/game
 * that forgets to shuffle.
 *
 * The contract every caller must keep: shuffle the already-correct,
 * already-translated array of options for DISPLAY ONLY. Never shuffle
 * or regenerate the correctness check itself — that must always
 * compare the chosen option's own identity/value (e.g. its string
 * text, or a stable `key`) against the content's declared correct
 * answer, exactly as every mechanic here already does. A shuffle
 * never needs to know which option is correct.
 */

/** Fisher-Yates shuffle. Returns a new array; never mutates `items`. */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = temp;
  }
  return result;
}

/**
 * Returns a shuffled copy of `items`, randomised once when the calling
 * component mounts and held stable for as long as that component
 * instance stays mounted — so an answer's on-screen position never
 * changes mid-question (including through a "Try Again" retry that
 * re-renders the same mounted mechanic without unmounting it), but a
 * genuinely new attempt — a fresh question, or a retry that remounts
 * the mechanic via a changed React `key` (as GameShell already does on
 * every round and every retry) — gets a freshly randomised order. This
 * is deliberate: there is no separate "resume" state for an in-progress
 * question anywhere in this app (a reload simply remounts the page from
 * scratch), so "randomise when the activity starts, preserve while it's
 * open" falls directly out of useState's lazy initializer with no extra
 * persistence code needed.
 *
 * Must only be called with a fixed-identity list of options for a
 * single question — never reshuffle inside a loop over multiple
 * questions sharing one component instance.
 */
export function useAnswerOrder<T>(items: readonly T[]): T[] {
  const [order] = useState(() => shuffleArray(items));
  return order;
}
