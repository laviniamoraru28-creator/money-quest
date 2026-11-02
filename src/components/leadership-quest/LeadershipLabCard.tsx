"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

/**
 * One Leadership Lab scenario (brief section 11) — a short, standalone
 * practice prompt, collapsed by default so the list stays scannable.
 * Reuses MissionMechanic exactly like every larger mission's decision
 * point, rather than a bespoke "short scenario" component — the shape
 * (situation + a few choices, each with its own consequence) is
 * identical, just shorter content.
 */
export function LeadershipLabCard({
  scenarioId,
  choiceKeys,
  currencyCode,
  uiLocale,
  isCompleted,
  onAnswer,
}: {
  scenarioId: string;
  choiceKeys: string[];
  currencyCode: string;
  uiLocale: string;
  isCompleted: boolean;
  onAnswer: (choiceKey: string) => void;
}) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const round: MissionRound = {
    id: scenarioId,
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t(`leadershipQuest.lab.${scenarioId}.situation`),
    choices: choiceKeys.map((key) => ({
      key,
      label: t(`leadershipQuest.lab.${scenarioId}.choices.${key}.label`),
      consequence: t(`leadershipQuest.lab.${scenarioId}.choices.${key}.consequence`),
    })),
  };

  return (
    <div className="rounded-md border border-ink/10 bg-cream p-sm">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex min-h-touch-min-child w-full items-center justify-between gap-xs text-left"
      >
        <span className="font-medium text-ink">{t(`leadershipQuest.lab.${scenarioId}.title`)}</span>
        <span aria-hidden="true" className="shrink-0 text-lg">
          {isCompleted ? "✅" : isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-sm">
          <MissionMechanic
            round={round}
            currencyCode={currencyCode}
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              if (choiceKey) onAnswer(choiceKey);
            }}
            isResolved={isCompleted}
          />
        </div>
      )}
    </div>
  );
}
