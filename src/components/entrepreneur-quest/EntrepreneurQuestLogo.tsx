import type { ReactNode } from "react";
import type { BusinessLogo } from "@/lib/entrepreneur-quest/state";

/**
 * A lightweight, entirely inline SVG logo — no image files, no design
 * service, no heavy graphics library (per the brief's explicit "do not
 * introduce Canva or an external design service" / "do not add a
 * heavy graphics editor" requirements). A background shape, filled
 * with one of the app's existing brand colors, plus one centered
 * emoji symbol. Reused, unchanged, everywhere a child's logo appears:
 * the logo-builder stage itself, the Company Dashboard, and the final
 * pitch card — so what a child designs is exactly what they see
 * reflected back throughout the rest of the journey.
 */
const SHAPE_ELEMENT: Record<string, (fillClassName: string) => ReactNode> = {
  circle: (fillClassName) => <circle cx="50" cy="50" r="45" className={fillClassName} />,
  square: (fillClassName) => <rect x="8" y="8" width="84" height="84" rx="16" className={fillClassName} />,
  hexagon: (fillClassName) => <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" className={fillClassName} />,
  star: (fillClassName) => <polygon points="50,5 61,38 96,38 68,59 79,92 50,72 21,92 32,59 4,38 39,38" className={fillClassName} />,
};

const COLOR_FILL_CLASS: Record<string, string> = {
  teal: "fill-teal",
  coral: "fill-coral",
  gold: "fill-gold",
  "soft-blue": "fill-soft-blue",
};

export function EntrepreneurQuestLogo({ logo, size = 96 }: { logo: BusinessLogo; size?: number }) {
  const fillClassName = COLOR_FILL_CLASS[logo.colorKey] ?? "fill-teal";
  const shapeRenderer = SHAPE_ELEMENT[logo.shape] ?? SHAPE_ELEMENT.circle!;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-hidden="true">
      {shapeRenderer(fillClassName)}
      <text x="50" y="58" textAnchor="middle" fontSize="34" dominantBaseline="middle">
        {logo.symbol}
      </text>
    </svg>
  );
}
