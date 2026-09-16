"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAccessibilityPrefs } from "@/lib/accessibility/use-accessibility-preferences";

/**
 * A small popover with two toggles — Reduced Motion and Focus Mode —
 * mounted once in the /play layout alongside SoundToggle, same
 * "persistently reachable, not buried" placement rationale. A popover
 * rather than two separate always-visible buttons: two more icons
 * permanently in the corner would compete for space with SoundToggle
 * and start to clutter the exact "keep it simple" screen real estate
 * this feature is meant to protect.
 */
export function AccessibilityMenu() {
  const t = useTranslations();
  const { reducedMotion, focusMode, isLoaded, toggleReducedMotion, toggleFocusMode } = useAccessibilityPrefs();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={t("a11y.accessibilityMenuLabel")}
        title={t("a11y.accessibilityMenuLabel")}
        className="grid h-touch-min-child w-touch-min-child place-items-center rounded-full border border-ink/10 bg-white text-lg shadow-resting hover:bg-fog"
      >
        <span aria-hidden="true">⚙️</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2xs w-64 rounded-lg border border-ink/10 bg-white p-sm shadow-floating">
          <label className="flex min-h-touch-min-child items-center justify-between gap-sm">
            <span className="text-sm">{t("a11y.reducedMotionLabel")}</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
              className="h-6 w-6"
              aria-label={t("a11y.reducedMotionLabel")}
            />
          </label>
          <label className="mt-2xs flex min-h-touch-min-child items-center justify-between gap-sm">
            <span className="text-sm">{t("a11y.focusModeLabel")}</span>
            <input
              type="checkbox"
              checked={focusMode}
              onChange={toggleFocusMode}
              className="h-6 w-6"
              aria-label={t("a11y.focusModeLabel")}
            />
          </label>
          <p className="mt-2xs text-xs text-ink/50">{t("a11y.focusModeHint")}</p>
        </div>
      )}
    </div>
  );
}
