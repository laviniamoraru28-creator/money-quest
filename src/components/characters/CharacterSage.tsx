"use client";

import { useTranslations } from "next-intl";

interface CharacterProps {
  size?: number;
  className?: string;
}

/** Sage the Owl — the character who helps explain financial concepts.
 * Same flat-shape, no-gradient style as CharacterPip.tsx and
 * Coin.tsx. An owl was chosen deliberately as a widely-understood,
 * non-frightening "wise helper" symbol that needs no explanation of
 * its own — the character should support the lesson content, not
 * compete with it for a child's attention. */
export function CharacterSage({ size = 64, className = "" }: CharacterProps) {
  const t = useTranslations();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label={t("characters.sage")}>
      {/* Body */}
      <ellipse cx="32" cy="36" rx="22" ry="24" fill="#5B4B8A" />
      {/* Face disc */}
      <ellipse cx="32" cy="30" rx="16" ry="15" fill="#EAE3F5" />
      {/* Eyes */}
      <circle cx="24" cy="29" r="6" fill="#FFFFFF" />
      <circle cx="40" cy="29" r="6" fill="#FFFFFF" />
      <circle cx="24" cy="29" r="3" fill="#1C2624" />
      <circle cx="40" cy="29" r="3" fill="#1C2624" />
      {/* Beak */}
      <path d="M32,34 L28,40 L36,40 Z" fill="#E8A33D" />
      {/* Eyebrow tufts, for a thoughtful look rather than a stern one */}
      <path d="M18,20 Q24,16 28,20" fill="none" stroke="#3D2F63" strokeWidth="2" strokeLinecap="round" />
      <path d="M36,20 Q40,16 46,20" fill="none" stroke="#3D2F63" strokeWidth="2" strokeLinecap="round" />
      {/* Wings */}
      <ellipse cx="12" cy="42" rx="6" ry="12" fill="#4A3D73" />
      <ellipse cx="52" cy="42" rx="6" ry="12" fill="#4A3D73" />
      {/* Feet */}
      <path d="M24,58 L24,62 M32,58 L32,63 M40,58 L40,62" stroke="#E8A33D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
