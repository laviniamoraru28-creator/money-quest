interface CoinProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<CoinProps["size"]>, number> = { sm: 20, md: 32, lg: 64 };

/** Matches the Coins component spec (design system Section 7.2): a
 * circular gold token with an embossed inner ring, never a photorealistic
 * or 3D-rendered coin. Reserved for contexts that represent real earned
 * fictional value — never used as decoration (Principle 2). */
export function Coin({ size = "md", className = "" }: CoinProps) {
  const px = SIZE_PX[size];
  return (
    <svg width={px} height={px} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#E8A33D" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#C77A1F" strokeWidth="2" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="14"
        fill="#8A5613"
      >
        M
      </text>
    </svg>
  );
}
