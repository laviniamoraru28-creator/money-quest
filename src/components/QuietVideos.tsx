"use client";
import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";
import type {Locale} from "@/i18n/config";
import {quietVideoCopy, quietVideos} from "@/content/quiet-videos";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
const button = "min-h-12 rounded-2xl border-2 border-teal/40 bg-white px-5 py-3 font-bold text-teal-text disabled:opacity-60";
const descriptions = {ocean:"oceanDescription",rain:"rainDescription",aquarium:"aquariumDescription"} as const;
export default function QuietVideos({locale}: {locale: Locale}) {
  const t = quietVideoCopy[locale];
  const {reducedMotion} = useAccessibilityPrefs();
  const [systemReduced, setSystemReduced] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const generation = useRef(0);
  const clip = quietVideos[selected]!;
  const reduced = reducedMotion || systemReduced;
  const stop = useCallback(() => {
    ++generation.current;
    video.current?.pause();
    setLoaded(false);
    setError("");
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {setSystemReduced(media.matches); if (media.matches) stop();};
    sync(); media.addEventListener("change", sync);
    const hide = () => {if (document.hidden) stop();};
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", stop);
    window.addEventListener("moneyquest-stop-quiet-video", stop);
    window.addEventListener("moneyquest-stop-audio", stop);
    return () => {
      stop();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("moneyquest-stop-quiet-video", stop);
      window.removeEventListener("moneyquest-stop-audio", stop);
    };
  }, [stop]);
  useEffect(() => {if (reducedMotion) stop();}, [reducedMotion, stop]);
  useEffect(() => {
    const node = video.current;
    if (!loaded || !open || reduced || !node) return;
    const id = generation.current;
    // Only a Watch video click sets loaded; changing settings never starts it.
    void node.play().catch(() => {if (id === generation.current) setError(t.unavailable);});
    return () => {node.pause(); node.removeAttribute("src"); node.load();};
  }, [loaded, open, reduced, selected, t.unavailable]);
  return <details className="mt-5 rounded-3xl border border-teal/20 bg-white p-4 sm:p-6" onToggle={event => {setOpen(event.currentTarget.open); if (!event.currentTarget.open) stop();}}>
    <summary className="min-h-12 cursor-pointer py-2 text-xl font-bold text-teal-text">{t.title}</summary>
    {open && <div className="mt-3">
      <p>{t.intro}</p><p className="mt-2 text-sm">{t.notice}</p>
      <div className="my-4 flex flex-wrap gap-3">{quietVideos.map((item,index) => <button key={item.id} type="button" className={button} aria-pressed={selected === index} onClick={() => {stop(); setSelected(index);}}>{t[item.id]}</button>)}</div>
      <p id="quiet-video-description" className="mb-3">{t[descriptions[clip.id]]}</p>
      {loaded ? <video key={clip.id} ref={video} controls muted playsInline preload="none" loop={repeat} src={`/media/quiet/${clip.id}-v1.mp4`} poster={`/images/money-quest/quiet/${clip.id}-video-poster-v1.webp`} aria-label={t[clip.id]} aria-describedby="quiet-video-description" className="aspect-video w-full rounded-2xl bg-ink" onError={() => setError(t.unavailable)} onPlay={event => {if (reduced || document.hidden) {event.currentTarget.pause(); return;} window.dispatchEvent(new Event("moneyquest-stop-picture-movement"));}}/> : <Image unoptimized src={`/images/money-quest/quiet/${clip.id}-video-poster-v1.webp`} alt={t[descriptions[clip.id]]} width={960} height={540} className="aspect-video h-auto w-full rounded-2xl object-cover"/>}
      <div className="mt-4 flex flex-wrap items-center gap-4"><button type="button" className={button} disabled={!loaded && reduced} onClick={() => {if (loaded) stop(); else {setError(""); setLoaded(true);}}}>{loaded ? t.close : t.play}</button><label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={repeat} className="h-6 w-6 accent-teal" onChange={event => setRepeat(event.target.checked)}/>{t.repeat}</label></div>
      {reduced && <p className="mt-3 text-sm">{t.reduced}</p>}<p role="status" className="mt-2 text-sm">{error}</p>
      <p className="mt-4 text-sm">{t.credit}: {clip.author}, Pexels. <a className="text-teal-text underline" href={clip.source} rel="noreferrer">{t.source}</a></p>
    </div>}
  </details>;
}
