interface LevelBadgeStarProps {
  size?: number;
  className?: string;
}

/** A flat, solid-fill star — the same "no gradients, no photorealism"
 * rule as every other icon in the app. Shown only when a level is
 * fully complete, as a quiet celebration rather than a competitive
 * scoreboard element. */
export function LevelBadgeStar({ size = 24, className = "" }: LevelBadgeStarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1.5 L15.09 8.26 L22.5 9.24 L17 14.14 L18.54 21.5 L12 17.77 L5.46 21.5 L7 14.14 L1.5 9.24 L8.91 8.26 Z"
        fill="#E8A33D"
        stroke="#C77A1F"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
