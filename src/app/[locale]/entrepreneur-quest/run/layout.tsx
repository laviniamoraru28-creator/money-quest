import type { ReactNode } from "react";
import { BandGate } from "@/components/BandGate";

/**
 * "Run Your Business" (pricing experiments, suppliers & stock, cash
 * flow, the Business Problems library) is reserved for Strategist
 * (12-14) — see docs/eq-lq-age-band-redesign.md section 7. Gating at
 * the layout level covers every nested route (run, run/pricing-
 * experiment, run/supplier-and-stock, run/cash-flow, run/problems,
 * run/problems/[problemId]) from one place.
 */
export default function RunLayout({ children }: { children: ReactNode }) {
  return (
    <BandGate requiredBand="strategist" hubHref="/entrepreneur-quest" hubLabelKey="entrepreneurQuest.hubTitle">
      {children}
    </BandGate>
  );
}
