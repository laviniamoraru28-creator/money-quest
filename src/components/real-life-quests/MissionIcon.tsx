import type { RLQCategory } from "@/content/real-life-quests/structures";

/**
 * A consistent, reusable pictogram system for Real Life Quests — one
 * meaningful (not generic/decorative) icon per mission, plus one per
 * category. This exists because the mission/hub text alone gives a
 * nonverbal or non-reading child no way to recognise "which mission is
 * this" or "what does it involve" without someone reading the title to
 * them. Each shape depicts the mission's real-world object or action
 * (a market stall, a magnifying glass over price tags, a recycling
 * loop…), not an abstract placeholder — the same reasoning
 * VariantIcon.tsx already documents for why these are inline SVG and
 * not emoji: a shape a design system owns and can keep consistent,
 * rather than a font glyph that renders differently per device and
 * carries no guaranteed meaning on its own.
 *
 * Honest limits of this system (see the Real Life Quests Phase 1 review
 * report): this identifies the MISSION, it does not walk a non-reading
 * child through its individual steps — the materials/steps lists remain
 * text. True per-step illustrated sequences for all 12 missions are a
 * larger asset-production effort tracked separately, not attempted here.
 *
 * Decorative only (`aria-hidden`): the mission's translated title is
 * still the real accessible name, unchanged by this icon.
 * `stroke="currentColor"` so it always matches the surrounding text
 * color with no separate color logic — and because the shape itself
 * differs per mission, recognising one mission from another never
 * depends on color alone.
 */
const MISSION_ICON_PATHS: Record<string, React.ReactNode> = {
  // Money Skills
  "save-for-something-you-love": (
    <>
      <path d="M4 20V11c0-1.5 1.2-2.5 2.6-2.8l1.9-3.7c.3-.6 1-1 1.7-1h3.6c.7 0 1.4.4 1.7 1l1.9 3.7c1.4.3 2.6 1.3 2.6 2.8v9" />
      <circle cx="8.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <path d="M9 20v-3h6v3" />
      <path d="M12 2.5v2" />
      <path d="M10 3.3l1 1.2 1-1.2" />
    </>
  ),
  "the-price-detective": (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="M14.3 14.3L20 20" />
      <rect x="7.5" y="8" width="2.4" height="3.2" rx="0.3" />
      <rect x="10.5" y="8" width="2.4" height="3.2" rx="0.3" />
    </>
  ),
  "plan-a-shopping-trip": (
    <>
      <path d="M5 8h14l-1.4 9.5a2 2 0 01-2 1.5H8.4a2 2 0 01-2-1.5L5 8z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 017 0V8" />
      <path d="M9.5 12h5M9.5 14.5h3" />
    </>
  ),
  "resource-rescue": (
    <>
      <rect x="7" y="9" width="10" height="9" rx="1" />
      <path d="M9.5 9V7.5a2.5 2.5 0 015 0V9" />
      <path d="M4 6.5l2.3-2.3M4 6.5l2.3 2.3M4 6.5h4" />
      <path d="M20 6.5l-2.3-2.3M20 6.5l-2.3 2.3M20 6.5h-4" />
    </>
  ),

  // Entrepreneurship
  "make-something": (
    <>
      <path d="M5 19l2.3-.6a2 2 0 001-.55L16.3 9.8a1.6 1.6 0 000-2.3l-1.1-1.1a1.6 1.6 0 00-2.3 0L4.9 15.4a2 2 0 00-.55 1L3.8 18.7z" />
      <path d="M11.8 8.9l2.5 2.5" />
    </>
  ),
  "my-first-mini-business": (
    <>
      <path d="M4 10l1.3-5h13.4L20 10" />
      <path d="M4 10h16v2a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2v-2z" />
      <path d="M6 14v6h12v-6" />
      <path d="M10 20v-3.5h4V20" />
    </>
  ),
  "test-my-idea": (
    <>
      <path d="M9 16h6" />
      <path d="M12 3a5.5 5.5 0 00-3 10.1c.4.3.6.7.6 1.2v.2h4.8v-.2c0-.5.2-.9.6-1.2A5.5 5.5 0 0012 3z" />
      <path d="M10.5 18.5h3" />
      <path d="M9.5 20.5h5" />
    </>
  ),
  "understand-the-numbers": <path d="M4 20V9M9 20v-6M14 20V5M19 20v-9" />,

  // Leadership
  "solve-a-real-problem": (
    <>
      <path d="M12 3l2 3.5 4 .6-3 2.8.7 4L12 12l-3.7 1.9.7-4-3-2.8 4-.6z" />
      <path d="M9.5 16.5L8 21l4-2 4 2-1.5-4.5" />
    </>
  ),
  "make-something-together": (
    <>
      <circle cx="7.5" cy="7" r="2.2" />
      <circle cx="16.5" cy="7" r="2.2" />
      <path d="M3.5 19v-1.5A3.5 3.5 0 017 14h1a3.5 3.5 0 013 2.2" />
      <path d="M20.5 19v-1.5A3.5 3.5 0 0017 14h-1a3.5 3.5 0 00-3 2.2" />
      <path d="M11 17h2" />
    </>
  ),
  "share-my-idea": (
    <>
      <circle cx="12" cy="9.5" r="5" />
      <path d="M9.5 20l1-3.5h3l1 3.5" />
      <path d="M12 1.5v1.5M6 4l1 1.3M18 4l-1 1.3" />
    </>
  ),
  "learn-change-and-try-again": (
    <>
      <path d="M19 10a7 7 0 10-2 6.5" />
      <path d="M19 5v5h-5" />
      <circle cx="9.5" cy="18.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="18.5" r="0.4" fill="currentColor" stroke="none" />
    </>
  ),
};

