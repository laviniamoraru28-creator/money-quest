import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * The ONLY place "AI" content appears anywhere in this app — always
 * pre-written/scripted text, never a live model call (see brief
 * section 15: "Do NOT create an actual AI chatbot ... Do NOT send
 * children's data to external AI services"). The visible
 * "Simulated AI Assistant (not real AI)" label is load-bearing, not
 * decorative: a child should never mistake this for a real AI tool.
 */
export function SimulatedAiMessage({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <div className="mt-2xs flex items-start gap-xs rounded-lg border-2 border-soft-blue/30 bg-soft-blue/5 p-sm">
      <span aria-hidden="true" className="text-xl">
        🤖
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("entrepreneurQuest.aiLab.simulatedAiLabel")}</p>
        <p className="mt-3xs text-base text-ink/80">{children}</p>
      </div>
    </div>
  );
}
