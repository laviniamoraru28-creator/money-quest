"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * The Company Dashboard's progressive-disclosure toggle (brief section
 * 25: "do not overwhelm the child ... use progressive disclosure").
 * A plain show/hide with no animation, so the app's reduced-motion
 * setting needs no special handling here.
 */
export function DashboardExpander({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="min-h-touch-min text-sm font-medium text-teal underline-offset-2 hover:underline"
      >
        {expanded ? t("entrepreneurQuest.dashboard.showLessButton") : t("entrepreneurQuest.dashboard.showMoreButton")}
      </button>
      {expanded && <div className="mt-sm">{children}</div>}
    </div>
  );
}
