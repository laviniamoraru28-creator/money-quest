"use client";
import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AcademyCertificateReward } from "@/components/AcademyCertificateReward";
import type { AgeBand } from "@/types/database.types";

import lessons from "@/content/ai-quest/lessons.json";
import { useAnswerOrder } from "@/lib/answer-order";
import type { Locale } from "@/i18n/config";
import { milestones } from "@/content/quest-milestones";

type Option = { label: string; icon?: string; correct?: boolean; feedback?: string };
type Mission = {
  prompt: string; hint: string; options: Option[]; evidence?: string;
  workshop?: { question: string; reply: string }[];
  calculation?: { answer: number; label: string };
};

function MissionCard({ title, mission, number, onComplete }: {
  title: string; mission: Mission; number: number; onComplete: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations();
  const ordered = useAnswerOrder(mission.options);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const [reply, setReply] = useState("");
  const [estimate, setEstimate] = useState("");
  const answer = (correct: boolean, message = mission.hint) => {
    setSolved(correct);
    setFeedback(message);
  };
  return (
    <Card variant="activity" className="space-y-4">
      <p>{number} / 5</p>
      <h2 id="ai-mission" tabIndex={-1} className="font-display text-2xl font-bold">{title}</h2>
      <p>{mission.prompt}</p>
      {mission.evidence && <p className="rounded-xl bg-cream p-4 text-xl text-ink">{mission.evidence}</p>}
      <ReadAloudButton uiLocale={locale} text={[title, mission.prompt, mission.evidence, ...ordered.map(item => item.label)].filter(Boolean).join(". ")} />
      {mission.workshop && <div className="grid gap-2">
        {mission.workshop.map(example => <Button key={example.question} variant="secondary" aria-pressed={reply === example.reply} onClick={() => setReply(example.reply)}>{example.question}</Button>)}
        {reply && <div role="status"><p>{reply}</p><ReadAloudButton uiLocale={locale} text={reply}/></div>}
      </div>}
      {mission.calculation ? <form onSubmit={event => {
        event.preventDefault();
        answer(estimate.trim() !== "" && Number(estimate) === mission.calculation?.answer);
      }} className="grid gap-3">
        <label>{mission.calculation.label}<input type="number" step="1" required inputMode="numeric" value={estimate} disabled={solved}
          onChange={event => setEstimate(event.target.value)} className="ml-2 w-28 rounded-lg border-2 border-teal p-2 text-ink"/></label>
        <Button type="submit" disabled={solved}>{t("lesson.checkMyAnswer")}</Button>
      </form> : <div className="grid gap-3">
        {ordered.map(option => (
          <Button key={option.label} variant="secondary" disabled={solved || (!!mission.workshop && !reply)} onClick={() => answer(!!option.correct, option.feedback || mission.hint)}>
            {option.icon && <span aria-hidden="true" className="mr-2 text-2xl">{option.icon}</span>}{option.label}
          </Button>
        ))}
      </div>}
      <p role="status">{feedback && (solved ? "✓ " : t("common.tryAgain") + ". ")}{feedback}</p>
      {feedback && <ReadAloudButton uiLocale={locale} text={feedback} />}
      {solved && <Button onClick={onComplete}>{t("entrepreneurQuest.continueButton")}</Button>}
    </Card>
  );
}

function Challenge({ band }: { band: AgeBand }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const lab = useTranslations("entrepreneurQuest.aiLab");
  const c = lessons[locale];
  const { state, completeActivity } = useLocalProgress();
  const id = `ai-quest-${band}`;
  const stepId = (index: number) => `${id}-lesson-${index + 1}`;
  const explorer = band === "explorer";
  const pro = band === "strategist";
  const sales = pro ? 120 : 30;
  const costs = pro ? [42, 18] : [12];
  const balance = sales - costs.reduce((sum, cost) => sum + cost, 0);
  const counted = explorer ? 3 : balance;
  const missions: Mission[] = [
    {
      prompt: c.definition + " " + c.helperTask,
      evidence: explorer ? "🤖 💭 → 🧒" : lab("askAi.intro"),
      workshop: explorer ? undefined : (pro ? ["compare-options","analyse-feedback"] : ["brainstorm-ideas","marketing-ideas"]).map(key => ({
        question:lab("askAi.questions." + key + ".question"), reply:lab("askAi.questions." + key + ".answer"),
      })),
      hint: c.definition,
      options: [{label:c.suggestIdeas,icon:"💡",correct:true},{label:c.decideForAll,icon:"👑"}],
    },
    explorer ? {
      prompt: c.posterTask, hint: c.clearPrompt,
      options: [{label:c.clearPrompt,icon:"🎨💧",correct:true},{label:c.vaguePrompt,icon:"❔"}],
    } : {
      prompt: c.promptTask, hint: c.promptRetry,
      options: (pro ? ["poor","better","best"] : ["poor","better"]).map(key => ({
        label:lab("promptQuality.options." + key), correct:key !== "poor", feedback:key === "poor" ? c.promptRetry : c.promptSuccess,
      })),
    },
    {
      prompt: explorer ? c.coinTask : c.budgetTask,
      evidence: (explorer ? "🪙 🪙 🪙" : c.sales + ": " + sales + " · " + c.costs + ": " + costs.join(" + ")) + " · " + c.aiEstimate + ": " + (counted + 1),
      calculation: explorer ? undefined : {answer: balance, label:c.yourTotal},
      hint: explorer ? c.countHint : sales + " − " + costs.join(" − ") + " = " + balance,
      options: [counted-1,counted,counted+1].map(n => ({label:String(n),correct:n === counted})),
    },
    explorer ? {
      prompt: c.appleTask, evidence: "🍎 🍎 🍎 🍎 · " + c.aiEstimate + ": 3", hint: c.compare,
      options: [{label:"3"},{label:"4",correct:true}],
    } : {
      prompt: lab("wrongAnswer.aiSuggestion"), evidence: lab("wrongAnswer.realData"), hint: lab("wrongAnswer.intro"),
      options: (pro ? ["trust-the-ai","ask-ai-to-explain","check-the-data-first"] : ["trust-the-ai","check-the-data-first"]).map(key => ({
        label:lab("wrongAnswer.choices." + key + ".label"), feedback:lab("wrongAnswer.choices." + key + ".consequence"), correct:key === "check-the-data-first",
      })),
    },
    {
      prompt: lab("privacy.quizQuestion"), hint: c.privacy,
      options: [
        {label:lab("privacy.quizOptions.product-name"),icon:"📦",correct:true},
        {label:lab("privacy.quizOptions.real-address"),icon:"🏠"},
        ...(!explorer ? [{label:lab("privacy.quizOptions.customer-phone-number"),icon:"📞"}] : []),
      ],
    },
  ];
  const current = missions.findIndex((_, index) => !state.completedActivityIds.includes(stepId(index)));
  const mission = missions[current];
  const completed = state.completedActivityIds.includes(id);
  return (
    <>
      {mission ? (
        <MissionCard key={stepId(current)} number={current + 1} title={c.titles[current]!} mission={mission} onComplete={() => {
          completeActivity(stepId(current), true, 0, 0);
          if (current === missions.length - 1) completeActivity(id, true, 0, 0);
        }} />
      ) : (
        <Card variant="activity" className="space-y-4">
          <Image unoptimized className="mx-auto" alt="" src="/cinematic/rewards/badge-ai.webp" width={120} height={120} />
          <p role="status">{milestones[locale][5]}</p>
          {!completed && <Button onClick={() => completeActivity(id,true,0,0)}>{t("entrepreneurQuest.continueButton")}</Button>}
          <Link href="/play" className="block min-h-12 underline">{t("nav.backToWorldMap")}</Link>
        </Card>
      )}
      <AcademyCertificateReward />
    </>
  );
}
export default function AiQuest() {
  const { state, isLoaded } = useLocalProgress(),
    t = useTranslations();
  return (
    <main
      data-quest="ai"
      id="main-content"
      className="mq-cinematic mq-learning mx-auto min-h-screen max-w-2xl space-y-6 p-5"
    >
      <h1 className="font-display text-3xl font-bold">AI Quest</h1>
      {isLoaded &&
        (state.ageBand ? (
          <Challenge key={state.ageBand} band={state.ageBand} />
        ) : (
          <Link href="/#levels-heading">{t("play.chooseYourLevel")}</Link>
        ))}
    </main>
  );
}
