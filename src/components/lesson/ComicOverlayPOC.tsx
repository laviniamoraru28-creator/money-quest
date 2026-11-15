"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { moneyBasicsOverlayRegions } from "@/content/explorer-comic-overlay-poc";

type PocLocale = "en" | "ro";

/**
 * PROOF OF CONCEPT — not wired into any real lesson. Demonstrates
 * displaying localized dialogue as live HTML overlays on the
 * UNMODIFIED English money_basics comic image, as an alternative to
 * generating 80 separate localized raster images. See this round's
 * final report for the full comparison and recommendation.
 */
export function ComicOverlayPOC() {
  const [locale, setLocale] = useState<PocLocale>("en");
  const fullText = moneyBasicsOverlayRegions.map((r) => r.text[locale]).join(" ");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [imgWidthPx, setImgWidthPx] = useState(0);

  useLayoutEffect(() => {
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
            onChange={(e) => setLocale(e.target.value as PocLocale)}
            className="ml-2xs rounded-lg border border-teal/40 bg-white px-2xs py-3xs"
          >
            <option value="en">English (original)</option>
            <option value="ro">Română (overlay)</option>
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
          moneyBasicsOverlayRegions.map((r) => {
            const text = r.text[locale];
            // Fit font size to this region's ACTUAL rendered pixel box
            // (measured via ResizeObserver, not a CSS container-query
            // unit self-reference, which doesn't resolve reliably when
            // an element queries its own size for its own font-size —
            // confirmed by this POC: see the final report) — so the
            // same region looks right whether the image is mobile
            // full-width or capped at its desktop max-width, and a
            // longer translation shrinks instead of overflowing.
            const boxWidthPx = (r.width / 100) * imgWidthPx;
            const boxHeightPx = (r.height / 100) * imgWidthPx * (1536 / 864);
            const areaFactor = Math.sqrt((boxWidthPx * boxHeightPx) / Math.max(text.length, 1));
            const fontPx = Math.min(boxHeightPx * 0.32, Math.max(8, areaFactor * 0.78));
            return (
              <div
                key={r.id}
                data-overlay-region={r.id}
                className="absolute flex items-center justify-center overflow-hidden px-[4%] py-[2%] text-center leading-[1.15]"
                style={{
                  left: `${r.left}%`,
                  top: `${r.top}%`,
                  width: `${r.width}%`,
                  height: `${r.height}%`,
                  background: r.bg,
                  color: r.textColor,
                  fontWeight: r.fontWeight,
                  borderRadius: r.shape === "bubble" ? "999px" : "14px",
                  fontSize: `${fontPx}px`,
                }}
              >
                <span className="font-display">{text}</span>
              </div>
            );
          })}
      </div>
      <p className="sr-only">{fullText}</p>
    </div>
  );
}
