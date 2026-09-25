"use client";

import type { ReactNode } from "react";
import type { LQCharacterId } from "@/content/leadership-quest/structures";
import { DialogueLine } from "./DialogueLine";

/**
 * The composing shell every mission page uses (brief section 7: "do not
 * simply display 'Mission 4: Delegation'" — use alert-style framing,
 * character dialogue, and reaction text). `alertText` and
 * `dialogueLines` are optional so quieter missions (e.g. the closing
 * reflection of Meet Your Team) don't need to force an "OH NO!" framing
 * where none fits. `reactionText` is ALWAYS plain text, never conveyed
 * only through animation, per the accessibility requirement that a
 * consequence must be readable even with reduced motion / no motion at
 * all.
 */
export function MissionScene({
  title,
  alertText,
  dialogueLines,
  children,
  reactionText,
}: {
  title: string;
  alertText?: string;
  dialogueLines?: { characterId: LQCharacterId; text: string }[];
  children: ReactNode;
  reactionText?: string | null;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>

      {alertText && (
        <p className="mt-sm rounded-md border-2 border-coral/40 bg-coral/5 p-sm text-base font-medium text-ink">
          <span aria-hidden="true">🚨</span> {alertText}
        </p>
      )}

      {dialogueLines && dialogueLines.length > 0 && (
        <div className="mt-sm grid gap-2xs">
          {dialogueLines.map((line, i) => (
            <DialogueLine key={i} characterId={line.characterId} text={line.text} />
          ))}
        </div>
      )}

      <div className="mt-sm">{children}</div>

      {reactionText && <p className="mt-sm rounded-md border border-teal/30 bg-teal/5 p-sm text-sm text-ink/80">{reactionText}</p>}
    </div>
  );
}
