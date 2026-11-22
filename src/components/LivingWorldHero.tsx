"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
const VIDEO="/videos/money-quest-hero.mp4";
const labels:Record<string,{pause:string;play:string;description:string}>={
en:{pause:"Pause animation",play:"Play animation",description:"Four floating learning worlds connected by a golden path, with three children exploring: Money Quest, Entrepreneur Quest, Leadership Quest and AI Quest."},
ro:{pause:"Oprește animația",play:"Pornește animația",description:"Patru lumi educaționale plutitoare legate de un drum auriu, explorate de trei copii: Money Quest, Entrepreneur Quest, Leadership Quest și AI Quest."},
es:{pause:"Pausar animación",play:"Reproducir animación",description:"Cuatro mundos educativos flotantes unidos por un camino dorado: dinero, emprendimiento, liderazgo e IA."},
fr:{pause:"Mettre en pause",play:"Lire l'animation",description:"Quatre mondes éducatifs flottants reliés par un chemin doré : argent, entrepreneuriat, leadership et IA."},
de:{pause:"Animation pausieren",play:"Animation abspielen",description:"Vier schwebende Lernwelten verbunden durch einen goldenen Weg: Geld, Unternehmertum, Führung und KI."},
it:{pause:"Metti in pausa",play:"Riproduci animazione",description:"Quattro mondi educativi sospesi collegati da un sentiero dorato: denaro, impresa, leadership e IA."},
pt:{pause:"Pausar animação",play:"Reproduzir animação",description:"Quatro mundos educativos flutuantes ligados por um caminho dourado: dinheiro, empreendedorismo, liderança e IA."},
nl:{pause:"Animatie pauzeren",play:"Animatie afspelen",description:"Vier zwevende leerwerelden verbonden door een gouden pad: geld, ondernemen, leiderschap en AI."},
pl:{pause:"Wstrzymaj animację",play:"Odtwórz animację",description:"Cztery unoszące się światy nauki połączone złotą ścieżką: pieniądze, przedsiębiorczość, przywództwo i AI."}
};
export function LivingWorldHero({locale}:{locale:string}){
 const video=useRef<HTMLVideoElement>(null);
 const [available,setAvailable]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [reduced,setReduced]=useState(true);
 const t=labels[locale]??labels.en!;
 useEffect(()=>{
   const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
   const update=()=>{setReduced(mq.matches);if(mq.matches){video.current?.pause();setPlaying(false);}};
   update();mq.addEventListener("change",update);
   return ()=>mq.removeEventListener("change",update);
 },[]);
 useEffect(()=>{
   if(!available||reduced||!video.current)return;
   const v=video.current;
   const onScreen=new IntersectionObserver(([entry])=>{
     if(entry?.isIntersecting){void v.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));}
     else{v.pause();setPlaying(false);}
   },{threshold:0.25});
   onScreen.observe(v);
   return ()=>{onScreen.disconnect();v.pause();};
 },[available,reduced]);
 const toggle=()=>{const v=video.current;if(!v)return;if(v.paused){void v.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));}else{v.pause();setPlaying(false);}};
 return <div className="relative overflow-hidden rounded-3xl border border-teal/15 bg-cream shadow-lg" data-homepage-hero>
   <div role="img" aria-label={t.description} className="relative aspect-video w-full">
     <Image unoptimized src="/images/money-quest/worlds/coin-cove-thumb.webp" alt="" fill priority sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
     <video ref={video} aria-hidden="true" muted playsInline loop preload="metadata" poster="/images/money-quest/living-world-poster.webp"
       onLoadedMetadata={()=>setAvailable(true)} onError={()=>setAvailable(false)}
       className={`absolute inset-0 hidden h-full w-full object-contain md:block ${available?"opacity-100":"opacity-0"}`}>
       <source src={VIDEO} type="video/mp4" />
     </video>
   </div>
   {available&&<button type="button" onClick={toggle} aria-label={playing?t.pause:t.play}
     className="absolute bottom-3 right-3 min-h-11 rounded-xl border border-white/70 bg-ink px-4 py-2 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">
     {playing?"Ⅱ":"▶"} <span className="sr-only">{playing?t.pause:t.play}</span>
   </button>}
 </div>;
}
