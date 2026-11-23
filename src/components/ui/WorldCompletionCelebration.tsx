"use client";
import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import {skipScene} from "@/content/cinematic-copy";
import {type Locale} from "@/i18n/config";
import {useLocale,useTranslations} from "next-intl";
import {WORLDS} from "@/content/worlds";
import {isCertificateEligible} from "@/lib/certificates/eligibility";
import {getWorldCatalog} from "@/content/catalog";
import type {AgeBand} from "@/types/database.types";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import {CinematicScene} from "../CinematicScene";
import {AdventureAvatar} from "../AdventureAvatar";

type Progress = {ageBand?: AgeBand | null; completedActivityIds?: string[]};
import {milestones, milestoneIndex, questBadges, type QuestKey} from "@/content/quest-milestones";
type Celebration = {title:string; quest?:QuestKey; sequence:number};

export function WorldCompletionCelebration() {
 const t = useTranslations(),locale=useLocale() as Locale;
 const {reducedMotion} = useAccessibilityPrefs();
 const [celebration, setCelebration] = useState<Celebration | null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const previous = useRef<Progress | null>(null);
 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const sequence = useRef(0);
 useEffect(() => {
  try {
   const stored = window.localStorage.getItem("moneyquest_local_progress_v1");
   previous.current = stored ? JSON.parse(stored) as Progress : {completedActivityIds: []};
  } catch {previous.current = {completedActivityIds: []};}
  const show=(title:string,quest?:QuestKey)=>{
   setCelebration({title,quest,sequence:++sequence.current});
   if(timer.current)clearTimeout(timer.current);
   if (!quest) timer.current=setTimeout(()=>setCelebration(null),6500);
  };
  const onQuest=(event:Event)=>{
   const key=(event as CustomEvent<string>).detail;
   if(key==="entrepreneur"||key==="leadership")show(t(`${key}Quest.hubTitle`),key);
  };
  const onProgress = (event: Event) => {
   const next = (event as CustomEvent<Progress>).detail;
   const before = previous.current;
   previous.current = next;
   if (!before || !next?.ageBand || !Array.isArray(next.completedActivityIds) ||
       !Array.isArray(before.completedActivityIds) || before.ageBand !== next.ageBand) return;
   const oldIds = new Set(before.completedActivityIds);
   const newIds = new Set(next.completedActivityIds);
   if (newIds.size <= oldIds.size) return;
   if(newIds.has(`ai-quest-${next.ageBand}`)&&!oldIds.has(`ai-quest-${next.ageBand}`)){show("AI Quest","ai");return;}
   if(isCertificateEligible(next.completedActivityIds,next.ageBand)&&!isCertificateEligible(before.completedActivityIds,next.ageBand)){show("Money Quest","money");return;}
   for (const world of WORLDS) {
    const catalog = getWorldCatalog(world.id, next.ageBand, t);
    if (!catalog.length) continue;
    if (catalog.every(entry => newIds.has(entry.id)) && !catalog.every(entry => oldIds.has(entry.id))) {
     show(t(`levels.${world.id}`));
     break;
    }
   }
  };
  window.addEventListener("moneyquest-progress", onProgress);
  window.addEventListener("moneyquest-quest-complete",onQuest);
  return () => {window.removeEventListener("moneyquest-quest-complete",onQuest);window.removeEventListener("moneyquest-progress", onProgress);if (timer.current) clearTimeout(timer.current);};
 }, [t]);
 useEffect(()=>{
  const element=dialog.current;
  if(!element||!celebration)return;
  element.showModal();
  return ()=>element.close();
 },[celebration]);
 if (!celebration) return null;
 return <dialog ref={dialog} onCancel={()=>setCelebration(null)} aria-labelledby="mq-world-celebration-heading" className={celebration.quest ? "fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-auto bg-[#14263e] p-4 text-center open:grid open:place-items-center" : "m-auto max-w-[94vw] rounded-3xl bg-transparent p-0 backdrop:bg-ink/80"}>
  <div key={celebration.sequence} data-reduced-motion={reducedMotion ? "true" : "false"}
   className="relative w-full max-w-lg rounded-3xl border-4 border-gold bg-cream p-8 text-center shadow-floating">
   {celebration.quest && <Image unoptimized alt="" width={48} height={48} className="mx-auto" src="/cinematic/rewards/crystal.webp"/>}
   <AdventureAvatar animated={!reducedMotion}/>
   <div className="relative isolate mx-auto mb-3 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-gold bg-ink"><CinematicScene controls={false} className="absolute inset-0 h-full w-full object-cover mix-blend-screen" src={celebration.quest?"/cinematic/rewards/golden-particles.mp4":"/cinematic/rewards/star-animation.mp4"} poster={celebration.quest?"/cinematic/rewards/golden-particles.webp":"/cinematic/rewards/star-animation.webp"}/><Image unoptimized alt="" width={56} height={56} className="relative object-contain" src={celebration.quest?`/cinematic/rewards/badge-${questBadges[celebration.quest]}.webp`:"/cinematic/rewards/star.webp"}/></div>
   <h2 id="mq-world-celebration-heading" className="text-2xl font-bold">{celebration.title}</h2>
   <p className="mt-3 text-lg">{celebration.quest ? milestones[locale][milestoneIndex[celebration.quest]] : t("play.worldSequenceComplete")}</p>
   <button type="button" autoFocus onClick={() => {if (timer.current) clearTimeout(timer.current);setCelebration(null);}}
    className="mt-6 min-h-12 rounded-xl bg-teal px-8 py-3 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold">
    {skipScene[locale]}
   </button>
  </div>
 </dialog>;
}
