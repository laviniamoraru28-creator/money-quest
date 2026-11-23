import Image from "next/image";
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
    <Image unoptimized src="/cinematic/rewards/coin.webp" width={px} height={px} alt="" className={className}/>
  );
}
