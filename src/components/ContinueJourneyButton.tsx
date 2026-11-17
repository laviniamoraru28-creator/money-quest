"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isSupportedLocale } from "@/i18n/config";
import { journeyCopy } from "@/content/journey-copy";
import { getNextEducationalSection } from "@/lib/navigation/next-educational-section";

/**
 * The one place that renders the guided-journey "Continue" button,
 * used by every section along the real nav menu order (see
 * next-educational-section.ts) — never hardcoded, so a future reorder
 * of nav-menu-structure.ts is picked up everywhere automatically.
 *
 * `variant="continue"` (default) is for a section the child just
 * actually finished (a certificate, a quest, a scenario) - earned,
 * not optional. `variant="explore"` is for open-ended sections
 * (reading collections, sandboxes, relaxation) that have no "finish"
 * state: same destination logic, softer copy, and it's always
 * rendered unconditionally by the caller rather than gated on any
 * completion check, since there is nothing to complete.
 *
 * Renders nothing if `currentHref` is the last educational section
 * (there is no "next"), or isn't itself part of the educational
 * journey at all.
 */
export function ContinueJourneyButton({
  currentHref,
  variant = "continue",
  className = "",
}: {
  currentHref: string;
  variant?: "continue" | "explore";
  className?: string;
}) {
  const raw = useLocale();
  const t = useTranslations();
  const locale = isSupportedLocale(raw) ? raw : "en";
  const copy = journeyCopy[locale];
  const next = getNextEducationalSection(currentHref);
  if (!next) return null;

  const sectionLabel = t(`navMenu.${next.labelKey}`);
  const textTemplate = variant === "explore" ? copy.continueExploringTo : copy.continueTo;
  const ariaTemplate = variant === "explore" ? copy.continueExploringToAria : copy.continueToAria;

  return (
    <Link
      href={next.href}
      aria-label={ariaTemplate.replace("{section}", sectionLabel)}
      className={`inline-flex min-h-touch-min w-full max-w-xs items-center justify-center rounded-xl bg-success-text px-5 py-3 text-lg font-bold text-white shadow-resting hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-success-text ${className}`}
    >
      {textTemplate.replace("{section}", sectionLabel)}
    </Link>
  );
}
