import { AcademyCertificateReward } from "@/components/AcademyCertificateReward";
import type { ReactNode } from "react";

/** All pages share the global sticky Money Quest header and its audio control. */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return <>{children}<AcademyCertificateReward /></>;
}
