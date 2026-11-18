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
