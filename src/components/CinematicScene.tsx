"use client";
import { useEffect, useRef, useState } from "react";
import { useAccessibilityPrefs } from "@/lib/accessibility/use-accessibility-preferences";

export function CinematicScene({
  src,
  mobile,
  poster,
  className,
  controls = true,
}: {
  src: string;
  mobile?: string;
  poster: string;
  className?: string;
  controls?: boolean;
}) {
  const element = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState("");
  const prefs = useAccessibilityPrefs();
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const connection = (navigator as Navigator & {connection?: {saveData?:boolean}}).connection;
      setMotion(!query.matches && !connection?.saveData);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const animate =
    failed !== src &&
    motion &&
    prefs.isLoaded &&
    !prefs.reducedMotion &&
    !prefs.focusMode &&
    prefs.presentation !== "calm";
  useEffect(() => {
    const video = element.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) video.pause();
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [animate, src]);
  return animate ? (
    <video
      ref={element}
      key={src}
      className={className}
      muted
      autoPlay={
        visible && (prefs.presentation === "cinematic" || !controls || !!mobile)
      }
      playsInline
      controls={controls}
      preload="metadata"
      onError={() => setFailed(src)}
      poster={poster}
    >
      {mobile && (
        <source media="(max-width: 760px)" src={mobile} type="video/mp4" />
      )}
      <source src={src} onError={() => setFailed(src)} />
    </video>
  ) : (
    <picture>
      <img className={className} alt="" src={poster} />
    </picture>
  );
}
