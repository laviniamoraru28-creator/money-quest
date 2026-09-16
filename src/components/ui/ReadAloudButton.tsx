"use client";

import { useTranslations } from "next-intl";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";

/**
 * A small, optional button next to a block of text — never required
 * to understand the activity, since the text is always fully visible
 * on screen regardless (see use-read-aloud.ts's own doc comment).
 * Renders nothing at all when the browser has no speech support,
 * rather than a disabled/broken-looking button — an unsupported
 * feature should simply not appear, not appear and fail.
 *
 * Shows real visible text ("Listen to the lesson" / "Stop"), not just
 * an icon with a hidden aria-label — the redesign brief specifically
 * asked for child-friendly *visible* wording here, and an icon-only
 * speaker button doesn't give a child who can't yet reliably parse
 * icons any way to know what it does.
 */
export function ReadAloudButton({ text, uiLocale }: { text: string; uiLocale: string }) {
  const t = useTranslations();
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(uiLocale);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={() => (isSpeaking ? stop() : speak(text))}
      aria-label={isSpeaking ? t("a11y.stopReadingLabel") : t("a11y.listenToLessonLabel")}
      title={isSpeaking ? t("a11y.stopReadingLabel") : t("a11y.listenToLessonLabel")}
      className="inline-flex h-touch-min shrink-0 items-center gap-3xs rounded-full border border-teal/30 bg-teal/10 px-2xs text-sm font-medium text-teal hover:bg-teal/20"
    >
      <span aria-hidden="true">{isSpeaking ? "⏸️" : "🔊"}</span>
      <span>{isSpeaking ? t("a11y.stopReadingLabel") : t("a11y.listenToLessonLabel")}</span>
    </button>
  );
}
