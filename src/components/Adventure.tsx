"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useAccessibilityPrefs } from "@/lib/accessibility/use-accessibility-preferences";
import { skipScene, cinematicCopy } from "@/content/cinematic-copy";
import { type Locale } from "@/i18n/config";
import { type AgeBand } from "@/types/database.types";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { AdventureAvatar, avatarKey, readAvatar } from "./AdventureAvatar";
import { CinematicScene } from "./CinematicScene";

import { milestones, questBadges } from "@/content/quest-milestones";
import { isCertificateEligible } from "@/lib/certificates/eligibility";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";

import { cinematicQuests as worlds } from "@/content/cinematic-quests";

const action =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c9953d] bg-[#14263e] px-5 py-3 font-bold text-white";
export function Adventure({ band }: { band?: AgeBand }) {
  const locale = useLocale() as Locale;
  const copy = cinematicCopy[locale],
    t = useTranslations();
  const [choice, setChoice] = useState(0),
    [step, setStep] = useState<"avatar" | "enter" | "map" | "intro">("avatar");
  const [quest, setQuest] = useState(worlds[0]!);
  const { setAgeBand, state, isLoaded } = useLocalProgress();
  const business = useEntrepreneurQuest();
  const leadership = useLeadershipQuest();
  const loaded = isLoaded && business.isLoaded && leadership.isLoaded;
  const completed = {
    money: !!state.ageBand && isCertificateEligible(state.completedActivityIds, state.ageBand),
    entrepreneur: business.state.pitchCompleted,
    leadership: leadership.state.completedMissionIds.includes("final-challenge"),
    ai: state.completedActivityIds.includes(`ai-quest-${state.ageBand}`),
  };
  const nextQuest = worlds.find(world => !completed[world.key])?.key;
  useEffect(() => {
    setChoice(readAvatar());
    if (band) setAgeBand(band);
  }, [band, setAgeBand]);
  const prefs = useAccessibilityPrefs();
  const [transition, setTransition] = useState("");
  const allowTransition =
    prefs.presentation === "cinematic" &&
    !prefs.reducedMotion &&
    !prefs.focusMode;
  const move = (destination: typeof step, video: string) => {
    setStep(destination);
    if (
      allowTransition &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      setTransition(video);
  };
  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(() => setTransition(""), 1400);
    return () => clearTimeout(timer);
  }, [transition]);
  const title =
    step === "avatar"
      ? copy[0]
      : step === "enter"
        ? copy[1]
        : step === "map"
          ? copy[2]
          : quest.title;
  const clip =
    step === "enter"
      ? "world/enter-world"
      : step === "map"
        ? "world/world-map-vertical"
        : `quests/${quest.key}/intro`;
  return (
    <main
      id="main-content"
      className={step === "enter" ? "mq-entry-screen" : "mx-auto max-w-4xl space-y-5 px-4 py-8 text-center"}
    >
      <h1 aria-live="polite" className={step === "enter" ? "sr-only" : "font-display text-3xl font-bold"}>
        {title}
      </h1>
      {transition && allowTransition ? (
        <div className="space-y-4">
          <CinematicScene
            controls={false}
            src={`/cinematic/world/transitions/${transition}.mp4`}
            poster={`/cinematic/world/transitions/${transition}.webp`}
            className="mx-auto max-h-72 w-full object-contain"
          />
          <button
            type="button"
            className={action}
            onClick={() => setTransition("")}
          >
            {skipScene[locale]}
          </button>
        </div>
      ) : step === "avatar" ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <button
                key={id}
                type="button"
                aria-label={`Avatar ${id}`}
                aria-pressed={choice === id}
                onClick={() => {
                  setChoice(id);
                  try {
                    localStorage.setItem(avatarKey, String(id));
                  } catch {
                    /* Session choice remains available. */
                  }
                }}
                className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 bg-white p-2 aria-pressed:border-[#96681c]"
              >
                <AdventureAvatar id={id} animated={choice === id} />
                <span>
                  {choice === id ? "✓ " : ""}
                  {id}
                </span>
              </button>
            ))}
          </div>
          <button
            disabled={!choice}
            className={action + " disabled:opacity-50"}
            onClick={() => setStep("enter")}
          >
            {copy[1]}
          </button>
        </>
      ) : (
        <>
          <CinematicScene
            autoplay={step === "enter"}
            src={`/cinematic/${clip}.mp4`}
            poster={`/cinematic/${clip}.webp`}
            className={step === "enter" ? "mq-entry-media" : "mx-auto h-[min(44vh,420px)] w-full rounded-2xl bg-[#14263e] object-contain"}
          />
          {step === "enter" && (
            <button
              className={action}
              onClick={() => setStep("map")}
            >
              {copy[2]}
            </button>
          )}
          {step === "map" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {worlds.map((world) => (
                <button
                  key={world.key}
                  aria-label={world.title}
                  aria-describedby={loaded ? `map-status-${world.key}` : undefined}
                  className={action + " flex-col gap-2"}
                  onClick={() => {
                    setQuest(world);
                    move("intro", "progress-path");
                  }}
                >
                  <Image
                    unoptimized
                    alt=""
                    width={240}
                    height={100}
                    className="h-24 w-full rounded-lg object-contain"
                    src={`/cinematic/quests/${world.key}/intro.webp`}
                  />
                  {world.title}
                  {loaded && <span id={`map-status-${world.key}`} className="flex items-center gap-2 text-sm">
                    {completed[world.key] && <Image unoptimized alt="" width={36} height={36} src={`/cinematic/rewards/badge-${questBadges[world.key]}.webp`}/>}
                    {completed[world.key] ? milestones[locale][1] : nextQuest === world.key ? milestones[locale][0] : ""}
                  </span>}
                </button>
              ))}
            </div>
          )}
          {step === "intro" && (
            <Link className={action} href={quest.href}>
              {copy[3]}
            </Link>
          )}
          <div>
            <button
              className="min-h-11 underline"
              onClick={() => setStep(step === "intro" ? "map" : "avatar")}
            >
              {t("common.back")}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
