"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import {
  EQ_AI_LAB_QA_IDS,
  EQ_AI_PROMPT_QUALITY_OPTION_IDS,
  EQ_AI_PROMPT_QUALITY_CORRECT_ID,
  EQ_AI_WRONG_ANSWER_EVENT_ID,
  EQ_AI_PRIVACY_QUIZ_OPTION_IDS,
  EQ_AI_PRIVACY_QUIZ_SAFE_OPTION_ID,
} from "@/content/entrepreneur-quest/structures";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SimulatedAiMessage } from "@/components/entrepreneur-quest/SimulatedAiMessage";
import { MissionMechanic } from "@/game-engine/mechanics/MissionMechanic";
import { MultipleChoiceMechanic } from "@/game-engine/mechanics/MultipleChoiceMechanic";
import type { MissionRound, MultipleChoiceRound } from "@/game-engine/types";

const AI_LAB_STEP_IDS = ["ask-ai", "prompt-quality", "wrong-answer", "privacy"];

/**
 * "AI Business Lab" (brief sections 15-18) — one guided, four-step
 * page. Every word here is pre-written; there is no live model call
 * anywhere in this file (see SimulatedAiMessage's own doc comment).
 * The four facets: what AI can help with (pure lookup), asking good
 * questions (a genuine correct-answer case), AI being wrong (check the
 * data, don't just trust it), and privacy (never share real personal
 * or confidential information with any AI tool).
 */
