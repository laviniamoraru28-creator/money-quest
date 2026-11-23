"use client";
import { CinematicScene } from "./CinematicScene";
type Props = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  poster: string;
  video?: string;
};
export function CinematicWorldHero({
  title,
  subtitle,
  cta,
  href,
  poster,
  video,
}: Props) {
  return (
    <section
      data-homepage-hero
      className="mq-cinematic mq-cinematic-hero"
      aria-labelledby="mq-hero-heading"
    >
      <div className="mq-hero-sky" aria-hidden="true" />
      <div className="mq-hero-inner">
        <div className="mq-hero-copy">
          <p className="mq-hero-eyebrow">MONEY QUEST EDUCATION</p>
          <h1 id="mq-hero-heading">{title}</h1>
          <p className="mq-hero-subtitle">{subtitle}</p>
          <a href={href} className="mq-hero-cta">
            {cta}
            <span aria-hidden="true"> ✦</span>
          </a>
        </div>
        <div className="mq-hero-scene">
          <div
            className="mq-hero-media"
            style={{ backgroundImage: `url("${poster}")` }}
          >
            {video && (
              <CinematicScene
                src={video}
                mobile="/cinematic/world/home-mobile.mp4"
                poster={poster}
                className="mq-hero-video is-ready"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
