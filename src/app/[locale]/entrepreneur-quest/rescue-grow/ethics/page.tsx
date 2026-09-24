"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_ETHICS_SCENARIO_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

const ETHICS_CHOICE_KEYS_BY_SCENARIO: Record<string, string[]> = {
  "misleading-ad": ["honest-ad", "slightly-exaggerate", "mislead-customers"],
  "hiding-a-problem": ["tell-customers", "fix-quietly", "hide-it"],
  "cheap-questionable-supplier": ["choose-ethical-supplier", "choose-cheap-supplier", "ask-questions-first"],
};

/**
 * "Business Ethics" (brief section 22) — 3 short, values-based
 * scenarios in sequence. Reputation moves modestly with each choice
 * (see EQ_DECISION_EFFECTS) so the trade-off between short-term gain
 * and trust is felt, not just read.
 */
export default function EthicsPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision } = useEntrepreneurQuest();
  const [step, setStep] = useState(0);
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const scenarioId = EQ_ETHICS_SCENARIO_IDS[step];
  if (!scenarioId) return null;

  const round: MissionRound = {
    id: scenarioId,
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t(`entrepreneurQuest.rescueGrow.ethics.scenarios.${scenarioId}.situation`),
    choices: ETHICS_CHOICE_KEYS_BY_SCENARIO[scenarioId]!.map((key) => ({
      key,
      label: t(`entrepreneurQuest.rescueGrow.ethics.scenarios.${scenarioId}.choices.${key}.label`),
      consequence: t(`entrepreneurQuest.rescueGrow.ethics.scenarios.${scenarioId}.choices.${key}.consequence`),
    })),
  };

  const isLastScenario = step === EQ_ETHICS_SCENARIO_IDS.length - 1;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/rescue-grow"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.rescueGrow.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.rescueGrow.ethicsLink")}</h1>
        <span className="mt-2xs inline-block rounded-full bg-teal/10 px-sm py-3xs text-sm font-medium text-teal">
          {t("entrepreneurQuest.stageProgress", { current: step + 1, total: EQ_ETHICS_SCENARIO_IDS.length })}
        </span>

        <Card variant="activity" className="mt-sm" key={scenarioId}>
          <MissionMechanic
            round={round}
            currencyCode=""
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              setChosenKey(choiceKey ?? "");
              recordDecision(scenarioId, choiceKey ?? "");
            }}
            isResolved={false}
          />

          {(chosenKey !== null || state.decisionChoices[scenarioId] !== undefined) &&
            (isLastScenario ? (
              <Link href="/entrepreneur-quest/rescue-grow" className="mt-sm block">
                <Button variant="quest-primary" className="w-full">
                  {t("entrepreneurQuest.saveAndContinueButton")}
                </Button>
              </Link>
            ) : (
              <Button
                variant="quest-primary"
                className="mt-sm w-full"
                onClick={() => {
                  setStep((s) => s + 1);
                  setChosenKey(null);
                }}
              >
                {t("entrepreneurQuest.continueButton")}
              </Button>
            ))}
        </Card>
      </main>
    </div>
  );
}
