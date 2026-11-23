import { AcademyCertificateReward } from "@/components/AcademyCertificateReward";
import { JourneyContinuePrompt } from "@/components/JourneyContinuePrompt";
import type { ReactNode } from "react";

/** All pages share the global sticky Money Quest header and its audio control.
 * JourneyContinuePrompt and AcademyCertificateReward are mutually exclusive
 * by construction (one shows before all three quests are done, the other
 * only once they are) - never both at once. */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return <div className="mq-cinematic mq-learning" data-quest="money">{children}<JourneyContinuePrompt /><AcademyCertificateReward /></div>;
}
