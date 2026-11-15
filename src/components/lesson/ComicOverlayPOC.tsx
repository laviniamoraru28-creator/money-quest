"use client";

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import {
  comicOverlays,
  IMG_W,
  IMG_H,
  OVERLAY_LOCALES,
  type OverlayLocale,
  type ComicOverlayRegion,
  type ComicSection,
} from "@/content/explorer-comic-overlay-registry";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
// Importing every topic file registers it into comicOverlays via its
// own registerComicOverlay(...) call — see explorer-comic-overlay-registry.ts.
import "@/content/explorer-comic-overlay-poc";
import "@/content/explorer-comic-overlay-needs-wants";
import "@/content/explorer-comic-overlay-saving";
import "@/content/explorer-comic-overlay-currencies";
import "@/content/explorer-comic-overlay-scams";
import "@/content/explorer-comic-overlay-long-term-thinking";
import "@/content/explorer-comic-overlay-giving";
import "@/content/explorer-comic-overlay-digital-money";
import "@/content/explorer-comic-overlay-investing-basics";
import "@/content/explorer-comic-overlay-junior-isa";

const LOCALE_LABELS: Record<OverlayLocale, string> = {
  en: "English (original)", ro: "Română", es: "Español", fr: "Français", de: "Deutsch",
  it: "Italiano", pt: "Português", nl: "Nederlands", pl: "Polski",
};

export const TOPIC_IDS = [
  "money_basics", "needs_wants", "saving", "currencies", "scams",
  "long_term_thinking", "giving", "digital_money", "investing_basics", "junior_isa",
] as const;

const TOPIC_LABELS: Record<string, string> = {
  money_basics: "What Is Money?", needs_wants: "Need It or Want It?", saving: "What Does Saving Mean?",
  currencies: "Money Looks Different Everywhere", scams: "Some Promises Are Too Good",
  long_term_thinking: "Waiting Can Pay Off", giving: "The Joy of Sharing",
  digital_money: "Money You Can't Hold", investing_basics: "Saving vs Growing Your Money",
  junior_isa: "A Junior ISA (JISA)",
};

/** Real accessibility floor for short comic dialogue (smaller than body
 * copy, as in any printed comic, but never shrunk past this). Below it,
 * the bubble shows nothing and the full text becomes a caption below
 * the panel instead — never a smaller, harder-to-read font. */
const MIN_FONT_PX = 11;
const MAX_FONT_PX_RATIO = 0.3; // of the region's own height

/**
 * Measures the text's ACTUAL rendered overflow and shrinks its font
 * size step by step until it truly fits the box (down to MIN_FONT_PX).
 * The step count must span the full range from the starting size down
 * to the floor — a fixed small step count bailed out partway down
 * while still overflowing, confirmed live in an earlier version (see
 * this round's final report).
 */
function useAutosizeText(
  containerRef: React.RefObject<HTMLDivElement | null>,
  text: string,
  maxFontPx: number
): { fontPx: number; overflowing: boolean } {
  const [fontPx, setFontPx] = useState(maxFontPx);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || maxFontPx <= 0) return;
    let size = maxFontPx;
    el.style.fontSize = `${size}px`;
    const steps = Math.ceil(maxFontPx - MIN_FONT_PX) + 2;
    for (let i = 0; i < steps && size > MIN_FONT_PX; i++) {
      const fits = el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
      if (fits) break;
      size = Math.max(MIN_FONT_PX, size - 1);
      el.style.fontSize = `${size}px`;
    }
    const stillOverflowing = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
    setFontPx(size);
    setOverflowing(stillOverflowing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxFontPx]);

  return { fontPx, overflowing };
}

