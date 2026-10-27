/**
 * Pictograms for the visual-first pilot (save-for-something-you-love,
 * my-first-mini-business, share-my-idea) — a small, fixed set reused
 * across the three missions' picture-choice grids and result panels,
 * same inline-SVG, decorative (`aria-hidden`), stroke="currentColor"
 * approach as VariantIcon.tsx/MissionIcon.tsx. Each shape is chosen to
 * be recognisable on its own — these are the actual communication
 * surface for a nonverbal child (tapping one IS how they answer "what's
 * your goal/idea/item", not a decoration next to the real answer), so
 * none of them are generic placeholders: a toy is a toy shape, a book
 * is a book shape, a game controller is a game controller shape.
 */
export type PilotIconName =
  | "toy"
  | "book"
  | "game"
  | "star"
  | "jarEmpty"
  | "jarFilled"
  | "drawing"
  | "baking"
  | "stall"
  | "customer"
  | "customerHappy"
  | "story"
  | "built"
  | "listener"
  | "listenerHappy"
  | "presentItem"
  | "presentIdea";

const PATHS: Record<PilotIconName, React.ReactNode> = {
  toy: (
    <>
      <circle cx="12" cy="9" r="4" />
      <path d="M8 13l-2 7h12l-2-7" />
      <circle cx="10.3" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10 10.3c.6.5 1.4.5 2 0" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5c2.5-1 5-1 8 0v13c-3-1-5.5-1-8 0z" />
      <path d="M20 5.5c-2.5-1-5-1-8 0v13c3-1 5.5-1 8 0z" />
    </>
  ),
  game: (
    <>
      <rect x="3" y="9" width="18" height="8" rx="4" />
      <path d="M8 11.5v3M6.5 13h3" />
      <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="14" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  star: <path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" />,
  jarEmpty: (
    <>
      <path d="M8 4h8M9 4v2.5l-1.5 2A3 3 0 006.5 11v7a2 2 0 002 2h7a2 2 0 002-2v-7a3 3 0 00-1-2.5L15 6.5V4" />
    </>
  ),
  jarFilled: (
    <>
      <path d="M8 4h8M9 4v2.5l-1.5 2A3 3 0 006.5 11v7a2 2 0 002 2h7a2 2 0 002-2v-7a3 3 0 00-1-2.5L15 6.5V4" />
      <path d="M6.5 14h11" fill="none" />
      <path d="M7 14h10v4a2 2 0 01-2 2h-6a2 2 0 01-2-2z" fill="currentColor" stroke="none" opacity="0.3" />
    </>
  ),
  drawing: (
    <>
      <path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19z" />
      <path d="M13.5 6.5L17 10" />
    </>
  ),
  baking: (
    <>
      <path d="M5 11a7 7 0 0114 0z" />
      <path d="M4 11h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
      <path d="M8 20h8" />
      <path d="M9 18l.5-3M15 18l-.5-3" />
    </>
  ),
  stall: (
    <>
      <path d="M4 10l1.3-5h13.4L20 10" />
      <path d="M4 10h16v2a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2v-2z" />
      <path d="M6 14v6h12v-6" />
    </>
  ),
  customer: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M5.5 20c0-4.1 3-6.5 6.5-6.5s6.5 2.4 6.5 6.5" />
    </>
  ),
  customerHappy: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M10.3 7.3c.7.6 1.7.6 2.4 0" />
      <path d="M5.5 20c0-4.1 3-6.5 6.5-6.5s6.5 2.4 6.5 6.5" />
      <path d="M17 3.5l1 1.3M19.5 5l-1.3 1" opacity="0.8" />
    </>
  ),
  story: (
    <>
      <path d="M4 6.5c2-1 5.5-1 7 .5v12c-1.5-1.5-5-1.5-7-.5z" />
      <path d="M20 6.5c-2-1-5.5-1-7 .5v12c1.5-1.5 5-1.5 7-.5z" />
      <path d="M8 8.3c.8.3 1.6.5 2.3.9M13.7 9.2c.7-.4 1.5-.6 2.3-.9" />
    </>
  ),
  built: (
    <>
      <rect x="4" y="12" width="6" height="7" />
      <rect x="10" y="7" width="6" height="12" />
      <path d="M16 19h4V5l-4 2z" />
    </>
  ),
  listener: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M5.5 20c0-4.1 3-6.5 6.5-6.5s6.5 2.4 6.5 6.5" />
      <path d="M9.3 6.6a3 3 0 015.4 0" opacity="0.6" />
    </>
  ),
  listenerHappy: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M10.3 7.3c.7.6 1.7.6 2.4 0" />
      <path d="M5.5 20c0-4.1 3-6.5 6.5-6.5s6.5 2.4 6.5 6.5" />
      <path d="M18 3.5c1 .3 1.6 1.1 1.6 2 0 1.3-1.6 2.4-1.6 2.4S16.4 6.8 16.4 5.5c0-.9.6-1.7 1.6-2z" fill="currentColor" stroke="none" />
    </>
  ),
  // An open eye — "look at this" — used on the "Show it!" action button
  // so its purpose (presenting something to someone) has a visual
  // affordance of its own, not text alone. Chosen over an earlier
  // hand-plus-object attempt because that version was too detailed to
  // read clearly at a 20px button size; an eye shape stays unambiguous
  // that small and doesn't risk being mistaken for the page's other
  // person-shaped icons (customer/listener).
  presentItem: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // A lightbulb — "here's an idea" — used on the "Share it!" action
  // button. Deliberately a plain, bold, well-known idea pictogram rather
  // than a hand holding a smaller bulb (which, at small size, read too
  // much like the page's person icons); clearly distinct from
  // presentItem and from customer/listener, and doesn't imply speech.
  presentIdea: (
    <>
      <path d="M12 3a6 6 0 00-6 6c0 2.5 1.5 3.8 2.3 4.9.5.7.7 1.3.7 2.1h6c0-.8.2-1.4.7-2.1C16.5 12.8 18 11.5 18 9a6 6 0 00-6-6z" />
      <path d="M9.6 18.2h4.8M10 20.5h4" />
    </>
  ),
};

export function PilotIcon({ name, className = "" }: { name: PilotIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
