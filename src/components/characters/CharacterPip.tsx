"use client";

import { useTranslations } from "next-intl";

interface CharacterProps {
  size?: number;
  className?: string;
}

/**
 * Pip — the child explorer, the player's companion character. Flat
 * shapes and solid fills only, matching Coin.tsx's established style
 * (no gradients, no photorealism, no 3D shading). Simple enough to
 * read clearly at small sizes (a corner badge) and large ones (a hero
 * spot), which is why the design stays reducible to circles and a
 * handful of paths rather than fine detail that would blur or
 * disappear when scaled down.
 */
export function CharacterPip({ size = 64, className = "" }: CharacterProps) {
  const t = useTranslations();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label={t("characters.pip")}>
      {/* Head */}
      <circle cx="32" cy="30" r="20" fill="#F4C77A" />
      {/* Adventure cap */}
      <path d="M12,26 A20,20 0 0,1 52,26 L52,22 A20,14 0 0,0 12,22 Z" fill="#0F7A6B" />
      <circle cx="32" cy="18" r="3" fill="#E8A33D" />
      {/* Face */}
      <circle cx="24" cy="32" r="2.6" fill="#1C2624" />
      <circle cx="40" cy="32" r="2.6" fill="#1C2624" />
      <path d="M23,40 Q32,46 41,40" fill="none" stroke="#1C2624" strokeWidth="2.4" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="18" cy="36" r="3" fill="#E8A33D" opacity="0.4" />
      <circle cx="46" cy="36" r="3" fill="#E8A33D" opacity="0.4" />
      {/* Body / scarf */}
      <path d="M16,50 Q32,42 48,50 L48,58 Q32,62 16,58 Z" fill="#367D99" />
    </svg>
  );
}
