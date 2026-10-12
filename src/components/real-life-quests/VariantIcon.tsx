import type { RLQVariant } from "@/content/real-life-quests/structures";

/**
 * A simple, consistent, inline-SVG pictogram per variant — no icon
 * library added (none exists in this project; see
 * EntrepreneurQuestLogo.tsx for the same "plain inline SVG, no external
 * graphics dependency" precedent). Each shape is deliberately neutral
 * about which variant is "better": a straight path for the regular
 * steps, a single figure for doing it independently, a picture frame
 * for the visual version — never a star, trophy, or anything that could
 * read as "this one is the prize" (a child should never be nudged
 * toward "independent" to feel like they're succeeding more).
 *
 * Decorative only (`aria-hidden`) — the real accessible name for each
 * variant button is its own visible text label (realLifeQuests.
 * variantLabels.*), unchanged by this icon. `stroke="currentColor"`
 * means the icon always matches the button's own text color (white on
 * the selected teal background, ink on the unselected white background)
 * with no separate color logic to keep in sync — and because the shape
 * itself differs per variant, distinguishing them never depends on
 * color alone.
 */
const ICON_PATHS: Record<RLQVariant, React.ReactNode> = {
  standard: <path d="M4 12h13M13 7l5 5-5 5" />,
  independent: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M5.5 20c0-4.1 3-6.5 6.5-6.5s6.5 2.4 6.5 6.5" />
    </>
  ),
  simpler: (
    <>
      <rect x="3" y="4.5" width="18" height="14" rx="2" />
      <circle cx="8" cy="9.5" r="1.4" />
      <path d="M3.8 16.5l4.7-4.2 3.6 3 5-5.3 3.9 4" />
    </>
  ),
};

export function VariantIcon({ variant, className = "" }: { variant: RLQVariant; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {ICON_PATHS[variant]}
    </svg>
  );
}

/** The selected-state indicator for the variant/reflection toggle
 * buttons — a real checkmark shape, not just a background-color
 * change, so "which one is picked" is never color-only (see the
 * mission page's own comment on why this matters). Decorative:
 * `aria-pressed` on the button is what actually tells assistive tech
 * which one is selected. */
export function SelectedCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}
