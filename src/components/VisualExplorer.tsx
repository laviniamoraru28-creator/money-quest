"use client";
import {useRef,useState} from "react";
import {Link} from "@/i18n/navigation";
import type {Locale} from "@/i18n/config";
import {experienceCopy} from "@/content/experience-copy";
import {quietCopy} from "@/content/quiet-corner";
import {visualCopy} from "@/content/visual-learning";
import {useReadAloud} from "@/lib/accessibility/use-read-aloud";

function Picture({kind,label,count=1}:{kind:"coin"|"leaf"|"apple"|"ball";label:string;count?:number}) {
 return <span role="img" aria-label={label} className="inline-flex flex-wrap justify-center gap-2">{Array.from({length:count},(_,i)=><svg key={i} aria-hidden="true" focusable="false" viewBox="0 0 120 120" className="h-24 w-24 sm:h-28 sm:w-28">
  {kind==="coin"?<><circle cx="60" cy="60" r="46" fill="#edc465" stroke="#765310" strokeWidth="5"/><circle cx="60" cy="60" r="36" fill="none" stroke="#765310" strokeWidth="2"/><text x="60" y="72" textAnchor="middle" fontSize="38" fontWeight="bold" fill="#3d2a0c">£1</text></>:kind==="leaf"?<><path d="M25 98C4 43 55 14 102 20C112 75 69 110 25 98Z" fill="#539e59" stroke="#245d30" strokeWidth="4"/><path d="M20 109L86 34" stroke="#245d30" strokeWidth="5"/></>:kind==="apple"?<><path d="M60 35C18 13 8 57 27 85C43 109 53 91 61 95C78 107 102 86 103 63C105 32 82 23 60 35Z" fill="#c84438" stroke="#72251e" strokeWidth="3"/><path d="M60 34L63 12M63 20Q91 2 94 18Q80 31 63 20" stroke="#365b2b" strokeWidth="7" fill="#5d9841"/><rect x="35" y="60" width="50" height="30" rx="5" fill="#fff"/><text x="60" y="82" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#192e2a">£1</text></>:<><circle cx="60" cy="59" r="44" fill="#9dd9e4" stroke="#275968" strokeWidth="4"/><path d="M19 50H101M24 80H96M60 15C30 40 30 75 60 103M60 15C90 40 90 75 60 103" stroke="#275968" strokeWidth="4" fill="none"/><rect x="35" y="44" width="50" height="31" rx="5" fill="#fff"/><text x="60" y="67" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#192e2a">£3</text></>}
 </svg>)}</span>;
}
const button="min-h-12 rounded-xl border-2 border-teal px-5 py-3 font-semibold text-teal-text";
export default function VisualExplorer({locale}:{locale:Locale}) {
 const t=experienceCopy[locale],v=visualCopy[locale];
 const [lesson,setLesson]=useState(0),[model,setModel]=useState(true),[selected,setSelected]=useState<number|null>(null),[done,setDone]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const {isSupported,isSpeaking,speak,stop}=useReadAloud(locale==="en"?"en-GB":locale);
 const titles=[v.money,v.pay,v.save],models=[v.moneyModel,v.payModel,v.saveModel],prompts=[v.moneyPrompt,v.payPrompt,v.savePrompt];
 const instruction=(model?models[lesson]:prompts[lesson])!;
 const move=(next:number)=>{stop();setDone(false);setLesson(next);setModel(true);setSelected(null);requestAnimationFrame(()=>heading.current?.focus());};
 const show=()=>{stop();setModel(true);setSelected(null);};
 const correct=lesson===2?1:0;
 return <div className="min-h-screen bg-fog text-ink"><nav aria-label={t.visual} className="mx-auto flex max-w-4xl flex-wrap gap-3 px-5 py-4"><Link href="/" className={button}>⌂ {t.home}</Link><Link href="/quiet-corner" className={button}>{quietCopy[locale].entry}</Link></nav>
 <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 pb-12"><h1 className="text-3xl">{t.visual}</h1><p className="mt-3 max-w-3xl">{v.intro}</p>
 <nav aria-label={t.visual} className="mt-5 grid gap-3 sm:grid-cols-3">{titles.map((title,index)=><button key={title} type="button" aria-current={index===lesson?"step":undefined} onClick={()=>move(index)} className={`${button} ${index===lesson?"bg-teal/10":""}`}><span aria-hidden="true">{["🪙","🍎","⚽"][index]} </span>{title}</button>)}</nav>
 {done?<section className="mt-6 rounded-3xl border border-teal/30 bg-white p-6"><h2 ref={heading} tabIndex={-1} className="text-2xl">{t.finish}</h2><p className="mt-4">{v.done}</p><button type="button" className={`${button} mt-5`} onClick={()=>move(0)}>↻ {t.again}</button></section>:<section className="mt-6 rounded-3xl border border-teal/30 bg-white p-5 sm:p-8"><p className="text-sm font-semibold text-teal-text">Explorer · {lesson+1} / 3</p><h2 ref={heading} tabIndex={-1} className="mt-2 text-2xl">{titles[lesson]}</h2><p className="mt-4 text-xl" aria-live="polite">{instruction}</p>
 <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={!isSupported} className={button} onClick={()=>isSpeaking?stop():speak(instruction)}>{isSpeaking?"■ "+t.stop:"◖ "+t.listen}</button><button type="button" onClick={show} className={button}>↻ {t.help}</button></div>
 {model?<><div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-cream p-5" aria-label={instruction}>
 {lesson===0?<><Picture kind="coin" label={v.coinAlt}/><span aria-hidden="true" className="text-3xl">→</span><Picture kind="apple" label={v.appleAlt}/></>:lesson===1?<><Picture kind="apple" label={v.appleAlt}/><span aria-hidden="true" className="text-3xl">=</span><Picture kind="coin" label={v.one}/></>:<><Picture kind="ball" label={v.ballAlt}/><span aria-hidden="true" className="text-3xl">=</span><Picture kind="coin" count={3} label={v.goal}/></>}
 </div>{lesson===2&&<div className="mt-4 flex flex-wrap items-center justify-center gap-3"><Picture kind="coin" label={v.one}/><span aria-hidden="true" className="text-3xl">+</span><Picture kind="coin" count={2} label={v.two}/><span aria-hidden="true" className="text-3xl">= £3</span></div>}
 <button type="button" className={`${button} mt-5 w-full bg-teal text-white`} onClick={()=>{stop();setModel(false);setSelected(null);}}>☝ {t.choose}</button></>:<>
 {lesson!==0&&<div className="mt-5 flex flex-wrap items-center justify-center gap-3"><Picture kind={lesson===1?"apple":"ball"} label={lesson===1?v.appleAlt:v.ballAlt}/>{lesson===2&&<Picture kind="coin" label={v.one}/>}</div>}
 <div className="mt-6 grid gap-4 sm:grid-cols-2">{[0,1].map(index=>{const leaf=lesson===0&&index===1;const label=lesson===0?(leaf?v.leaf:v.coin):(index===0?v.one:v.two);return <button type="button" key={index} aria-pressed={selected===index} onClick={()=>{stop();setSelected(index);}} className={`${button} flex min-h-48 flex-col items-center justify-center gap-4 py-7 ${selected===index?"bg-teal/10":""}`}><Picture kind={leaf?"leaf":"coin"} label={leaf?v.leafAlt:lesson===0?v.coinAlt:label} count={lesson===0?1:index+1}/><span>{label}</span></button>;})}</div><p role="status" className="mt-4 min-h-12 text-lg">{selected===null?"":selected===correct?t.fits:t.tryAgain}</p>
 </>}
 <nav aria-label={t.next} className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" disabled={lesson===0} className={`${button} disabled:opacity-50`} onClick={()=>move(lesson-1)}>← {t.back}</button><button type="button" className={button} onClick={()=>{if(lesson<2)move(lesson+1);else{stop();setDone(true);requestAnimationFrame(()=>heading.current?.focus());}}}>{lesson===2?t.finish:t.next} →</button></nav></section>}
 <details className="mt-5 rounded-2xl border border-teal/30 bg-white p-4"><summary className="min-h-12 cursor-pointer py-3 font-semibold">{t.help}</summary><p>{v.help}</p></details>
 </main></div>;
}
