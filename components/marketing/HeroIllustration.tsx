interface HeroIllustrationProps {
  className?: string;
}

/**
 * An original, hand-authored illustration — no external image, no
 * photograph, no third-party asset. Flat shapes and simple strokes
 * only, deliberately matching the existing Coin component's style
 * (src/components/ui/Coin.tsx): solid fills, a thin embossed-look
 * inner ring where relevant, no gradients or photorealistic shading.
 * Consistent with the rest of the product's visual language rather
 * than introducing a second illustration style.
 *
 * Depicts a simple quest map: a winding path connecting waypoints
 * colored with each World's actual theme color (tailwind.config.ts's
 * `world.*` tokens) — genuinely relevant to what the site is (seven
 * Worlds reached by working through activities), not a generic
 * decorative image unrelated to the product.
 */
export function HeroIllustration({ className = "" }: HeroIllustrationProps) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-hidden="true">
      {/* Sky background */}
      <rect x="0" y="0" width="400" height="400" rx="24" fill="#EAF3F1" />

      {/* Sun */}
      <circle cx="320" cy="70" r="34" fill="#E8A33D" />
      <circle cx="320" cy="70" r="34" fill="none" stroke="#C77A1F" strokeWidth="2" opacity="0.4" />

      {/* Soft clouds */}
      <g fill="#FFFFFF" opacity="0.85">
        <ellipse cx="70" cy="60" rx="34" ry="16" />
        <ellipse cx="95" cy="52" rx="22" ry="14" />
        <ellipse cx="240" cy="110" rx="28" ry="13" />
        <ellipse cx="262" cy="104" rx="18" ry="11" />
      </g>

      {/* Ground */}
      <path d="M0,330 C 80,300 130,340 200,320 C 270,300 320,335 400,310 L400,400 L0,400 Z" fill="#DDEDE8" />

      {/* Winding quest path connecting seven waypoints, each colored
          with its World's real theme color from tailwind.config.ts */}
      <path
        d="M40,300 C 90,260 60,200 110,175 C 160,150 150,220 200,200 C 250,180 230,120 280,105 C 320,92 300,150 345,150"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="1 22"
      />

      {/* Waypoints, in World order (coin-cove -> kindness-grove) */}
      <circle cx="40" cy="300" r="14" fill="#E8A33D" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="110" cy="175" r="12" fill="#D13E19" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="150" cy="220" r="11" fill="#0B5C50" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="200" cy="200" r="12" fill="#367D99" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="230" cy="120" r="11" fill="#5B4B8A" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="280" cy="105" r="12" fill="#6E7B8B" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="345" cy="150" r="14" fill="#C97C93" stroke="#FFFFFF" strokeWidth="3" />

      {/* A simple flag marking the starting waypoint */}
      <line x1="40" y1="286" x2="40" y2="250" stroke="#1C2624" strokeWidth="3" strokeLinecap="round" />
      <path d="M40,250 L64,258 L40,266 Z" fill="#0F7A6B" />

      {/* A friendly coin character at the final waypoint, matching the
          Coin component's exact style (circle + embossed ring + "M"),
          celebrating having reached the last World rather than acting
          as an "earned value" indicator (see Coin.tsx's own doc
          comment on that distinction). */}
      <circle cx="345" cy="150" r="26" fill="#E8A33D" />
      <circle cx="345" cy="150" r="19" fill="none" stroke="#C77A1F" strokeWidth="2" />
      <text
        x="345"
        y="158"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="22"
        fill="#8A5613"
      >
        M
      </text>

      {/* Sparkle accents near the coin, keeping the scene lively
          without crowding it */}
      <g fill="#E8A33D">
        <path d="M300,190 l4,10 l10,4 l-10,4 l-4,10 l-4,-10 l-10,-4 l10,-4 Z" opacity="0.8" />
        <path d="M375,190 l3,7 l7,3 l-7,3 l-3,7 l-3,-7 l-7,-3 l7,-3 Z" opacity="0.6" />
      </g>
    </svg>
  );
}
