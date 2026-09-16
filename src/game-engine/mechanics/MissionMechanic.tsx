"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { MissionRound } from "../types";
import { formatCurrency } from "@/lib/currency/format";

/**
 * Deliberately does NOT reuse CompareMechanic's or MultipleChoiceMechanic's
 * visual treatment (green for correct, red for incorrect) — a mission has
 * no correct answer, so styling one choice as "right" and another as
 * "wrong" would misrepresent what this activity is teaching. Every choice
 * gets the same neutral selected-state color; what changes after picking
 * is only which consequence text appears, never a checkmark/cross
 * judgment. onAnswer(true) is always called once a choice is made — there
 * is nothing to fail here, only something to consider, which is why
 * missions never block "next" behind a passing score the way graded
 * rounds do.
 */
export function MissionMechanic({ round, currencyCode, uiLocale, usesCurrency, onAnswer, isResolved }: MechanicProps<MissionRound>) {
  const t = useTranslations();
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const chosen = round.choices.find((c) => c.key === chosenKey) ?? null;

  function choose(key: string) {
    if (chosenKey) return; // one choice per round, matching every other mechanic's "answer once" model
    setChosenKey(key);
    onAnswer(true);
  }

  return (
    <div>
      <p className="rounded-md bg-fog p-sm text-base font-medium text-ink">{round.situation}</p>

      <div className="mt-sm grid gap-2xs">
        {round.choices.map((choice) => {
          const isChosen = chosenKey === choice.key;
          return (
            <div key={choice.key}>
              <button
                type="button"
                disabled={isResolved || Boolean(chosenKey)}
                onClick={() => choose(choice.key)}
                className={[
                  "min-h-touch-min-child w-full rounded-md border-2 p-sm text-left",
                  isChosen ? "border-teal bg-teal/5" : "border-ink/15",
                  chosenKey && !isChosen ? "opacity-50" : "",
                ].join(" ")}
              >
                <span className="flex items-center justify-between gap-xs">
                  <span className="font-medium">{choice.label}</span>
                  {usesCurrency && choice.costMinorUnits !== undefined && (
                    <span className="shrink-0 font-bold text-ink">{formatCurrency(choice.costMinorUnits, currencyCode, uiLocale)}</span>
                  )}
                </span>
              </button>
              {isChosen && (
                <p className="mt-2xs rounded-md border border-teal/30 bg-teal/5 p-sm text-sm text-ink/80">
                  {choice.consequence}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!chosenKey && <p className="mt-sm text-sm text-ink/50">{t("game.chooseAnyOption")}</p>}
    </div>
  );
}
