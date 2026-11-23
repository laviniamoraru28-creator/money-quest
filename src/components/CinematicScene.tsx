"use client";
import {useEffect, useState} from "react";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";

export function CinematicScene({src, mobile, poster, className, controls=true}: {
  src:string; mobile?:string; poster:string; className?:string; controls?:boolean
}) {
  const prefs=useAccessibilityPrefs();
  const [motion,setMotion]=useState(false);
  useEffect(()=>{
    const query=matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setMotion(!query.matches);
    sync();
    query.addEventListener("change",sync);
    return ()=>query.removeEventListener("change",sync);
  },[]);
  const animate=motion && prefs.isLoaded && !prefs.reducedMotion && !prefs.focusMode && prefs.presentation!=="calm";
  return animate ? <video key={src} className={className} muted autoPlay playsInline controls={controls} preload="metadata" poster={poster}>
    {mobile && <source media="(max-width: 760px)" src={mobile} type="video/mp4"/>}
    <source src={src}/>
  </video> : <picture><img className={className} alt="" src={poster}/></picture>;
}
