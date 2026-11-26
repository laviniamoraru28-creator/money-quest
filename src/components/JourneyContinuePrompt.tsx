"use client";
import { useLocale } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { LQ_MISSIONS } from "@/content/leadership-quest/structures";
import { isEntrepreneurCurriculumComplete, requiredAiLessons } from "@/lib/certificates/three-quest-eligibility";
import { isCertificateEligible } from "@/lib/certificates/eligibility";
import { journeyContinueCopy } from "@/content/certificate-journey-copy";
import { isSupportedLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

/**
 * The visible nudge for the Money Quest -> Entrepreneur Quest ->
 * Leadership Quest -> AI Quest -> certificate order (Issue #86 point 6). Never a
 * forced redirect - every quest stays voluntary and revisitable; this
 * only ever offers the next step for the family's own selected band,
 * and disappears on its own once that step is no longer next (either
 * it's done, or no band is selected yet).
 */
export function JourneyContinuePrompt() {
  const raw = useLocale();
  const locale = isSupportedLocale(raw) ? raw : "en";
  const copy = journeyContinueCopy[locale];
  const { state, isLoaded } = useLocalProgress();
  const { state: entrepreneur, isLoaded: entrepreneurLoaded } = useEntrepreneurQuest();
  const { state: leadership, isLoaded: leadershipLoaded } = useLeadershipQuest();
  if (!isLoaded || !entrepreneurLoaded || !leadershipLoaded) return null;
  const band = state.ageBand;
  if (!band || !isCertificateEligible(state.completedActivityIds, band)) return null;

  const next = !isEntrepreneurCurriculumComplete(entrepreneur)
    ? { href: "/entrepreneur-quest" as const, label: copy.toEntrepreneurQuest }
    : !LQ_MISSIONS.every(mission => leadership.completedMissionIds.includes(mission.id))
    ? { href: "/leadership-quest" as const, label: copy.toLeadershipQuest }
    : !requiredAiLessons(band).every(id => state.completedActivityIds.includes(id))
    ? {href:"/ai-quest",label:"AI Quest"}
    : null;
  if (!next) return null;

  return (
    <section aria-label={copy.heading} className="mx-auto mt-8 max-w-3xl rounded-2xl border-2 border-teal bg-white p-5 text-center text-slate-900">
      <h2 className="font-display text-xl font-bold">{copy.heading}</h2>
      <Link href={next.href} className="mt-3 inline-flex min-h-12 items-center rounded-xl border border-teal px-4 py-2 text-teal-text underline">
        {next.label}
      </Link>
    </section>
  );
}
