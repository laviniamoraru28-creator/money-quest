"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { moneyBasicsOverlayRegions, OVERLAY_LOCALES, type OverlayLocale, type ComicOverlayRegion } from "@/content/explorer-comic-overlay-poc";

const LOCALE_LABELS: Record<OverlayLocale, string> = {
  en: "English (original)", ro: "Română", es: "Español", fr: "Français", de: "Deutsch",
  it: "Italiano", pt: "Português", nl: "Nederlands", pl: "Polski",
};

/** Real accessibility floor for short comic dialogue (smaller than body
 * copy, as in any printed comic, but never shrunk past this). Below it,
 * the fix is a shorter translation or a bigger bubble — not a smaller font. */
const MIN_FONT_PX = 11;
const MAX_FONT_PX_RATIO = 0.3; // of the region's own height

/**
 * Measures the text's ACTUAL rendered overflow and shrinks its font
 * size step by step until it truly fits the box (down to MIN_FONT_PX) —
 * instead of estimating an ideal size from area/text-length, which an
 * earlier version of this POC did and which clipped several bubbles'
 * text outright at mobile width even after flooring the font size
 * (confirmed live, not assumed — see this round's final report). This
 * is the standard "autosize text to its container" technique: resize,
 * measure, repeat.
 */
function useAutosizeText(containerRef: React.RefObject<HTMLDivElement | null>, text: string, maxFontPx: number) {
  const [fontPx, setFontPx] = useState(maxFontPx);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || maxFontPx <= 0) return;
    let size = maxFontPx;
    el.style.fontSize = `${size}px`;
    // The step count must cover the full range from maxFontPx down to
    // MIN_FONT_PX at 1px per step, not a fixed small number — a large
    // region (e.g. a tall box with a high maxFontPx) needs far more
    // than 20 steps to actually reach the floor, which an earlier
    // version of this got wrong: it bailed out partway down, still
    // overflowing, while believing it had tried the floor (confirmed
    // live — see this round's final report).
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

function OverlayRegion({ region, locale, imgWidthPx }: { region: ComicOverlayRegion; locale: OverlayLocale; imgWidthPx: number }) {
  const text = region.text[locale];
  const measureRef = useRef<HTMLDivElement>(null);
  const boxWidthPx = (region.width / 100) * imgWidthPx;
  const boxHeightPx = (region.height / 100) * imgWidthPx * (1536 / 864);
  const maxFontPx = boxHeightPx * MAX_FONT_PX_RATIO;
  const { fontPx, overflowing } = useAutosizeText(measureRef, text, maxFontPx);
  const radiusPx = region.radius * Math.min(boxWidthPx, boxHeightPx);

  return (
    <div
      data-overlay-region={region.id}
      data-overlay-too-small={overflowing || undefined}
      className="absolute"
      style={{
        left: `${region.left}%`,
        top: `${region.top}%`,
        width: `${region.width}%`,
        height: `${region.height}%`,
        background: region.bg,
        borderRadius: `${radiusPx}px`,
        outline: overflowing ? "2px dashed #d64545" : undefined,
      }}
    >
      <div
        ref={measureRef}
        className="font-display flex h-full w-full items-center justify-center overflow-hidden px-[3%] py-[1%] text-center leading-[1.1]"
        style={{ color: region.textColor, fontWeight: region.fontWeight, fontSize: `${fontPx}px` }}
      >
        <span>{text}</span>
      </div>
    </div>
  );
}

/**
 * PROOF OF CONCEPT — not wired into any real lesson. Demonstrates
 * displaying localized dialogue as live HTML overlays on the
 * UNMODIFIED English money_basics comic image, as an alternative to
 * generating 90 separate localized raster images. See this round's
 * final report for the full comparison, the shape-mismatch and
 * text-clipping bugs this version fixes, and per-language visual QA
 * results across all 9 locales.
 */
export function ComicOverlayPOC() {
  const [locale, setLocale] = useState<OverlayLocale>("en");
  const fullText = moneyBasicsOverlayRegions.map((r) => r.text[locale]).join(" ");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [imgWidthPx, setImgWidthPx] = useState(0);

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
      <div className="flex items-center gap-xs">
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
      <ReadAloudButton text={fullText} uiLocale={locale} />
      <div ref={wrapperRef} className="relative mt-2xs overflow-hidden rounded-xl shadow-floating" data-comic-overlay-poc>
        <Image
          unoptimized
          src="/images/money-quest/lessons/comics/money_basics.webp"
          alt=""
          width={864}
          height={1536}
          sizes="(min-width: 768px) 560px, 100vw"
          className="h-auto w-full max-w-full object-contain"
        />
        {imgWidthPx > 0 &&
          moneyBasicsOverlayRegions.map((r) => (
            <OverlayRegion key={r.id} region={r} locale={locale} imgWidthPx={imgWidthPx} />
          ))}
      </div>
      <p className="sr-only">{fullText}</p>
    </div>
  );
}