function OverlayRegion({
  region,
  section,
  locale,
  imgWidthPx,
  onOverflowChange,
}: {
  region: ComicOverlayRegion;
  section: ComicSection;
  locale: OverlayLocale;
  imgWidthPx: number;
  onOverflowChange: (overflowing: boolean) => void;
}) {
  const text = region.text[locale];
  const measureRef = useRef<HTMLDivElement>(null);
  const boxWidthPx = (region.width / 100) * imgWidthPx;
  const regionHeightPx = (region.height / 100) * imgWidthPx * (IMG_H / IMG_W);
  const maxFontPx = regionHeightPx * MAX_FONT_PX_RATIO;
  const { fontPx, overflowing } = useAutosizeText(measureRef, text, maxFontPx);
  const radiusPx = region.radius * Math.min(boxWidthPx, regionHeightPx);

  useEffect(() => {
    onOverflowChange(overflowing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overflowing]);

  // Position relative to this region's own SECTION, not the full
  // image, since each section is rendered as its own cropped slice.
  // Only the vertical axis needs converting — left/width stay as a
  // percent of the full image width, which slicing never changes.
  const sectionSpanPx = section.yEnd - section.yStart;
  const topWithinSectionPx = ((region.top / 100) * IMG_H) - section.yStart;
  const topPct = (topWithinSectionPx / sectionSpanPx) * 100;
  const heightPct = (region.height * IMG_H) / (100 * sectionSpanPx) * 100;

  return (
    <div
      data-overlay-region={region.id}
      data-overlay-caption-mode={overflowing || undefined}
      className="absolute"
      style={{
        left: `${region.left}%`,
        top: `${topPct}%`,
        width: `${region.width}%`,
        height: `${heightPct}%`,
        // The bubble/box SHAPE and BACKGROUND always render — covering
        // the original artwork's text — regardless of whether this
        // region's own text fits. Omitting this when overflowing was a
        // real bug in an earlier version: it exposed the original
        // English text underneath, in every language. Only the text
        // *inside* is conditional; the cover never is.
        background: region.bg,
        borderRadius: `${radiusPx}px`,
      }}
    >
      {/* Mounted even while overflowing, off-screen (opacity 0) —
          needed so the measurement keeps running (e.g. after a width
          change this may start fitting again) without ever painting
          the clipped text. The real, readable text for this case
          lives in the caption below the panel instead. */}
      <div
        ref={measureRef}
        className="font-display flex h-full w-full items-center justify-center overflow-hidden px-[3%] py-[1%] text-center leading-[1.1]"
        style={{ color: region.textColor, fontWeight: region.fontWeight, fontSize: `${fontPx}px`, opacity: overflowing ? 0 : 1 }}
      >
        <span>{text}</span>
      </div>
    </div>
  );
}

function ComicSectionSlice({
  topicId,
  imageFile,
  section,
  regions,
  regionSection,
  locale,
  imgWidthPx,
  overflowing,
  setOverflowing,
}: {
  topicId: string;
  imageFile: string;
  section: ComicSection;
  regions: ComicOverlayRegion[];
  regionSection: Record<string, string>;
  locale: OverlayLocale;
  imgWidthPx: number;
  overflowing: Record<string, boolean>;
  setOverflowing: (id: string, value: boolean) => void;
}) {
  const sectionRegions = regions.filter((r) => regionSection[r.id] === section.id);
  const sectionHeightPct = ((section.yEnd - section.yStart) / IMG_H) * 100;
  const sliceHeightPx = (sectionHeightPct / 100) * imgWidthPx * (IMG_H / IMG_W);
  const captionRegions = sectionRegions.filter((r) => overflowing[r.id]);

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ height: imgWidthPx > 0 ? `${sliceHeightPx}px` : undefined }}
        data-comic-section={section.id}
        data-comic-topic={topicId}
      >
        <div
          style={{
            position: "absolute",
            top: `${-(section.yStart / IMG_H) * (imgWidthPx * (IMG_H / IMG_W))}px`,
            left: 0,
            width: "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/money-quest/lessons/comics/${imageFile}`}
            alt=""
            width={IMG_W}
            height={IMG_H}
            className="h-auto w-full max-w-full object-contain"
          />
        </div>
        {imgWidthPx > 0 &&
          sectionRegions.map((r) => (
            <OverlayRegion
              key={r.id}
              region={r}
              section={section}
              locale={locale}
              imgWidthPx={imgWidthPx}
              onOverflowChange={(v) => setOverflowing(r.id, v)}
            />
          ))}
      </div>
      {captionRegions.length > 0 && (
        <div data-comic-caption={section.id} className="mx-[3%] mb-2xs mt-2xs rounded-lg border border-teal/30 bg-cream px-sm py-2xs text-base leading-snug text-ink">
          {captionRegions.map((r) => (
            <p key={r.id} className="font-display">{r.text[locale]}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PROOF OF CONCEPT — not wired into any real lesson. Displays localized
 * dialogue as live HTML overlays on top of an UNMODIFIED Explorer
 * comic image, driven entirely by the registered data for `topicId`
 * (see explorer-comic-overlay-registry.ts) — the alternative to
 * generating 90 separate localized raster images. The image is split
 * into panel slices purely via CSS cropping (zero pixel changes) so a
 * caption can be inserted in real document flow directly below a
 * specific panel when that panel's bubble text still doesn't fit at a
 * readable size. See this round's final report for the full
 * comparison and the per-comic QA results across all 9 locales at all
 * 4 required widths.
 */
export function ComicOverlayPOC({ topicId = "money_basics" }: { topicId?: string }) {
  const [locale, setLocale] = useState<OverlayLocale>("en");
  const [topic, setTopic] = useState(topicId);
  const data = comicOverlays[topic];
  const fullText = data ? data.regions.map((r) => r.text[locale]).join(" ") : "";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [imgWidthPx, setImgWidthPx] = useState(0);
  const [overflowing, setOverflowingState] = useState<Record<string, boolean>>({});

  const setOverflowing = useCallback((id: string, value: boolean) => {
    setOverflowingState((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));
  }, []);

  useEffect(() => {
    setOverflowingState({});
  }, [topic]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setImgWidthPx(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-2xs">
      <div className="flex flex-wrap items-center gap-xs">
        <label className="text-sm font-semibold text-ink">
          Comic:{" "}
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="ml-2xs rounded-lg border border-teal/40 bg-white px-2xs py-3xs"
          >
            {TOPIC_IDS.map((t) => (
              <option key={t} value={t} disabled={!comicOverlays[t]}>
                {TOPIC_LABELS[t]}{!comicOverlays[t] ? " (not yet added)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-ink">
          POC language:{" "}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as OverlayLocale)}
            className="ml-2xs rounded-lg border border-teal/40 bg-white px-2xs py-3xs"
          >
            {OVERLAY_LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
            ))}
          </select>
        </label>
      </div>
      {!data ? (
        <p className="text-sm text-ink/70">No overlay data registered for &quot;{topic}&quot; yet.</p>
      ) : (
        <>
          <ReadAloudButton text={fullText} uiLocale={locale} />
          <div ref={wrapperRef} className="overflow-hidden rounded-xl shadow-floating" data-comic-overlay-poc data-comic-topic={topic}>
            {data.sections.map((section) => (
              <ComicSectionSlice
                key={`${topic}-${section.id}`}
                topicId={topic}
                imageFile={data.imageFile}
                section={section}
                regions={data.regions}
                regionSection={data.regionSection}
                locale={locale}
                imgWidthPx={imgWidthPx}
                overflowing={overflowing}
                setOverflowing={setOverflowing}
              />
            ))}
          </div>
          <p className="sr-only">{fullText}</p>
        </>
      )}
    </div>
  );
}
