"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {cinematicCopy} from "@/content/cinematic-copy";
import {type Locale} from "@/i18n/config";
import {type AgeBand} from "@/types/database.types";
import {useLocalProgress} from "@/lib/local-progress/use-local-progress";
import {AdventureAvatar,avatarKey,readAvatar} from "./AdventureAvatar";
import {CinematicScene} from "./CinematicScene";

const worlds=[
 {key:"money",title:"Money Quest",href:"/play"},
 {key:"entrepreneur",title:"Entrepreneur Quest",href:"/entrepreneur-quest"},
 {key:"leadership",title:"Leadership Quest",href:"/leadership-quest"},
 {key:"ai",title:"AI Quest",href:"/ai-quest"}
];
const action="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c9953d] bg-[#14263e] px-5 py-3 font-bold text-white";
export function Adventure({band}:{band?:AgeBand}){
 const copy=cinematicCopy[useLocale() as Locale], t=useTranslations();
 const [choice,setChoice]=useState(0),[step,setStep]=useState<"avatar"|"enter"|"map"|"intro">("avatar");
 const [quest,setQuest]=useState(worlds[0]!);
 const {setAgeBand}=useLocalProgress();
 useEffect(()=>{setChoice(readAvatar());if(band)setAgeBand(band);},[band,setAgeBand]);
 const title=step==="avatar"?copy[0]:step==="enter"?copy[1]:step==="map"?copy[2]:quest.title;
 const clip=step==="enter"?"world/enter-world":step==="map"?"world/world-map-vertical":`quests/${quest.key}/intro`;
 return <main id="main-content" className="mx-auto max-w-4xl space-y-5 px-4 py-8 text-center">
 <h1 aria-live="polite" className="font-display text-3xl font-bold">{title}</h1>
 {step==="avatar"?<>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[1,2,3,4,5,6].map(id=>
 <button key={id} type="button" aria-label={`Avatar ${id}`} aria-pressed={choice===id} onClick={()=>{setChoice(id);try{localStorage.setItem(avatarKey,String(id));}catch{/* Session choice remains available. */}}}
 className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 bg-white p-2 aria-pressed:border-blue-700">
 <AdventureAvatar id={id} animated={choice===id}/><span>{choice===id?"✓ ":""}{id}</span></button>)}</div>
 <button disabled={!choice} className={action+" disabled:opacity-50"} onClick={()=>setStep("enter")}>{copy[1]}</button></>:
 <><CinematicScene src={`/cinematic/${clip}.mp4`} poster={`/cinematic/${clip}.webp`} className="mx-auto h-[min(44vh,420px)] w-full rounded-2xl bg-[#14263e] object-contain"/>
 {step==="enter" && <button className={action} onClick={()=>setStep("map")}>{copy[2]}</button>}
 {step==="map" && <div className="grid gap-3 sm:grid-cols-2">{worlds.map(world=><button key={world.key} className={action} onClick={()=>{setQuest(world);setStep("intro");}}>{world.title}</button>)}</div>}
 {step==="intro" && <Link className={action} href={quest.href}>{copy[3]}</Link>}
 <div><button className="min-h-11 underline" onClick={()=>setStep(step==="intro"?"map":"avatar")}>{t("common.back")}</button></div></>}
 </main>;
}
