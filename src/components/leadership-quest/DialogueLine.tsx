"use client";

import { useTranslations } from "next-intl";
import type { LQCharacterId } from "@/content/leadership-quest/structures";

/** Purely decorative per-character emoji — never load-bearing (the
 * character's name, always shown as text right next to it, is what
 * actually identifies who's speaking). */
const CHARACTER_EMOJI: Record<LQCharacterId, string> = {
  nadia: "💡",
  oren: "🔧",
  priya: "🎤",
  theo: "📋",
};

/**
 * One line of character dialogue (brief section 7: "use dialogue
 * extensively... keep dialogue short and natural"). `text` is already
 * the fully-translated line (callers pass
 * `t("leadershipQuest.missions.<id>.dialogue.<lineId>")`); this
 * component only adds the speaker's name and a small avatar emoji.
 */
export function DialogueLine({ characterId, text }: { characterId: LQCharacterId; text: string }) {
  const t = useTranslations();
  return (
    <div className="flex items-start gap-2xs rounded-md bg-fog p-2xs">
      <span aria-hidden="true" className="text-lg leading-none">
        {CHARACTER_EMOJI[characterId]}
      </span>
      <p className="text-sm text-ink/80">
        <span className="font-semibold text-ink">{t(`leadershipQuest.characters.${characterId}.name`)}: </span>
        {text}
      </p>
    </div>
  );
}
