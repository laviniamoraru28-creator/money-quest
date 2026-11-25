"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { REGIONAL_LOCALES, type Locale } from "@/i18n/config";
import { shuffleArray } from "@/lib/answer-order";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";
import { choiceIcons, questionLimit, type Answer, type AssistantAction, type AssistantStatus } from "@/lib/lesson-assistant/protocol";

const endpoint = "/api/lesson-assistant";
const shortcuts = [
  { action: "understand", icon: "💡" },
  { action: "more", icon: "📚" },
  { action: "challenge", icon: "🎯" },
] as const;
const statuses = ["disabled", "daily", "monthly", "unavailable", "scope", "private"];

export function LessonAssistant({ lessonId, locale }: { lessonId: string; locale: Locale }) {
  const t = useTranslations("lessonAssistant");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // Readiness lives here, checked once as soon as the lesson page mounts -
  // not re-fetched on every panel toggle. Lifting it out of AssistantPanel
  // (which used to run this same fetch every time it mounted, i.e. every
  // single open) closes a real focus-order race: AssistantPanel's
  // interactive content only exists once `ready` is known, so opening the
  // panel and tabbing into it before that fetch resolved could send focus
  // straight past the panel's (not yet rendered) controls. Checking
  // availability this early gives the fetch the whole rest of the page's
  // load and hydration time to resolve before anyone can open the panel at
  // all, instead of racing it against a keypress the instant it opens.
  // Staleness over a long-open session is still covered separately by
  // ask()'s own pre-flight recheck below.
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    void fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("availability");
        const data = await response.json();
        setReady(data.ready === true);
        if (data.ready !== true) setStatus("disabled");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("unavailable"); })
      .finally(() => { if (!controller.signal.aborted) { active.current = null; setBusy(false); } });
    return () => active.current?.abort();
  }, []);

  return (
    <div className="min-w-0" data-lesson-assistant>
      <Button type="button" variant="secondary" size="large" className="w-full motion-reduce:transform-none"
        aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">💬</span>{t("title")}
      </Button>
      <div id={panelId} hidden={!open}>
        {open && (
          <AssistantPanel lessonId={lessonId} locale={locale} ready={ready} busy={busy} status={status}
            setReady={setReady} setBusy={setBusy} setStatus={setStatus} />
        )}
      </div>
    </div>
  );
}

function AssistantPanel({ lessonId, locale, ready, busy, status, setReady, setBusy, setStatus }: {
  lessonId: string;
  locale: Locale;
  ready: boolean;
  busy: boolean;
  status: AssistantStatus | null;
  setReady: (value: boolean) => void;
  setBusy: (value: boolean) => void;
  setStatus: (value: AssistantStatus | null) => void;
}) {
  const t = useTranslations("lessonAssistant");
  const questionId = useId();
  const privacyId = useId();
  const active = useRef<AbortController | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(REGIONAL_LOCALES[locale], true);

  async function ask(action: AssistantAction) {
    if (!ready || active.current || (action === "question" && !question.trim())) return;
    const controller = new AbortController();
    active.current = controller;
    if (isSpeaking) stop();
    setBusy(true);
    setStatus(null);
    setAnswer(null);
    setPicked(null);
    try {
      // Refresh the daily cookie before a turn if the panel stayed open overnight.
      const session = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
      if (!session.ok || (await session.json()).ready !== true) {
        setReady(false);
        setStatus("disabled");
        return;
      }
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ lessonId, locale, action, ...(action === "question" ? { question, followUp } : {}) }),
      });
      const data = await response.json();
      if (response.ok && data.answer) {
        const reply = data.answer as Answer;
        if (reply.challenge) {
          const { choices, correct, explanation } = reply.challenge;
          const ordered = shuffleArray(choices);
          setAnswer({ ...reply, challenge: { choices: ordered, correct: ordered.indexOf(choices[correct]!), explanation } });
        } else {
          setAnswer(reply);
        }
        setFollowUp(data.followUp ?? "");
        if (action === "question") setQuestion("");
      } else {
        const reason = statuses.includes(data.status) ? data.status as AssistantStatus : "unavailable";
        setStatus(reason);
        if (["daily", "monthly", "disabled"].includes(reason)) setReady(false);
        if (reason === "scope" || reason === "private") {
          setFollowUp("");
          setQuestion("");
        }
      }
    } catch {
      if (!controller.signal.aborted) setStatus("unavailable");
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const feedback = answer?.challenge && picked !== null
    ? (picked === answer.challenge.correct ? `${t("correct")} ${answer.challenge.explanation}` : t("retry"))
    : "";
  const narration = answer
    ? [answer.text, ...(answer.challenge?.choices.map((choice) => choice.label) ?? []), feedback].join("\n")
    : [t("privacy"), ...shortcuts.map(({ action }) => t(action))].join("\n");

  return (
    <Card variant="activity" className="mt-2xs min-w-0 space-y-sm break-words">
      <p id={privacyId} className="text-sm text-ink/80">{t("privacy")}</p>
      {isSupported && ready && (
        <Button type="button" size="large" variant="secondary"
          onClick={() => isSpeaking ? stop() : speak(narration)}>
          <span aria-hidden="true">🔊</span>{isSpeaking ? t("stop") : t("listen")}
        </Button>
      )}
      {ready && (
        <>
          <div className="grid gap-2xs">
            {shortcuts.map(({ action, icon }) => (
              <Button key={action} type="button" size="large" variant="secondary" className="justify-start text-left"
                aria-disabled={busy} onClick={() => void ask(action)}>
                <span aria-hidden="true">{icon}</span>{t(action)}
              </Button>
            ))}
          </div>
          <form className="grid gap-2xs" onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void ask("question");
          }}>
            <label htmlFor={questionId} className="font-medium">{t("question")}</label>
            <input id={questionId} value={question} onChange={(event) => setQuestion(event.target.value)}
              autoComplete="off" readOnly={busy} maxLength={questionLimit} aria-describedby={privacyId}
              className="min-h-touch-min-child min-w-0 rounded-sm border border-teal bg-fog px-sm text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal" />
            <Button type="submit" size="large" className="motion-reduce:transform-none" aria-disabled={busy || !question.trim()}>
              {t("send")}
            </Button>
          </form>
        </>
      )}
      <p role="status" className={busy || status ? "text-base text-ink" : "sr-only"}>
        {busy ? t("loading") : status ? t(status) : ""}
      </p>
      <div aria-live="polite" aria-atomic="true">
        {answer && <p className="whitespace-pre-wrap text-base">{answer.text}</p>}
      </div>
      {answer?.challenge && (
        <div className="grid gap-2xs">
          {answer.challenge.choices.map(({ label, icon }, index) => (
            <Button key={label} type="button" size="large" variant="secondary" className="justify-start text-left"
              aria-pressed={picked === index} onClick={() => { if (isSpeaking) stop(); setPicked(index); }}>
              <span aria-hidden="true" className="text-2xl">{choiceIcons[icon]}</span>{label}
            </Button>
          ))}
          <p role="status">{feedback}</p>
        </div>
      )}
      {(ready || status === "scope" || status === "private") && (
        <Link href="/contact" className="inline-flex min-h-touch-min items-center text-sm text-teal-text underline">
          {t("report")}
        </Link>
      )}
    </Card>
  );
}