export default function AiLabPage() {
  const uiLocale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { state: progressState, isLoaded: progressLoaded } = useLocalProgress();
  const { state, isLoaded, recordDecision, completeAiLabActivity } = useEntrepreneurQuest();
  const [step, setStep] = useState(0);
  const [viewedQaId, setViewedQaId] = useState<string | null>(null);

  if (!isLoaded || !progressLoaded) {
    return <div className="grid min-h-screen place-items-center bg-fog text-ink/60">{t("common.loading")}</div>;
  }

  const stepId = AI_LAB_STEP_IDS[step];

  function advance(id: string) {
    completeAiLabActivity(id);
    if (step === AI_LAB_STEP_IDS.length - 1) {
      router.push("/entrepreneur-quest/run");
    } else {
      setStep((s) => s + 1);
      setViewedQaId(null);
    }
  }

  const wrongAnswerRound: MissionRound = {
    id: EQ_AI_WRONG_ANSWER_EVENT_ID,
    mechanic: "mission",
    prompt: "",
    hint: "",
    explanation: "",
    situation: t("entrepreneurQuest.aiLab.wrongAnswer.realData"),
    choices: ["trust-the-ai", "check-the-data-first", "ask-ai-to-explain"].map((key) => ({
      key,
      label: t(`entrepreneurQuest.aiLab.wrongAnswer.choices.${key}.label`),
      consequence: t(`entrepreneurQuest.aiLab.wrongAnswer.choices.${key}.consequence`),
    })),
  };

  const promptQualityOptions = EQ_AI_PROMPT_QUALITY_OPTION_IDS.map((id) => t(`entrepreneurQuest.aiLab.promptQuality.options.${id}`));
  const promptQualityRound: MultipleChoiceRound = {
    id: "ai-prompt-quality",
    mechanic: "multiple-choice",
    prompt: "",
    hint: "",
    explanation: "",
    options: promptQualityOptions,
    correctOption: t(`entrepreneurQuest.aiLab.promptQuality.options.${EQ_AI_PROMPT_QUALITY_CORRECT_ID}`),
  };

  const privacyOptions = EQ_AI_PRIVACY_QUIZ_OPTION_IDS.map((id) => t(`entrepreneurQuest.aiLab.privacy.quizOptions.${id}`));
  const privacyRound: MultipleChoiceRound = {
    id: "ai-privacy-quiz",
    mechanic: "multiple-choice",
    prompt: "",
    hint: "",
    explanation: "",
    options: privacyOptions,
    correctOption: t(`entrepreneurQuest.aiLab.privacy.quizOptions.${EQ_AI_PRIVACY_QUIZ_SAFE_OPTION_ID}`),
  };

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[700px]">
        <Link
          href="/entrepreneur-quest/run"
          className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal transition-colors duration-quick hover:bg-teal/5"
        >
          <span aria-hidden="true">←</span> {t("entrepreneurQuest.run.hubTitle")}
        </Link>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("entrepreneurQuest.aiLab.hubTitle")}</h1>
        <span className="mt-2xs inline-block rounded-full bg-teal/10 px-sm py-3xs text-sm font-medium text-teal">
          {t("entrepreneurQuest.stageProgress", { current: step + 1, total: AI_LAB_STEP_IDS.length })}
        </span>

        <Card variant="activity" className="mt-sm">
          {stepId === "ask-ai" && (
            <div>
              <h2 className="font-display text-lg font-bold">{t("entrepreneurQuest.aiLab.askAi.title")}</h2>
              <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.aiLab.askAi.intro")}</p>
              <div className="mt-sm grid gap-2xs">
                {EQ_AI_LAB_QA_IDS.map((qaId) => (
                  <button
                    key={qaId}
                    type="button"
                    onClick={() => setViewedQaId(qaId)}
                    className={[
                      "min-h-touch-min-child w-full rounded-sm border-2 px-sm py-2xs text-left text-sm font-medium",
                      viewedQaId === qaId ? "border-teal bg-teal/5" : "border-ink/15",
                    ].join(" ")}
                  >
                    {t(`entrepreneurQuest.aiLab.askAi.questions.${qaId}.question`)}
                  </button>
                ))}
              </div>
              {viewedQaId && <SimulatedAiMessage>{t(`entrepreneurQuest.aiLab.askAi.questions.${viewedQaId}.answer`)}</SimulatedAiMessage>}
              <Button variant="quest-primary" className="mt-sm w-full" disabled={!viewedQaId} onClick={() => advance("ask-ai")}>
                {t("entrepreneurQuest.continueButton")}
              </Button>
            </div>
          )}

          {stepId === "prompt-quality" && (
            <div>
              <h2 className="font-display text-lg font-bold">{t("entrepreneurQuest.aiLab.promptQuality.title")}</h2>
              <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.aiLab.promptQuality.intro")}</p>
              <p className="mt-sm font-medium">{t("entrepreneurQuest.aiLab.promptQuality.question")}</p>
              <div className="mt-2xs">
                <MultipleChoiceMechanic round={promptQualityRound} currencyCode={progressState.currencyCode} uiLocale={uiLocale} usesCurrency={false} onAnswer={() => advance("prompt-quality")} isResolved={false} />
              </div>
            </div>
          )}

          {stepId === "wrong-answer" && (
            <div>
              <h2 className="font-display text-lg font-bold">{t("entrepreneurQuest.aiLab.wrongAnswer.title")}</h2>
              <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.aiLab.wrongAnswer.intro")}</p>
              <SimulatedAiMessage>{t("entrepreneurQuest.aiLab.wrongAnswer.aiSuggestion")}</SimulatedAiMessage>
              <div className="mt-sm">
                <MissionMechanic
                  round={wrongAnswerRound}
                  currencyCode={progressState.currencyCode}
                  uiLocale={uiLocale}
                  usesCurrency={false}
                  onAnswer={(_isCorrect, choiceKey) => recordDecision(EQ_AI_WRONG_ANSWER_EVENT_ID, choiceKey ?? "")}
                  isResolved={false}
                />
              </div>
              {state.decisionChoices[EQ_AI_WRONG_ANSWER_EVENT_ID] !== undefined && (
                <Button variant="quest-primary" className="mt-sm w-full" onClick={() => advance("wrong-answer")}>
                  {t("entrepreneurQuest.continueButton")}
                </Button>
              )}
            </div>
          )}

          {stepId === "privacy" && (
            <div>
              <h2 className="font-display text-lg font-bold">{t("entrepreneurQuest.aiLab.privacy.title")}</h2>
              <p className="mt-2xs text-base text-ink/70">{t("entrepreneurQuest.aiLab.privacy.intro")}</p>
              <p className="mt-sm rounded-sm bg-fog p-sm text-sm text-ink/70">{t("entrepreneurQuest.safety.nameHint")}</p>
              <p className="mt-sm font-medium">{t("entrepreneurQuest.aiLab.privacy.quizQuestion")}</p>
              <div className="mt-2xs">
                <MultipleChoiceMechanic round={privacyRound} currencyCode={progressState.currencyCode} uiLocale={uiLocale} usesCurrency={false} onAnswer={() => advance("privacy")} isResolved={false} />
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
