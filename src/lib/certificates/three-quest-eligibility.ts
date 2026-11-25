import { LQ_MISSIONS } from "@/content/leadership-quest/structures";
import type { AgeBand } from "@/types/database.types";
import type { EntrepreneurQuestState } from "@/lib/entrepreneur-quest/state";
import type { LeadershipQuestState } from "@/lib/leadership-quest/state";
import { isCertificateEligible } from "@/lib/certificates/eligibility";

/** All three journeys are voluntary. A certificate is awarded only after all three. */
export function isThreeQuestCertificateReady(
  completedMoneyQuestIds: readonly string[],
  band: AgeBand,
  entrepreneur: EntrepreneurQuestState,
  leadership: LeadershipQuestState
): boolean {
  return isCertificateEligible(completedMoneyQuestIds, band)
    && entrepreneur.pitchCompleted === true
    && leadership.completedMissionIds.includes("final-challenge");
}


export function requiredAiLessons(band: AgeBand): string[] {
  return Array.from({ length: 5 }, (_, index) => `ai-quest-${band}-lesson-${index + 1}`);
}

export function isFourQuestCertificateReady(
  ids: readonly string[], band: AgeBand, entrepreneur: EntrepreneurQuestState, leadership: LeadershipQuestState
): boolean {
  return isThreeQuestCertificateReady(ids, band, entrepreneur, leadership)
    && LQ_MISSIONS.every(mission => leadership.completedMissionIds.includes(mission.id))
    && requiredAiLessons(band).every(id => ids.includes(id));
}
