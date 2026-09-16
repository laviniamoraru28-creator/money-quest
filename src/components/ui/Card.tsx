import type { HTMLAttributes } from "react";

type CardVariant = "data" | "activity" | "place" | "reward";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

// Maps to money-quest-design-system.md Section 7.7 — radius and elevation
// differ by variant deliberately (Principle 3: shape encodes meaning),
// not a single card style reused everywhere.
//
// bg-cream (not bg-white) on every variant — part of the "interactive
// children's book" redesign: cards read as warm paper-like page
// surfaces sitting on top of the new sage `fog` background
// (tailwind.config.ts), not stark white cutouts. Changed once here
// rather than at each of the ~14 individual call sites across the app
// that use this component, so the surface color stays a single source
// of truth the same way `fog` is for the page background.
const VARIANT_CLASSES: Record<CardVariant, string> = {
  data: "rounded-md border border-ink/10 bg-cream",
  activity: "rounded-md border border-ink/10 bg-cream",
  place: "rounded-xl shadow-resting bg-cream",
  reward: "rounded-lg shadow-floating bg-cream",
};

export function Card({ variant = "data", className = "", children, ...props }: CardProps) {
  return (
    <div className={["p-md", VARIANT_CLASSES[variant], className].join(" ")} {...props}>
      {children}
    </div>
  );
}
