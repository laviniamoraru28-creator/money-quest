"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { PricePoint, TimePeriod } from "../types";

const PERIODS: TimePeriod[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

interface PriceChartProps {
  points: PricePoint[];
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  color: string;
}

/**
 * A small, hand-built SVG line chart - deliberately not a charting
 * library (none exists in this project, and none of this data is real
 * enough to justify adding one). `points` always comes from
 * getSeriesForPeriod() in engine.ts, so every value here is already a
 * fixed, simulated number; nothing about this component itself is
 * random or time-dependent.
 *
 * A line chart has no meaningful text content for a screen reader on
 * its own, so the actual up/down/percent information is always shown
 * as real text elsewhere on the page (never conveyed by this chart's
 * color alone) - this component is supplementary, and marked
 * `aria-hidden` accordingly, with a short visible caption instead.
 */
export function PriceChart({ points, period, onPeriodChange, color }: PriceChartProps) {
  const t = useTranslations();
  const gradientId = useId();

  const width = 300;
  const height = 120;
  const values = points.map((p) => p.priceMinorUnits);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
    const y = height - ((p.priceMinorUnits - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = coords.join(" ");
  const areaPath = `0,${height} ${linePath} ${width},${height}`;

  return (
    <div>
      <div className="flex flex-wrap gap-3xs" role="group" aria-label={t("investingLab.chartPeriodGroupLabel")}>
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => onPeriodChange(p)}
            className={[
              "min-h-touch-min-child rounded-sm border px-2xs py-3xs text-xs font-medium",
              period === p ? "border-teal bg-teal/10 text-teal" : "border-ink/15 text-ink/60 hover:border-teal/50",
            ].join(" ")}
          >
            {t(`investingLab.period.${p}`)}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2xs h-32 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPath} fill={`url(#${gradientId})`} />
        <polyline points={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <p className="mt-2xs text-xs text-ink/50">{t("investingLab.chartFictionalNote")}</p>
    </div>
  );
}
