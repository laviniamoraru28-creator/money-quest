"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MechanicProps } from "../registry";
import type { MultipleChoiceRound } from "../types";
import { useAnswerOrder } from "@/lib/answer-order";

export function MultipleChoiceMechanic({ round, onAnswer, isResolved }: MechanicProps<MultipleChoiceRound>) {
  const t = useTranslations();
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  // Display order only — correctness below always compares the
  // option's own text against round.correctOption, never a position.
  const options = useAnswerOrder(round.options);

  function submit() {
    if (!selected) return;
    setChecked(true);
    onAnswer(selected === round.correctOption);
  }

  return (
    <div>
      <fieldset disabled={isResolved || checked}>
        <legend className="sr-only">{t("lesson.answerOptions")}</legend>
        <div className="grid gap-2xs">
          {options.map((option) => {
            const isSelected = selected === option;
            const showAsCorrect = checked && option === round.correctOption;
            const showAsIncorrect = checked && isSelected && option !== round.correctOption;

            return (
              <label
                key={option}
                className={[
                  "flex min-h-touch-min-child cursor-pointer items-center gap-xs rounded-md border-2 px-sm py-2xs text-base",
                  showAsCorrect ? "border-success bg-success/10" : "",
                  showAsIncorrect ? "border-error bg-error/10" : "",
                  !showAsCorrect && !showAsIncorrect && isSelected ? "border-teal bg-teal/5" : "border-ink/15",
                ].join(" ")}
              >
                <input type="radio" name={`mc-${round.id}`} value={option} checked={isSelected} onChange={() => setSelected(option)} />
                {option}
                {showAsCorrect && (
                  <span className="ml-auto text-success">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only"> {t("lesson.correctAnswerSuffix")}</span>
                  </span>
                )}
                {showAsIncorrect && (
                  <span className="ml-auto text-error">
                    <span aria-hidden="true">✗</span>
                    <span className="sr-only"> {t("lesson.yourAnswerNotQuiteSuffix")}</span>
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {!checked && !isResolved && (
        <button
          type="button"
          disabled={!selected}
          onClick={submit}
          className="mt-md min-h-touch-min-child w-full rounded-lg bg-teal px-md py-xs font-medium text-white shadow-resting disabled:opacity-40"
        >
          {t("lesson.checkMyAnswer")}
        </button>
      )}
    </div>
  );
}
