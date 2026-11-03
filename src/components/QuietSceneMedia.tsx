"use client";

import Image from "next/image";
import {useEffect, useRef, useState} from "react";

type Scene = "max" | "ocean" | "garden";

const labels: Record<string, {soundOn: string; soundOff: string}> = {
  en: {soundOn: "Turn sound on", soundOff: "Mute sound"},
  ro: {soundOn: "Pornește sunetul", soundOff: "Oprește sunetul"},
  es: {soundOn: "Activar sonido", soundOff: "Silenciar"},
  fr: {soundOn: "Activer le son", soundOff: "Couper le son"},
  de: {soundOn: "Ton einschalten", soundOff: "Stummschalten"},
  it: {soundOn: "Attiva audio", soundOff: "Disattiva audio"},
  pt: {soundOn: "Ativar som", soundOff: "Silenciar"},
  nl: {soundOn: "Geluid aanzetten", soundOff: "Geluid dempen"},
  pl: {soundOn: "Włącz dźwięk", soundOff: "Wycisz"}
};

export default function QuietSceneMedia({scene, moving, reduced, alt, locale, buttonClass}: {
  scene: Scene; moving: boolean; reduced: boolean; alt: string; locale: string; buttonClass: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pausedByPage, setPausedByPage] = useState(false);
  const active = moving && !reduced && !failed && !pausedByPage;
  useEffect(() => {setMuted(true); setFailed(false); setPausedByPage(false);}, [scene]);
  useEffect(() => {if (!moving || reduced) {setMuted(true); setPausedByPage(false);}}, [moving, reduced]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!active) {element.pause(); element.currentTime = 0; return;}
    element.muted = muted;
    void element.play().catch(() => setFailed(true));
  }, [active, scene, muted]);
  useEffect(() => {
    const stop = () => {video.current?.pause(); setMuted(true); setPausedByPage(true);};
    const visibility = () => {if (document.hidden) stop();};
    window.addEventListener("moneyquest-stop-quiet-video", stop);
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("moneyquest-stop-quiet-video", stop);
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const poster = scene === "garden" ? "/images/money-quest/quiet/garden-v2.webp" : `/images/money-quest/quiet/${scene}-v1.webp`;
  const copy = labels[locale] ?? labels.en;
  return <div>
    <div className="overflow-hidden rounded-2xl bg-fog">
      {active ? <video ref={video} key={scene} src={`/images/money-quest/quiet/${scene}-animated.mp4`} poster={poster} autoPlay loop playsInline muted={muted} preload="none" onError={() => setFailed(true)} aria-label={alt} className="aspect-video h-auto w-full object-cover"/> : <Image unoptimized priority={scene === "max"} src={poster} alt={alt} width={1200} height={675} className="aspect-video h-auto w-full object-cover"/>}
    </div>
    {active && <div className="mt-3"><button type="button" className={buttonClass} aria-pressed={!muted} onClick={() => setMuted(value => !value)}>{muted ? copy.soundOn : copy.soundOff}</button></div>}
  </div>;
}
