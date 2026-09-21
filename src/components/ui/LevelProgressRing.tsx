interface LevelProgressRingProps {
  percent: number;
  color: string;
  size?: number;
  className?: string;
}

/**
 * A simple circular progress indicator — flat stroke, no gradient or
 * shadow, matching the same visual language as Coin.tsx (solid fills/
 * strokes only). Deliberately just a ring with a number, not a
 * competitive-feeling scoreboard element —
 * consistent with "no unnecessary competitive pressure" from the
 * Journey brief: this shows a child their own progress, not a
 * comparison against anyone else.
 */
export function LevelProgressRing({ percent, color, size = 56, className = "" }: LevelProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7E5" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="14" fill="#1C2624">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
