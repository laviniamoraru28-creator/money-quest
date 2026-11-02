"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {QuietAudio,type QuietSound} from "@/lib/audio/quiet-audio";
import {experienceCopy} from "@/content/experience-copy";
import {isSupportedLocale} from "@/i18n/config";

/** Lives in the persistent locale layout, with no storage or automatic restart. */
export function BackgroundSound({locale}:{locale:string}) {
 const t=experienceCopy[isSupportedLocale(locale)?locale:"en"];
 const audio=useRef<QuietAudio|null>(null), request=useRef(0);
 const [sound,setSound]=useState<QuietSound>("waves"),[volume,setVolume]=useState(20),[active,setActive]=useState(false),[starting,setStarting]=useState(false),[message,setMessage]=useState("");
 const stop=useCallback(()=>{request.current++;audio.current?.stop();setActive(false);setStarting(false);},[]);
 useEffect(()=>{
  const hidden=()=>{if(document.hidden)stop();};
  window.addEventListener("moneyquest-stop-audio",stop);
  window.addEventListener("moneyquest-background-stop",stop);
  window.addEventListener("pagehide",stop);document.addEventListener("visibilitychange",hidden);
  return ()=>{stop();window.removeEventListener("moneyquest-stop-audio",stop);window.removeEventListener("moneyquest-background-stop",stop);window.removeEventListener("pagehide",stop);document.removeEventListener("visibilitychange",hidden);};
 },[stop]);
 const play=async()=>{
  stop();setMessage("");window.dispatchEvent(new Event("moneyquest-stop-speech"));window.dispatchEvent(new Event("moneyquest-background-start"));
  audio.current??=new QuietAudio();const id=request.current;setStarting(true);
  const ok=await audio.current.start(sound,volume);if(id!==request.current)return;
  setStarting(false);setActive(ok);if(!ok)setMessage(t.unavailable);
 };
 return <details className="rounded-xl border border-teal/40 bg-white px-3"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">{t.background}{active?" ●":""}</summary>
  <div className="flex max-w-md flex-wrap gap-3 pb-4"><label className="w-full">{t.background}<select aria-label={t.background} value={sound} onChange={e=>{stop();setSound(e.target.value as QuietSound);}} className="ml-2 min-h-12 max-w-full rounded-xl border border-ink/30 p-2">{(["waves","forest","rain","notes"] as const).map(id=><option key={id} value={id}>{t[id]}</option>)}</select></label>
   <button type="button" aria-pressed={active||starting} onClick={()=>{if(active||starting)stop();else void play();}} className="min-h-12 rounded-xl border border-teal px-4 py-3 font-semibold text-teal-text">{active||starting?t.stop:t.play}</button>
   <label className="flex min-h-12 items-center gap-2">{t.volume}<input aria-label={`${t.background}: ${t.volume}`} className="h-12 w-28 accent-teal" type="range" min="0" max="100" value={volume} onChange={e=>{const value=Number(e.target.value);setVolume(value);audio.current?.setVolume(value);}}/><output>{volume}%</output></label>
   <p className="w-full text-sm">{t.hint}</p><p role="status">{message}</p>
  </div></details>;
}
