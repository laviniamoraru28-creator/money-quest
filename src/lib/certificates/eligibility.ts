import { LESSON_STRUCTURES } from "@/content/curriculum/structures";
import { GAME_STRUCTURES } from "@/game-engine/structures";
import type { AgeBand } from "@/types/database.types";

export const CERTIFICATE_BANDS = ["explorer", "builder", "strategist"] as const;
/** The same canonical lessons and game variants used by getWorldCatalog.
 * Optional labs and open-ended discovery spaces have no required completion gate. */
export function requiredCertificateActivities(band: AgeBand): string[] {
  return [
    ...LESSON_STRUCTURES.filter(item => item.ageBand === band).map(item => item.id),
    ...GAME_STRUCTURES.filter(item => item.variants.some(variant => variant.ageBand === band)).map(item => `game-${band}-${item.key}`),
  ];
}
export function isCertificateEligible(completedIds: readonly string[], band: AgeBand): boolean {
  const required = requiredCertificateActivities(band);
  const completed = new Set(completedIds);
  return required.length > 0 && required.every(id => completed.has(id));
}
/** Persist the local calendar day together with its exact timestamp and UTC offset. */
export function completionTimestamp(now: Date): string {
  const offset = -now.getTimezoneOffset();
  const local = new Date(now.getTime() + offset * 60000).toISOString().slice(0, -1);
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local}${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
}
