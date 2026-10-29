"use client";
import {ActionIcon} from "@/components/ui/ActionIcon";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {Link} from "@/i18n/navigation";
import {labTaskAtLevel} from "@/content/lab-age-variants";
import type {Lab} from "@/content/learning-labs";
import {GuidePanel} from "@/components/GuidePanel";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import {AccessibilityMenu} from "@/components/ui/AccessibilityMenu";
import {useReadAloud} from "@/lib/accessibility/use-read-aloud";
const levels=["Explorer","Builder","Strategist"];
const STORE="moneyquest_labs_v1";
export default function LearningLabExperience({lab}:{lab:Lab}) {
  const [index,setIndex]=useState(0),[level,setLevel]=useState(0),[answer,setAnswer]=useState<number|null>(null),[done,setDone]=useState<string[]>([]),[storageReady,setStorageReady]=useState(false),[storageFailed,setStorageFailed]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const {stop}=useReadAloud("en-GB");
  useEffect(()=>{try {const value=JSON.parse(localStorage.getItem(STORE)||"[]");if(Array.isArray(value))setDone(value.filter((x):x is string=>typeof x==="string"))}catch{setStorageFailed(true)}setStorageReady(true)},[]);
  const item=labTaskAtLevel(lab.slug,lab.tasks[index]!,level),key=`${lab.slug}:${item.id}:${level}`;
  const choose=(next:number)=>{stop();setIndex(next);setAnswer(null);heading.current?.focus()};
  const mark=()=>{const next=Array.from(new Set([...done,key]));setDone(next);try{localStorage.setItem(STORE,JSON.stringify(next))}catch{setStorageFailed(true)}};
  return <div className="min-h-screen bg-fog"><nav aria-label="Learning navigation" className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4"><Link href="/" className="min-h-11 py-2 text-teal-text underline">Home</Link><Link href="/play" className="min-h-11 py-2 text-teal-text underline">World map</Link><Link href="/inclusive-learning" className="min-h-11 py-2 text-teal-text underline">Ways to learn</Link><Link href="/quiet-corner" className="min-h-12 rounded-xl border-2 border-teal bg-white px-4 py-3 font-bold text-teal-text">I need a break</Link><AccessibilityMenu/></nav>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-5 pb-12"><h1 className="text-3xl">{lab.title}</h1><p className="mt-3 text-lg">{lab.description}</p>
    <Image unoptimized data-learning-decoration src={`/images/money-quest/sections/${lab.slug === "brain-lab" ? "brain-lab-v2" : lab.slug}.webp`} alt="" width={640} height={640} className="mt-5 max-h-80 w-full rounded-2xl bg-cream object-contain"/><GuidePanel message="Choose a task and a level. Read or listen. Pick an answer, then try a practical activity. You can point, type, draw or use your communication tool."/>
    <fieldset className="my-5"><legend className="font-bold">Choose your challenge</legend><div className="mt-2 flex flex-wrap gap-3">{levels.map((name,i)=><button type="button" key={name} aria-pressed={level===i} onClick={()=>{stop();setLevel(i);setAnswer(null)}} className={`min-h-12 rounded-xl border-2 px-4 py-2 ${level===i?"border-teal bg-teal text-white":"border-ink/20 bg-white"}`}>{name}</button>)}</div><p className="mt-2 text-sm">Explorer (6–8): short words and concrete choices. Builder (9–11): try and explain. Strategist (12–14): compare evidence and trade-offs. Change level whenever you like.</p></fieldset>
    <nav aria-label="Choose an activity" className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lab.tasks.map((task,i)=><button type="button" key={task.id} aria-current={i===index?"step":undefined} onClick={()=>choose(i)} className={`min-h-16 rounded-2xl border-2 px-4 py-3 text-left shadow-sm ${i===index?"border-teal bg-teal/10 font-bold":"border-ink/15 bg-white hover:border-teal/50"}`}>{i+1}. {task.title}</button>)}</nav>
    <article className="rounded-3xl border border-teal/20 bg-white p-5 shadow-resting sm:p-8">
    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal-text"><ActionIcon name={lab.slug==="brain-lab"?"brain":lab.slug==="mind-lab"?"mind":"idea"} size={34}/></div><p className="text-sm text-teal-text">Activity {index+1} of {lab.tasks.length}</p><h2 ref={heading} tabIndex={-1} className="mt-2 text-2xl">{item.title}</h2><p className="mt-3 rounded-xl bg-cream p-4 font-semibold">{item.idea}</p><ReadAloudButton text={`${item.idea}. ${item.situation}. ${item.choices.join('. ')}. Your practical challenge: ${item.tryIt[level]}`} uiLocale="en-GB"/>
    <fieldset className="mt-5"><legend className="text-lg font-bold">{item.situation}</legend><div className="mt-3 grid gap-3">{item.choices.map((choice,i)=><button type="button" key={choice} aria-pressed={answer===i} onClick={()=>setAnswer(i)} className={`min-h-12 rounded-xl border-2 p-4 text-left ${answer===i?"border-teal bg-teal/10":"border-ink/20"}`}>{choice}</button>)}</div></fieldset>
    {answer!==null&&<p role="status" className="mt-4 rounded-xl bg-fog p-4">{answer===item.correct?`That fits. ${item.explanation}`:"Pause and look at the key idea above. You can choose again, or ask someone to help you compare the options."}</p>}
    <section className="mt-6 border-t pt-5"><h3 className="text-xl">Try it your way</h3><p className="mt-2 text-lg">{item.tryIt[level]}</p><p className="mt-2 text-sm">You can answer without speaking. You do not need to enter or upload anything.</p><button type="button" disabled={!storageReady} onClick={mark} className="mt-4 min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">{done.includes(key)?"Practised on this device":"Mark as practised"}</button><p role="status" className="mt-2 text-sm">{storageFailed?"Progress lasts for this visit. Your browser could not save it.":done.includes(key)?"Saved on this device. You can practise again at any time.":""}</p></section>
    </article><nav aria-label="Activity steps" className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={index===0} onClick={()=>choose(index-1)} className="min-h-12 rounded-xl border border-teal px-5 py-3 disabled:opacity-40">Back</button><button type="button" disabled={index===lab.tasks.length-1} onClick={()=>choose(index+1)} className="min-h-12 rounded-xl bg-teal px-5 py-3 text-white disabled:opacity-40">Next</button><Link href="/play" className="min-h-12 px-4 py-3 text-teal-text underline">Choose another world</Link></nav>
    {lab.slug === "future-skills" && <nav aria-label="Deeper practical quests" className="mt-8 flex flex-wrap gap-3">{[["entrepreneur-quest","Entrepreneur Quest"],["leadership-quest","Leadership Quest"],["real-life-quests","Real Life Quests"]].map(([path,label])=><Link key={path} href={`/${path}`} className="min-h-12 rounded-xl border border-teal bg-white px-4 py-3 text-teal-text">{label}</Link>)}</nav>}
    </main></div>;
}
