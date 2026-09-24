"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { EQ_GROW_OPTION_IDS } from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import type { MissionRound } from "@/game-engine/types";

/**
 * "Grow or Stay Small" (brief section 21) — growth increases both
 * potential upside AND cost/risk; staying small is a genuinely valid,
 * zero-effect choice, never the "wrong" one.
 */
export default function GrowPage() {
  const uiLocale = useLocale();
  const t = useTranslations();
  const { isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, applyGrowDecision } = useEntrepreneurQuest();
  const [chosenKey, setChosenKey] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const alreadyDecided = state.decisionChoices["grow-or-stay-small"];
  const round: MissionRound = {
    id: "grow-or-stay-small",
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.rescueGrow.grow.situation"),
    choices: EQ_GROW_OPTION_IDS.map((key) => ({
      key,
      label: t(`entrepreneurQuest.rescueGrow.grow.choices.${key}.label`),
      consequence: t(`entrepreneurQuest.rescueGrow.grow.choices.${key}.consequence`),
    })),
  };

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/rescue-grow"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.rescueGrow.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.rescueGrow.growLink")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.rescueGrow.grow.intro")}</p>

        <Card variant="activity" className="mt-md">
          <MissionMechanic
            round={round}
            currencyCode=""
            uiLocale={uiLocale}
            usesCurrency={false}
            onAnswer={(_isCorrect, choiceKey) => {
              setChosenKey(choiceKey ?? "");
              if (!alreadyDecided) applyGrowDecision(choiceKey ?? "");
            }}
            isResolved={Boolean(alreadyDecided)}
          />

          {(chosenKey !== null || alreadyDecided) && (
            <Link href="/entrepreneur-quest/rescue-grow" className="mt-sm block">
              <Button variant="quest-primary" className="w-full">
                {t("entrepreneurQuest.continueButton")}
              </Button>
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
