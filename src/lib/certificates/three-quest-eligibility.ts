import {safeAIMissionIds} from "@/lib/ai-quest/progress";
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

/** The final website certificate additionally requires all five AI Quest missions
 * in the same age band. Keep the legacy three-quest check for existing callers. */
export function isFinalAIQuestCertificateReady(
  completedMoneyQuestIds: readonly string[],
  band: AgeBand,
  entrepreneur: EntrepreneurQuestState,
  leadership: LeadershipQuestState,
  completedAIMissions: readonly number[]
): boolean {
  const missions = safeAIMissionIds(completedAIMissions);
  return isThreeQuestCertificateReady(completedMoneyQuestIds, band, entrepreneur, leadership)
    && missions.length === 5;
}
