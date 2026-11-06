"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {Link} from "@/i18n/navigation";
import {quietCopy} from "@/content/quiet-corner";
import type {Locale} from "@/i18n/config";
import {QuietAudio, type QuietSound} from "@/lib/audio/quiet-audio";
import QuietVideos from "@/components/QuietVideos";

const button = "min-h-12 rounded-2xl border-2 border-teal/40 bg-white px-5 py-3 font-bold text-teal-text focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal";
const stopButton = button.replace("bg-white", "bg-teal").replace("text-teal-text", "text-white");
function CardSymbol({index}: {index: number}) {
  return <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {index === 0 ? <><path d="M17 12v24M31 12v24"/></> : index === 1 ? <><path d="M10 19h8l11-9v28l-11-9h-8zM36 17l7 14M43 17l-7 14"/></> : <><circle cx="24" cy="24" r="18"/><path d="M18 18a6 6 0 0 1 12 0c0 5-6 5-6 10M24 34v1"/></>}
  </svg>;
}

export default function QuietCorner({locale}: {locale: Locale}) {
  const t = quietCopy[locale];
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
  const stopAudio = useCallback(() => {
    ++request.current;
    audio.current?.stop();
    setPlaying(false);
    setStarting(false);
  }, []);
  const stopEverything = useCallback(() => {
    stopAudio();
    try { window.speechSynthesis?.cancel(); } catch {}
    window.dispatchEvent(new Event("moneyquest-stop-speech"));
    window.dispatchEvent(new Event("moneyquest-stop-quiet-video"));
    window.dispatchEvent(new Event("moneyquest-background-stop"));
  }, [stopAudio]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { stopAudio(); } };
    const pagehide = () => { stopAudio(); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("moneyquest-stop-audio", stopAudio);
    window.addEventListener("moneyquest-background-start", stopAudio);
    return () => {
      stopAudio();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("moneyquest-stop-audio", stopAudio);
      window.removeEventListener("moneyquest-background-start", stopAudio);
    };
  }, [stopAudio]);
  useEffect(() => { if (card !== null) closeCard.current?.focus(); }, [card]);
  const play = async () => {
    stopAudio(); setMessage("");
    window.dispatchEvent(new Event("moneyquest-background-stop"));
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
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.title}</h1>
      <QuietVideos locale={locale}/>
    </main>
  </div>;
}
