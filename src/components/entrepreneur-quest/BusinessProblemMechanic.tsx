"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EQ_BUSINESS_PROBLEMS } from "@/content/entrepreneur-quest/structures";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";
import { Button } from "@/components/ui/Button";

/**
 * The reusable "Business Problems" mechanic (brief sections 7-9):
 * PROBLEM (+ a live dashboard snapshot the caller supplies, never a
 * scripted fake one — see `statLines`) -> INVESTIGATE (tap to reveal
 * clues, no wrong taps) -> IDENTIFY A CAUSE (reflective, not scored)
 * -> CHOOSE A RESPONSE (reuses MissionMechanic exactly like every
 * other decision in this app). `statLines` is deliberately generic
 * (label/value pairs the caller has already formatted) rather than a
 * typed CompanyStats, so this ONE component works both for the
 * child's own persistent business (run/problems/[problemId]) and for
 * Business Rescue's separate, isolated company snapshot
 * (rescue-grow/business-rescue) without a second parallel mechanic.
 */
export function BusinessProblemMechanic({
  problemId,
  statLines,
  currencyCode,
  uiLocale,
  onRespond,
  onFinish,
}: {
  problemId: string;
  statLines: { label: string; value: string }[];
  currencyCode: string;
  uiLocale: string;
  onRespond: (responseKey: string) => void;
  onFinish: () => void;
}) {
  const t = useTranslations();
  const problem = EQ_BUSINESS_PROBLEMS[problemId];
  const [revealedClueIds, setRevealedClueIds] = useState<string[]>([]);
  const [chosenCauseId, setChosenCauseId] = useState<string | null>(null);
  const [respondedKey, setRespondedKey] = useState<string | null>(null);

  if (!problem) return null;

  const round: MissionRound = {
    id: problemId,
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t(`entrepreneurQuest.problems.${problemId}.responsePrompt`),
    choices: problem.responseIds.map((responseId) => ({
      key: responseId,
      label: t(`entrepreneurQuest.problems.${problemId}.responses.${responseId}.label`),
      consequence: t(`entrepreneurQuest.problems.${problemId}.responses.${responseId}.consequence`),
    })),
  };

  return (
    <div className="mt-sm">
      <p className="rounded-md bg-fog p-sm text-base text-ink/80">{t(`entrepreneurQuest.problems.${problemId}.situation`)}</p>

      <div className="mt-sm grid grid-cols-2 gap-2xs sm:grid-cols-4">
        {statLines.map((line) => (
          <MiniStat key={line.label} label={line.label} value={line.value} />
        ))}
      </div>

      <p className="mt-sm text-sm font-medium">{t("entrepreneurQuest.problemFlow.investigateLabel")}</p>
      <div className="mt-2xs grid gap-2xs sm:grid-cols-3">
        {problem.clueIds.map((clueId) => {
          const isRevealed = revealedClueIds.includes(clueId);
          return (
            <button
              key={clueId}
              type="button"
              onClick={() => setRevealedClueIds((prev) => (prev.includes(clueId) ? prev : [...prev, clueId]))}
              className={[
                "min-h-touch-min-child rounded-sm border-2 px-sm py-2xs text-left text-sm",
                isRevealed ? "border-teal bg-teal/5 text-ink" : "border-ink/15 text-ink/60",
              ].join(" ")}
            >
              {isRevealed ? t(`entrepreneurQuest.problems.${problemId}.clues.${clueId}`) : t("entrepreneurQuest.problemFlow.tapToReveal")}
            </button>
          );
        })}
      </div>

      <p className="mt-sm text-sm font-medium">{t("entrepreneurQuest.problemFlow.causeLabel")}</p>
      <div className="mt-2xs grid gap-2xs">
        {problem.causeIds.map((causeId) => {
          const isChosen = chosenCauseId === causeId;
          return (
            <div key={causeId}>
              <button
                type="button"
                disabled={Boolean(chosenCauseId)}
                onClick={() => setChosenCauseId(causeId)}
                className={[
                  "min-h-touch-min-child w-full rounded-sm border-2 px-sm py-2xs text-left text-sm",
                  isChosen ? "border-teal bg-teal/5" : "border-ink/15",
                  chosenCauseId && !isChosen ? "opacity-50" : "",
                ].join(" ")}
              >
                {t(`entrepreneurQuest.problems.${problemId}.causes.${causeId}.label`)}
              </button>
              {isChosen && (
                <p className="mt-2xs rounded-sm border border-teal/30 bg-teal/5 p-sm text-xs text-ink/70">
                  {t(`entrepreneurQuest.problems.${problemId}.causes.${causeId}.feedback`)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {chosenCauseId && (
        <div className="mt-sm">
          <p className="text-sm font-medium">{t("entrepreneurQuest.problemFlow.responseLabel")}</p>
          <MissionMechanic
            round={round}
            currencyCode={currencyCode}
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              setRespondedKey(choiceKey ?? "");
              onRespond(choiceKey ?? "");
            }}
            isResolved={false}
          />
        </div>
      )}

      {respondedKey !== null && (
        <Button variant="quest-primary" className="mt-sm w-full" onClick={onFinish}>
          {t("entrepreneurQuest.continueButton")}
        </Button>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-ink/10 p-2xs">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
