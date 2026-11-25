"use client";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { CURRENCIES } from "@/data/currencies";
import { LEVEL_OPTIONS } from "@/content/level-options";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { LQ_MISSIONS } from "@/content/leadership-quest/structures";
import { WORLDS } from "@/content/worlds";
import { getWorldCatalog, getActivityHref } from "@/content/catalog";
import { isCertificateEligible } from "@/lib/certificates/eligibility";
import { isFourQuestCertificateReady, requiredAiLessons } from "@/lib/certificates/three-quest-eligibility";
import { RewardsPanel } from "./RewardsPanel";
import { type AgeBand } from "@/types/database.types";
import { cinematicCopy } from "@/content/cinematic-copy";
import { type Locale } from "@/i18n/config";

const paths = [
  "/play",
  "/entrepreneur-quest",
  "/leadership-quest",
  "/ai-quest",
];
const names = ["MQ", "EQ", "LQ", "AI"];
export function AdventureHud() {
  const path = usePathname(),
    router = useRouter(),
    t = useTranslations(),
    locale = useLocale() as Locale;
  const { state, isLoaded, setAgeBand, setCurrencyCode } = useLocalProgress();
  const eq = useEntrepreneurQuest(),
    lq = useLeadershipQuest();
  const index = paths.findIndex(
    (href) => path === href || path.startsWith(href + "/"),
  );
  const navRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const spacer = spacerRef.current;
    if (!nav || !spacer) return;
    const resize = () => { spacer.style.height = nav.offsetHeight + "px"; };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [index, isLoaded, state.ageBand]);
  if (index < 0 || !isLoaded || !state.ageBand) return null;
  const band = state.ageBand;
  const match = path.match(
    /^\/play\/world\/([^/]+)(?:\/(?:lesson|game)\/([^/]+))?$/,
  );
  let next = paths[index + 1] ?? "/play",
    back = paths[index - 1] ?? "/";
  if (index === 0) {
    const catalog = WORLDS.flatMap((w) => getWorldCatalog(w.id, band, t));
    const position = catalog.findIndex((item) => item.id === match?.[2]);
    const after =
      position >= 0
        ? catalog[position + 1]
        : catalog.find(
            (item) =>
              (!match || item.worldId === match[1]) &&
              !state.completedActivityIds.includes(item.id),
          );
    const before = catalog[position - 1];
    if (after) next = getActivityHref(after.worldId, after);
    back = before
      ? getActivityHref(before.worldId, before)
      : match
        ? "/play"
        : "/";
  } else {
    if (path !== paths[index]) back = paths[index]!;
    if (index === 1 && !eq.state.pitchCompleted)
      next = path.startsWith("/entrepreneur-quest/build")
        ? "/entrepreneur-quest"
        : "/entrepreneur-quest/build";
    if (index === 2) {
      const mission = LQ_MISSIONS.find(
        (m) => !lq.state.completedMissionIds.includes(m.id),
      );
      if (mission)
        next = path.endsWith("/" + mission.id)
          ? "/leadership-quest"
          : "/leadership-quest/missions/" + mission.id;
    }
    if (index === 3) {
      const aiDone = requiredAiLessons(band).every(id => state.completedActivityIds.includes(id));
      next = isFourQuestCertificateReady(state.completedActivityIds, band, eq.state, lq.state)
        ? "/academy-certificate?level=" + band
        : aiDone ? paths.find((_, i) => [!isCertificateEligible(state.completedActivityIds, band), !eq.state.pitchCompleted, !LQ_MISSIONS.every(mission => lq.state.completedMissionIds.includes(mission.id))][i]) ?? "/play" : "/ai-quest#ai-mission";
    }
  }
  return (
    <div ref={spacerRef} className="h-28 sm:h-16" data-hud-band={band}>
      <nav ref={navRef}
        aria-label={cinematicCopy[locale][2]}
        className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-1 border-t border-[#d8bd88] bg-[#14263e]/95 px-1 pb-[env(safe-area-inset-bottom)] text-sm text-white backdrop-blur"
      >
        <Link
          aria-label={t("nav.home")}
          href="/"
          className="grid h-11 w-11 place-items-center"
        >
          ⌂
        </Link>
        <select
          aria-label={cinematicCopy[locale][2]}
          className="h-11 rounded bg-[#243448]"
          value={paths[index]}
          onChange={(e) => router.push(e.target.value)}
        >
          {paths.map((href, i) => (
            <option key={href} value={href}>
              {names[i]}
            </option>
          ))}
        </select>
        <select
          aria-label={t("play.chooseYourLevel")}
          value={band}
          className="h-11 w-16 rounded bg-[#243448]"
          onChange={(e) => {
            setAgeBand(e.target.value as AgeBand);
            if (path !== paths[index]) router.push(paths[index]!);
          }}
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option value={opt.ageBand} key={opt.ageBand}>
              {t(opt.rangeKey)}
            </option>
          ))}
        </select>
        <RewardsPanel />
        <Link href="/play" aria-label={t("play.yourWorldMap")} className="grid h-11 w-11 place-items-center"><span aria-hidden="true">🗺️</span></Link>
        <select
          id="currency-select"
          aria-label={t("play.currency")}
          className="h-11 w-14 rounded bg-[#243448]"
          value={state.currencyCode}
          onChange={(e) => setCurrencyCode(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option value={c.code} key={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <Link
          aria-label={t("common.back")}
          className="grid h-11 w-11 place-items-center"
          href={back}
        >
          ←
        </Link>
        <Link
          aria-label={t("play.nextActivity")}
          className="grid h-11 w-11 place-items-center"
          href={next}
        >
          →
        </Link>
      </nav>
    </div>
  );
}
