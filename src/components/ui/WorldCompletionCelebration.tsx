"use client";
import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {WORLDS} from "@/content/worlds";
import {getWorldCatalog} from "@/content/catalog";
import type {AgeBand} from "@/types/database.types";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import Image from "next/image";
import {AdventureAvatar} from "../AdventureAvatar";

type Progress = {ageBand?: AgeBand | null; completedActivityIds?: string[]};
type Celebration = {worldId: string; sequence: number};

export function WorldCompletionCelebration() {
 const t = useTranslations();
 const {reducedMotion} = useAccessibilityPrefs();
 const [celebration, setCelebration] = useState<Celebration | null>(null);
 const previous = useRef<Progress | null>(null);
 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const sequence = useRef(0);
 useEffect(() => {
  try {
   const stored = window.localStorage.getItem("moneyquest_local_progress_v1");
   previous.current = stored ? JSON.parse(stored) as Progress : {completedActivityIds: []};
  } catch {previous.current = {completedActivityIds: []};}
  const onProgress = (event: Event) => {
   const next = (event as CustomEvent<Progress>).detail;
   const before = previous.current;
   previous.current = next;
   if (!before || !next?.ageBand || !Array.isArray(next.completedActivityIds) ||
       !Array.isArray(before.completedActivityIds) || before.ageBand !== next.ageBand) return;
   const oldIds = new Set(before.completedActivityIds);
   const newIds = new Set(next.completedActivityIds);
   if (newIds.size <= oldIds.size) return;
   for (const world of WORLDS) {
    const catalog = getWorldCatalog(world.id, next.ageBand, t);
    if (!catalog.length) continue;
    if (catalog.every(entry => newIds.has(entry.id)) && !catalog.every(entry => oldIds.has(entry.id))) {
     sequence.current += 1;
     setCelebration({worldId: world.id, sequence: sequence.current});
     if (timer.current) clearTimeout(timer.current);
     timer.current = setTimeout(() => setCelebration(null), 6500);
     break;
    }
   }
  };
  window.addEventListener("moneyquest-progress", onProgress);
  return () => {window.removeEventListener("moneyquest-progress", onProgress);if (timer.current) clearTimeout(timer.current);};
 }, [t]);
 if (!celebration) return null;
 return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 px-4 py-8"
  role="dialog" aria-modal="true" aria-labelledby="mq-world-celebration-heading">
  <div key={celebration.sequence} data-reduced-motion={reducedMotion ? "true" : "false"}
   className="relative w-full max-w-lg rounded-3xl border-4 border-gold bg-cream p-8 text-center shadow-floating">
   <AdventureAvatar animated={!reducedMotion}/>
   <div className="mb-3 flex justify-center"><Image unoptimized alt="" width={64} height={64} src="/cinematic/rewards/star.webp"/></div>
   <h2 id="mq-world-celebration-heading" className="text-2xl font-bold">{t(`levels.${celebration.worldId}`)}</h2>
   <p className="mt-3 text-lg">{t("play.worldSequenceComplete")}</p>
   <button type="button" autoFocus onClick={() => {if (timer.current) clearTimeout(timer.current);setCelebration(null);}}
    className="mt-6 min-h-12 rounded-xl bg-teal px-8 py-3 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold">
    {t("common.back")}
   </button>
  </div>
 </div>;
}
