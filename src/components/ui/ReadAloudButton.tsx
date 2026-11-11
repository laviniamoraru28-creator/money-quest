"use client";

import {ActionIcon} from "./ActionIcon";
import {useEffect} from "react";
import { useTranslations } from "next-intl";
import { useReadAloud } from "@/lib/accessibility/use-read-aloud";

export function ReadAloudControl({
  label, onClick, className, accessibleLabel, title,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  accessibleLabel?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={accessibleLabel}
      title={title}
      className={`inline-flex h-touch-min shrink-0 items-center gap-3xs rounded-full border border-teal/30 bg-white px-2xs text-sm font-medium text-teal-text hover:bg-cream ${className ?? ""}`}
    >
      <ActionIcon name="sound"/>
      <span>{label}</span>
    </button>
  );
}

/**
 * A small, optional button next to a block of text — never required
 * to understand the activity, since the text is always fully visible
 * on screen regardless (see use-read-aloud.ts's own doc comment).
 * Renders nothing at all when the browser has no speech support,
 * rather than a disabled/broken-looking button — an unsupported
 * feature should simply not appear, not appear and fail.
 *
 * Shows real visible text ("Listen" / "Stop"), not just
 * an icon with a hidden aria-label — the redesign brief specifically
 * asked for child-friendly *visible* wording here, and an icon-only
 * speaker button doesn't give a child who can't yet reliably parse
 * icons any way to know what it does.
 */
export function ReadAloudButton({ text, uiLocale }: { text: string; uiLocale: string }) {
  const t = useTranslations();
  const { isSupported, isSpeaking, speak, stop } = useReadAloud(uiLocale);

  useEffect(() => { stop(); }, [text, stop]);
  if (!isSupported) return null;

  const label = isSpeaking ? t("a11y.stopReadingLabel") : t("a11y.listenToLessonLabel");
  return <ReadAloudControl label={label} accessibleLabel={label} title={label} onClick={() => (isSpeaking ? stop() : speak(text))} />;
}
