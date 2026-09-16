interface CharacterProps {
  size?: number;
  className?: string;
}

/** Zip the Squirrel — the character who sometimes makes money
 * mistakes and tries again, featured in the Money Mistakes Lab. Same
 * flat, no-gradient style as the other two characters. Deliberately
 * drawn mid-expression (wide eyes, slightly open mouth) rather than
 * sad or ashamed — a "whoops, let's think about that" energy, never
 * a punished or upset one, matching the product's explicit rule
 * against shaming language for mistakes. */
export function CharacterZip({ size = 64, className = "" }: CharacterProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Zip the Squirrel">
      {/* Tail */}
      <path d="M46,44 Q60,40 56,20 Q52,4 36,10 Q50,12 50,26 Q50,38 40,42 Z" fill="#D13E19" />
      {/* Body */}
      <ellipse cx="28" cy="40" rx="16" ry="18" fill="#E8A33D" />
      {/* Belly */}
      <ellipse cx="28" cy="44" rx="9" ry="11" fill="#FBEFDC" />
      {/* Head */}
      <circle cx="28" cy="22" r="14" fill="#E8A33D" />
      {/* Ears */}
      <circle cx="18" cy="12" r="5" fill="#E8A33D" />
      <circle cx="38" cy="12" r="5" fill="#E8A33D" />
      <circle cx="18" cy="12" r="2.4" fill="#FBEFDC" />
      <circle cx="38" cy="12" r="2.4" fill="#FBEFDC" />
      {/* Wide, surprised-but-fine eyes */}
      <circle cx="22" cy="22" r="3.4" fill="#FFFFFF" />
      <circle cx="34" cy="22" r="3.4" fill="#FFFFFF" />
      <circle cx="22" cy="22" r="1.8" fill="#1C2624" />
      <circle cx="34" cy="22" r="1.8" fill="#1C2624" />
      {/* Small open mouth - a "whoops" not a frown */}
      <ellipse cx="28" cy="29" rx="2.4" ry="1.8" fill="#8A5613" />
      {/* A dropped acorn - the "small mistake," drawn falling, not broken */}
      <circle cx="48" cy="52" r="4" fill="#8A5613" />
      <path d="M45,49 Q48,45 51,49" fill="none" stroke="#5C380D" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
