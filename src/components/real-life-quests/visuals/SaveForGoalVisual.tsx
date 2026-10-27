"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { VisualChoiceButton } from "@/components/real-life-quests/VisualChoiceButton";
import { PilotIcon } from "@/components/real-life-quests/VisualPilotIcons";

const GOAL_CHOICES = [
  { id: "toy", icon: "toy" as const, labelKey: "goalOptionToy" },
  { id: "book", icon: "book" as const, labelKey: "goalOptionBook" },
  { id: "game", icon: "game" as const, labelKey: "goalOptionGame" },
  { id: "other", icon: "star" as const, labelKey: "goalOptionOther" },
];

const TOTAL_STEPS = 5;

/**
 * Save for Something You Love — visual sequence:
 *   Choose: tap a picture of the goal (no typing/reading needed to pick one).
 *   Do: tap jar segments as real-world saving happens, one at a time.
 *   See what happens: the jar visibly fills and a "goal reached" visual
 *     appears at 5/5 — a genuine visual relationship between the goal,
 *     adding to the jar, and progress toward it, not just a decorative
 *     jar icon next to the text.
 *
 * Deliberately says nothing about saving being "better" than spending —
 * it only shows progress toward whatever the child picked; the existing
 * mission text/parentGuidance (unchanged) carries that framing. This
 * widget is a practice/demonstration aid, not the mission's
 * authoritative "done" state — completing the mission itself still only
 * happens via the existing "Mark as completed" button below, unchanged.
 */
export function SaveForGoalVisual({
  selectedChoiceId,
  filledSteps,
  onSelectChoice,
  onSetFilledSteps,
}: {
  selectedChoiceId: string | null;
  filledSteps: number;
  onSelectChoice: (choiceId: string) => void;
  onSetFilledSteps: (filledSteps: number) => void;
}) {
  const t = useTranslations();
  const goalReached = filledSteps >= TOTAL_STEPS;

  return (
    <Card variant="activity" className="mt-sm">
      <h2 className="font-display text-md font-bold">{t("realLifeQuests.visualPilot.chooseGoalTitle")}</h2>
      <div className="mt-2xs grid grid-cols-2 gap-2xs sm:grid-cols-4">
        {GOAL_CHOICES.map((choice) => (
          <VisualChoiceButton
            key={choice.id}
            icon={choice.icon}
            label={t(`realLifeQuests.visualPilot.${choice.labelKey}`)}
            selected={selectedChoiceId === choice.id}
            onClick={() => onSelectChoice(choice.id)}
          />
        ))}
      </div>

      <div className="mt-md flex flex-col items-center">
        <PilotIcon name={goalReached ? "jarFilled" : "jarEmpty"} className="h-20 w-20 text-teal-text" />
        <div className="mt-xs flex gap-2xs">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const filled = i < filledSteps;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={filled}
                aria-label={t("realLifeQuests.visualPilot.jarStepLabel", { number: i + 1 })}
                onClick={() => onSetFilledSteps(filled && i === filledSteps - 1 ? i : i + 1)}
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] transition-colors duration-quick",
                  filled ? "border-gold bg-gold text-ink" : "border-ink/20 bg-white text-ink/70 hover:border-gold",
                ].join(" ")}
              >
                <PilotIcon name="star" className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        {goalReached && (
          <p className="mt-xs flex items-center gap-2xs text-sm font-semibold text-teal-text">
            <PilotIcon name="star" className="h-5 w-5" />
            {t("realLifeQuests.visualPilot.jarCompleteLabel")}
          </p>
        )}
      </div>
    </Card>
  );
}