export function MissionIcon({ missionId, className = "" }: { missionId: string; className?: string }) {
  const path = MISSION_ICON_PATHS[missionId];
  if (!path) return null;
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
      {path}
    </svg>
  );
}

const CATEGORY_ICON_PATHS: Record<RLQCategory, React.ReactNode> = {
  "money-skills": (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.5 9.3c-.4-.6-1.3-1-2.3-1-1.4 0-2.5.7-2.5 1.8 0 1 .9 1.4 2.3 1.7 1.6.4 2.7.9 2.7 2 0 1.1-1.1 1.8-2.5 1.8-1.1 0-2-.4-2.4-1" />
    </>
  ),
  entrepreneurship: (
    <>
      <path d="M4 10l1.3-5h13.4L20 10" />
      <path d="M4 10h16v2a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 01-2 2 2 2 0 01-2-2v-2z" />
      <path d="M6 14v6h12v-6" />
    </>
  ),
  leadership: (
    <>
      <circle cx="8" cy="8" r="2.4" />
      <circle cx="16" cy="8" r="2.4" />
      <path d="M3.5 19.5v-1.2A3.3 3.3 0 017 15h2a3.3 3.3 0 013 2.1" />
      <path d="M20.5 19.5v-1.2A3.3 3.3 0 0017 15h-1" />
      <path d="M12 17h1" />
    </>
  ),
};

export function CategoryIcon({ category, className = "" }: { category: RLQCategory; className?: string }) {
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
      {CATEGORY_ICON_PATHS[category]}
    </svg>
  );
}

/** A visible "it's done" badge — a filled checkmark circle, not just a
 * color/text change, so a completed mission is recognisable by shape
 * alone (brief: "a visible result showing what happened"). */
export function CompletedBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** A play-triangle-in-a-circle — "begin this mission" — on the "Mark as
 * started" button, so starting has a visual affordance of its own, not
 * text alone. Universally used for "start/play"; decorative only
 * (`aria-hidden`), the button's own translated text stays the real
 * accessible name. */
export function StartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M10 8.3l6 3.7-6 3.7z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

/** The "Mark as completed" button's BEFORE-completion icon — an outline
 * checkmark-in-a-circle, deliberately the unfilled counterpart of
 * CompletedBadge's filled circle, so "you can still do this" and
 * "you've done this" are two different shapes (outline vs filled), not
 * two colors of the same shape. Decorative only. */
export function MarkCompleteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}

/** A medal (star inside a disc, with ribbon tails) — "you earned a
 * reward" — shown once, right when a mission is freshly completed, next
 * to the existing translated XP text. A distinct shape from the
 * checkmark-based icons above so "you did it" (MarkCompleteIcon /
 * CompletedBadge) and "here's your reward" (this) are never confused.
 * Static: no animation, no flashing — it simply appears when the
 * surrounding text does, like every other icon on this page. */
export function RewardIcon({ className = "" }: { className?: string }) {
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
      <path d="M9 13.5l-2 6.5 5-2.2 5 2.2-2-6.5" />
      <circle cx="12" cy="9" r="5.5" />
      <path d="M12 6.3l1.2 2.4 2.6.4-1.9 1.9.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.9 2.6-.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A smiling face — the "That went great!" reflection choice. Part of a
 * four-icon set (this, OkayFaceIcon, TrickyFaceIcon, NewIdeaIcon) added
 * alongside the existing translated, emoji-prefixed labels so the
 * reflection choices have a real, design-owned visual symbol (the same
 * "shape a design system controls, not a font glyph that renders
 * differently per device" reasoning MissionIcon's own module comment
 * already gives for every other icon here) rather than relying on the
 * emoji inside the text alone. Decorative only — the translated label
 * stays the accessible name, and SelectedCheckIcon (VariantIcon.tsx,
 * already documented as shared with "the variant/reflection toggle
 * buttons") marks which one is picked. */
export function GreatFaceIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M8.3 10.3h.01M15.7 10.3h.01" strokeWidth="2.6" />
      <path d="M7.8 14c1.1 1.7 2.6 2.6 4.2 2.6s3.1-.9 4.2-2.6" />
    </svg>
  );
}

/** A neutral/flat-mouth face — "It was okay". See GreatFaceIcon. */
export function OkayFaceIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M8.3 10.3h.01M15.7 10.3h.01" strokeWidth="2.6" />
      <path d="M8.3 15h7.4" />
    </svg>
  );
}

/** A wavy-mouth, slightly puzzled face — "That was tricky". See
 * GreatFaceIcon. Wavy rather than frowning/sad: "tricky" means
 * challenging, not upsetting, and this app never shows a child a sad
 * face for their own honest answer. */
export function TrickyFaceIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.3" />
      <path d="M8.3 10.3h.01M15.7 10.3h.01" strokeWidth="2.6" />
      <path d="M8.3 15.3c1-.9 2.2-1.3 3.7-1.3s2.7.4 3.7 1.3" />
    </svg>
  );
}

/** A lightbulb — "I have a new idea now". See GreatFaceIcon. Same
 * pictogram concept as the visual pilot's ShareIdeaVisual "Share it!"
 * button (VisualPilotIcons.tsx's `presentIdea`), redrawn here rather
 * than imported so this shared, all-missions page never depends on the
 * pilot-scoped icon module (VisualPilotIcons.tsx's own comment reserves
 * it for the three pilot missions' picker/result widgets). */
export function NewIdeaIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M12 3a6 6 0 00-6 6c0 2.5 1.5 3.8 2.3 4.9.5.7.7 1.3.7 2.1h6c0-.8.2-1.4.7-2.1C16.5 12.8 18 11.5 18 9a6 6 0 00-6-6z" />
      <path d="M9.6 18.2h4.8M10 20.5h4" />
    </svg>
  );
}
