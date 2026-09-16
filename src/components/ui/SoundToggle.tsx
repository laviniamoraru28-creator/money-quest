"use client";

import { useTranslations } from "next-intl";
import { useSound } from "@/lib/audio/use-sound";

/**
 * A clearly visible, always-reachable Sound On/Off control — mounted
 * once in the /play layout (src/app/[locale]/play/layout.tsx) so it's
 * present everywhere a sound could play (lessons, games, the
 * Simulator, the World Map), not re-added per page. Renders nothing
 * different while the stored preference is still loading, avoiding a
 * flash from the default (unmuted) state to whatever was actually
 * saved.
 */
export function SoundToggle() {
  const t = useTranslations();
  const { isMuted, isLoaded, toggleMuted } = useSound();

  if (!isLoaded) return null;

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-pressed={!isMuted}
      aria-label={isMuted ? t("play.soundOffLabel") : t("play.soundOnLabel")}
      className="grid h-touch-min-child w-touch-min-child place-items-center rounded-full border border-ink/10 bg-white text-lg shadow-resting hover:bg-fog"
      title={isMuted ? t("play.soundOffLabel") : t("play.soundOnLabel")}
    >
      <span aria-hidden="true">{isMuted ? "🔇" : "🔊"}</span>
    </button>
  );
}
