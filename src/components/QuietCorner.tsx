"use client";

import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";
import {Link} from "@/i18n/navigation";
import {quietCopy} from "@/content/quiet-corner";
import type {Locale} from "@/i18n/config";
import {QuietAudio, type QuietSound} from "@/lib/audio/quiet-audio";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import QuietVideos from "@/components/QuietVideos";

const button = "min-h-12 rounded-2xl border-2 border-teal/40 bg-white px-5 py-3 font-bold text-teal-text focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal";
const stopButton = button.replace("bg-white", "bg-teal").replace("text-teal-text", "text-white");
const scenes = ["max", "ocean", "garden"] as const;
const altKeys = {max: "maxAlt", ocean: "oceanAlt", garden: "gardenAlt"} as const;
function CardSymbol({index}: {index: number}) {
  return <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {index === 0 ? <><path d="M17 12v24M31 12v24"/></> : index === 1 ? <><path d="M10 19h8l11-9v28l-11-9h-8zM36 17l7 14M43 17l-7 14"/></> : <><circle cx="24" cy="24" r="18"/><path d="M18 18a6 6 0 0 1 12 0c0 5-6 5-6 10M24 34v1"/></>}
  </svg>;
}

export default function QuietCorner({locale}: {locale: Locale}) {
  const t = quietCopy[locale];
  const {reducedMotion} = useAccessibilityPrefs();
  const [systemReduced, setSystemReduced] = useState(true);
  const [scene, setScene] = useState<typeof scenes[number]>("max");
  const [hidden, setHidden] = useState(false);
  const [moving, setMoving] = useState(false);
  const [sound, setSound] = useState<QuietSound>("rain");
  const [volume, setVolume] = useState(20);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [card, setCard] = useState<number | null>(null);
  const audio = useRef<QuietAudio | null>(null);
  const request = useRef(0);
  const closeCard = useRef<HTMLButtonElement>(null);
  const cardTriggers = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = reducedMotion || systemReduced;
  const stopAudio = useCallback(() => {
    ++request.current;
    audio.current?.stop();
    setPlaying(false);
    setStarting(false);
  }, []);
  const stopEverything = useCallback(() => {
    stopAudio();
    setMoving(false);
    try { window.speechSynthesis?.cancel(); } catch {}
    window.dispatchEvent(new Event("moneyquest-stop-speech"));
    window.dispatchEvent(new Event("moneyquest-stop-quiet-video"));
  }, [stopAudio]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setSystemReduced(media.matches); if (media.matches) setMoving(false); };
    sync(); media.addEventListener("change", sync);
    const hide = () => { if (document.hidden) { stopAudio(); setMoving(false); } };
    const pagehide = () => { stopAudio(); setMoving(false); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("moneyquest-stop-audio", stopAudio);
    const stopMovement = () => setMoving(false);
    window.addEventListener("moneyquest-stop-picture-movement", stopMovement);
    return () => {
      stopAudio();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("moneyquest-stop-audio", stopAudio);
      window.removeEventListener("moneyquest-stop-picture-movement", stopMovement);
    };
  }, [stopAudio]);
  useEffect(() => { if (reducedMotion) setMoving(false); }, [reducedMotion]);
  useEffect(() => { if (card !== null) closeCard.current?.focus(); }, [card]);
  const play = async () => {
    stopAudio(); setMessage("");
    window.dispatchEvent(new Event("moneyquest-stop-speech"));
    audio.current ??= new QuietAudio();
    const id = request.current;
    setStarting(true);
    const ok = await audio.current.start(sound, volume);
    if (id !== request.current) return;
    setStarting(false); setPlaying(ok);
    if (!ok) setMessage(t.unavailable);
  };
  const dismissCard = () => { const previous = card; setCard(null); if (previous !== null) cardTriggers.current[previous]?.focus(); };
  const cardText = [t.breakCard, t.quietCard, t.helpCard];
  return <div className="min-h-screen bg-fog text-ink">
    <nav aria-label={t.title} className="mx-auto flex max-w-5xl flex-wrap gap-3 px-5 py-5"><Link href="/" className={button}>{t.home}</Link><Link href="/mind-lab" className={button}>{t.mind}</Link></nav>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-5 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><h1 className="text-3xl sm:text-4xl">{t.title}</h1><p className="mt-3 text-lg">{t.intro}</p></div><button type="button" className={stopButton} onClick={() => { stopEverything(); setMessage(t.stopped); }}>{t.finish}</button></div>
      <section aria-labelledby="quiet-pictures" className="mt-7 rounded-3xl border border-teal/20 bg-white p-4 sm:p-6">
        <h2 id="quiet-pictures" className="text-xl">{t.pictures}</h2>
        <div className="my-4 flex flex-wrap gap-3">{scenes.map(id => <button type="button" key={id} aria-pressed={scene === id} className={`${button} ${scene === id ? "border-teal bg-teal/10" : ""}`} onClick={() => {setScene(id); setHidden(false); setMoving(false);}}>{t[id]}</button>)}</div>
        {!hidden && <figure><div className="overflow-hidden rounded-2xl bg-fog"><Image unoptimized priority={scene === "max"} src={`/images/money-quest/quiet/${scene}-v1.webp`} alt={t[altKeys[scene]]} width={1200} height={675} className={`aspect-video h-auto w-full object-cover ${moving && !reduced ? "quiet-picture-moving" : ""}`}/></div><figcaption className="mt-2 text-sm">{t.imageNote}</figcaption></figure>}
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" className={button} aria-pressed={hidden} onClick={() => {setHidden(!hidden); setMoving(false);}}>{hidden ? t.show : t.hide}</button><button type="button" className={`${button} disabled:opacity-60`} disabled={hidden || reduced} aria-pressed={moving && !reduced} onClick={() => setMoving(!moving)}>{moving && !reduced ? t.still : t.move}</button></div>
        {reduced && <p className="mt-3 text-sm">{t.motionOff}</p>}
      </section>
      <section aria-labelledby="quiet-sound" className="mt-5 rounded-3xl border border-teal/20 bg-white p-4 sm:p-6">
        <h2 id="quiet-sound" className="text-xl">{t.sound}</h2><p className="mt-2 text-sm">{t.soundNote}</p>
        <fieldset className="mt-4"><legend className="sr-only">{t.sound}</legend><div className="flex flex-wrap gap-3">{(["rain", "notes"] as const).map(id => <button type="button" key={id} aria-pressed={sound === id} className={`${button} ${sound === id ? "border-teal bg-teal/10" : ""}`} onClick={() => {stopAudio(); setSound(id); setMessage("");}}>{t[id]}</button>)}</div></fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-4"><button type="button" className={button} onClick={() => {if (playing || starting) stopAudio(); else void play();}}>{playing || starting ? t.stop : t.play}</button><label className="flex min-h-12 flex-wrap items-center gap-3" htmlFor="quiet-volume">{t.volume}<input id="quiet-volume" className="h-12 w-40 accent-teal" type="range" min="0" max="100" step="1" value={volume} onChange={event => {const next = Number(event.target.value); setVolume(next); audio.current?.setVolume(next);}}/><output htmlFor="quiet-volume">{volume}%</output></label></div>
        <p role="status" className="mt-3 text-sm">{starting ? t.starting : message}</p>
      </section>
      <QuietVideos locale={locale}/>
      <section aria-labelledby="quiet-cards" className="mt-5 rounded-3xl border border-teal/20 bg-white p-4 sm:p-6"><h2 id="quiet-cards" className="text-xl">{t.cards}</h2><p className="mt-2 text-sm">{t.cardHint}</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{cardText.map((text, index) => <button key={text} type="button" ref={el => {cardTriggers.current[index] = el;}} className={`${button} flex flex-col items-center gap-3 py-6 text-lg`} onClick={() => {stopEverything(); setCard(index);}}><CardSymbol index={index}/>{text}</button>)}</div></section>
      {card !== null && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/80 p-5" role="dialog" aria-modal="true" aria-labelledby="quiet-card-title" onKeyDown={event => {if (event.key === "Escape") dismissCard(); if (event.key === "Tab") {event.preventDefault(); closeCard.current?.focus();}}}><div className="flex max-w-lg flex-col items-center gap-6 rounded-3xl bg-white p-8 text-center text-ink"><CardSymbol index={card}/><h2 id="quiet-card-title" className="text-3xl">{cardText[card]}</h2><button type="button" ref={closeCard} className={button} onClick={dismissCard}>{t.close}</button></div></div>}
    </main>
  </div>;
}
