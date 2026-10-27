"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VisualChoiceButton } from "@/components/real-life-quests/VisualChoiceButton";
import { PilotIcon } from "@/components/real-life-quests/VisualPilotIcons";

const OFFER_CHOICES = [
  { id: "drawing", icon: "drawing" as const, labelKey: "offerOptionDrawing" },
  { id: "baking", icon: "baking" as const, labelKey: "offerOptionBaking" },
  { id: "stall", icon: "stall" as const, labelKey: "offerOptionStall" },
  { id: "other", icon: "star" as const, labelKey: "offerOptionOther" },
];

/**
 * My First Mini Business — visual sequence:
 *   Choose: tap a picture of what to offer (no typing/reading needed).
 *   Do: a "Show it!" button shows the chosen item being presented to a
 *     customer figure — a concrete show-and-offer action, not a cash
 *     register or coin-counting UI.
 *   See what happens: the customer's visible reaction (a smiling face
 *     icon + short text), tappable to reveal.
 *
 * Deliberately has no money-handling interaction at all — no coin
 * input, no "pay" button, no numeric total — so nothing here implies
 * the child is meant to conduct a real financial transaction. The
 * existing mission text already frames pricing as pretend/optional and
 * stays unchanged; this widget only covers "offer it, show it, see the
 * reaction."
 */
export function MiniBusinessVisual({
  selectedChoiceId,
  onSelectChoice,
}: {
  selectedChoiceId: string | null;
  onSelectChoice: (choiceId: string) => void;
}) {
  const t = useTranslations();
  const [revealed, setRevealed] = useState(false);
  const chosenIcon = OFFER_CHOICES.find((c) => c.id === selectedChoiceId)?.icon ?? null;

  return (
    <Card variant="activity" className="mt-sm">
      <h2 className="font-display text-md font-bold">{t("realLifeQuests.visualPilot.chooseOfferTitle")}</h2>
      <div className="mt-2xs grid grid-cols-2 gap-2xs sm:grid-cols-4">
        {OFFER_CHOICES.map((choice) => (
          <VisualChoiceButton
            key={choice.id}
            icon={choice.icon}
            label={t(`realLifeQuests.visualPilot.${choice.labelKey}`)}
            selected={selectedChoiceId === choice.id}
            onClick={() => {
              onSelectChoice(choice.id);
              setRevealed(false);
            }}
          />
        ))}
      </div>

      {chosenIcon && (
        <div className="mt-md flex flex-col items-center">
          <div className="flex items-center gap-sm">
            <PilotIcon name={chosenIcon} className="h-14 w-14 text-teal" />
            <span aria-hidden="true" className="text-xl text-ink/70">→</span>
            <PilotIcon name={revealed ? "customerHappy" : "customer"} className="h-14 w-14 text-ink/70" />
          </div>
          <Button type="button" variant="secondary" size="large" className="mt-xs" onClick={() => setRevealed(true)}>
            <PilotIcon name="presentItem" className="h-5 w-5" />
            {t("realLifeQuests.visualPilot.showToCustomerButton")}
          </Button>
          {revealed && (
            <p className="mt-xs flex items-center gap-2xs text-sm font-semibold text-teal">
              <PilotIcon name="star" className="h-5 w-5" />
              {t("realLifeQuests.visualPilot.customerHappyLabel")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
