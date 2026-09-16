interface KeyTermBadgeProps {
  term: string;
  accentColor?: "gold" | "coral" | "soft-blue" | "teal";
}

const ACCENT_CLASSES: Record<NonNullable<KeyTermBadgeProps["accentColor"]>, string> = {
  gold: "bg-gold/20 text-gold-text",
  coral: "bg-coral/25 text-ink",
  "soft-blue": "bg-soft-blue/25 text-ink",
  teal: "bg-teal/15 text-teal",
};

/**
 * A small rounded "pill" for a single key financial term (NEED, WANT,
 * SAVE, SPEND, EARN, SHARE, etc.) — used to make important concepts
 * visually memorable, per the redesign brief, rather than relying on
 * plain bold text alone. Rotates through the new cheerful accent
 * colors (gold, coral, soft-blue) plus teal, all pre-verified for
 * ink-text contrast in tailwind.config.ts, so callers never need to
 * re-check contrast themselves.
 */
export function KeyTermBadge({ term, accentColor = "teal" }: KeyTermBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-sm py-3xs font-display text-sm font-bold uppercase tracking-wide ${ACCENT_CLASSES[accentColor]}`}
    >
      {term}
    </span>
  );
}
