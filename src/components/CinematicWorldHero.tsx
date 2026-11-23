"use client";
import {useEffect, useState} from "react";

type Props = {title: string; subtitle: string; cta: string; href: string; poster: string; video?: string; videoWebm?: string};
export function CinematicWorldHero({title, subtitle, cta, href, poster, video, videoWebm}: Props) {
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches || window.localStorage.getItem("moneyquest_cinematic_calm") === "true");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <section className="mq-cinematic mq-cinematic-hero" aria-labelledby="mq-hero-heading">
    <div className="mq-hero-sky" aria-hidden="true"/>
    <div className="mq-hero-inner">
      <div className="mq-hero-copy">
        <p className="mq-hero-eyebrow">MONEY QUEST EDUCATION</p>
        <h1 id="mq-hero-heading">{title}</h1>
        <p className="mq-hero-subtitle">{subtitle}</p>
        <a href={href} className="mq-hero-cta">{cta}<span aria-hidden="true"> ✦</span></a>
      </div>
      <div className="mq-hero-scene">
        <div className="mq-hero-media" style={{backgroundImage:`url("${poster}")`}}>
          {!reduced && (video || videoWebm) && <video
            autoPlay muted playsInline loop preload="metadata" aria-hidden="true"
            poster={poster} className={ready ? "mq-hero-video is-ready" : "mq-hero-video"}
            onCanPlay={() => setReady(true)} onError={() => setReady(false)}>
            {videoWebm && <source src={videoWebm} type="video/webm"/>}
            {video && <source src={video} type="video/mp4"/>}
          </video>}
          <div className="mq-hero-vignette" aria-hidden="true"/>
          <div className="mq-hero-quest-pills" aria-hidden="true">
            <span>Money</span><span>Entrepreneur</span><span>Leadership</span><span>AI</span>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
