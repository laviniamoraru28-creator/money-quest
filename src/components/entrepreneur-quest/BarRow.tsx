/**
 * A single labeled proportion bar — plain CSS width, no SVG, no
 * charting library (none exists anywhere in this codebase; see
 * investing-lab/components/PriceChart.tsx's own doc comment for why
 * that's the deliberate convention here). The real number is always
 * shown as visible text next to the bar, never color/width alone, so
 * nothing here depends on being able to see or compare bar lengths.
 * Uses no animation or transition, so it needs no extra handling for
 * the app's reduced-motion setting.
 */
export function BarRow({ label, value, maxValue, displayValue }: { label: string; value: number; maxValue: number; displayValue: string }) {
  const percent = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div className="mt-2xs">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/70">{label}</span>
        <span className="font-medium text-ink">{displayValue}</span>
      </div>
      <div className="mt-3xs h-2 w-full rounded-full bg-ink/10" role="img" aria-label={`${label}: ${displayValue}`}>
        <div className="h-2 rounded-full bg-teal" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
