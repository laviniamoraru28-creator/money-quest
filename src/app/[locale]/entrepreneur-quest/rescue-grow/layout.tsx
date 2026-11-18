import type { ReactNode } from "react";
import { BandGate } from "@/components/BandGate";

/**
 * "Rescue & Grow" (business pivot, grow-or-stay-small, business
 * ethics, rescuing a struggling company) is reserved for Strategist
 * (12-14) — see docs/eq-lq-age-band-redesign.md section 7. Gating at
 * the layout level covers every nested route (rescue-grow,
 * rescue-grow/pivot, rescue-grow/grow, rescue-grow/ethics,
 * rescue-grow/business-rescue, rescue-grow/review) from one place.
 */
export default function RescueGrowLayout({ children }: { children: ReactNode }) {
  return (
    <BandGate requiredBand="strategist" hubHref="/entrepreneur-quest" hubLabelKey="entrepreneurQuest.hubTitle">
      {children}
    </BandGate>
  );
}
