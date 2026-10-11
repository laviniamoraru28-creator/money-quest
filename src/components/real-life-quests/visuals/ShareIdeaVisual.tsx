"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VisualChoiceButton } from "@/components/real-life-quests/VisualChoiceButton";
import { PilotIcon } from "@/components/real-life-quests/VisualPilotIcons";

const IDEA_CHOICES = [
  { id: "game", icon: "game" as const, labelKey: "ideaOptionGame" },
  { id: "story", icon: "story" as const, labelKey: "ideaOptionStory" },
  { id: "built", icon: "built" as const, labelKey: "ideaOptionBuilt" },
  { id: "drawing", icon: "drawing" as const, labelKey: "ideaOptionDrawing" },
];

/**
 * Share My Idea — the mission this brief singled out, because a speech
 * bubble next to text doesn't communicate HOW a nonverbal child can
 * share an idea. This widget IS the nonverbal communication method,
 * not a decoration describing one: tapping one of the four pictures
 * below is itself an act of sharing an idea (game / story / something
 * built / a drawing) — exactly the same thing an AAC picture board or
 * a point-to-a-symbol choice does in real life, just rendered as large
 * tappable icons. No speaking, typing, or reading is required to
 * complete this: the tap is the communication.
 *
 * Sequence:
 *   Choose: tap the picture that matches the child's real idea (the
 *     mission's existing text already says any of drawing/pointing/
 *     AAC/showing is equally valid — this makes "pointing to a symbol"
 *     literally possible inside the app instead of only described).
 *   Do: a "Share it!" button presents the chosen picture to a listener
 *     figure — showing the picture to someone IS the sharing action.
 *   See what happens: the listener's visible reaction.
 *
 * Honest limit: the 4 pictures are a small, fixed vocabulary (game /
 * story / something built / a drawing) covering common but not all
 * possible ideas — a real AAC system would offer a much larger, often
 * personalised symbol set. This pilot shows the mechanism works, not
 * that it replaces a child's existing AAC device, which the mission's
 * nonverbalAdaptation text already (correctly) treats as equally valid
 * and unchanged by this widget.
 */
export function ShareIdeaVisual({
  selectedChoiceId,
  onSelectChoice,
}: {
  selectedChoiceId: string | null;
  onSelectChoice: (choiceId: string) => void;
}) {
  const t = useTranslations();
  const [revealed, setRevealed] = useState(false);
  const chosenIcon = IDEA_CHOICES.find((c) => c.id === selectedChoiceId)?.icon ?? null;

  return (
    <Card variant="activity" className="mt-sm">
      <h2 className="font-display text-md font-bold">{t("realLifeQuests.visualPilot.chooseIdeaTitle")}</h2>
      <div className="mt-2xs grid grid-cols-2 gap-2xs sm:grid-cols-4">
        {IDEA_CHOICES.map((choice) => (
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
            <span aria-hidden="true" className="text-xl text-ink/30">→</span>
            <PilotIcon name={revealed ? "listenerHappy" : "listener"} className="h-14 w-14 text-ink/60" />
          </div>
          <Button type="button" variant="secondary" size="large" className="mt-xs" onClick={() => setRevealed(true)}>
            {t("realLifeQuests.visualPilot.shareIdeaButton")}
          </Button>
          {revealed && (
            <p className="mt-xs flex items-center gap-2xs text-sm font-semibold text-teal">
              <PilotIcon name="star" className="h-5 w-5" />
              {t("realLifeQuests.visualPilot.listenerHappyLabel")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
