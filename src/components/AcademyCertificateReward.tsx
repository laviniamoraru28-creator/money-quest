"use client";
import { useLocale, useTranslations } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy } from "@/content/certificate-copy";
import { isSupportedLocale } from "@/i18n/config";
import { CERTIFICATE_BANDS } from "@/lib/certificates/eligibility";
import { isFourQuestCertificateReady } from "@/lib/certificates/three-quest-eligibility";
import { useRecordThreeQuestCompletion } from "@/lib/certificates/use-record-three-quest-completion";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { CertificateDownload } from "@/components/CertificateDownload";
import { Link } from "@/i18n/navigation";

/**
 * Only shows the CURRENTLY selected band's certificate, even if
 * another band was also, separately, genuinely earned - because
 * Entrepreneur Quest's and Leadership Quest's own progress hooks only
 * ever expose the active band's slice (see use-entrepreneur-quest.ts),
 * so there is no reliable way to also check a different band's
 * eligibility from here. A family can still reach an already-earned
 * other band's certificate by switching the global level selector to
 * it. This is a deliberate trade for never letting one band's
 * completion read as another's (Issue #86) - the opposite failure
 * mode would be far worse than a certificate being one click away
 * instead of simultaneously visible.
 */
export function AcademyCertificateReward() {
  const raw = useLocale();
  const t=useTranslations();
  const locale = isSupportedLocale(raw) ? raw : "en";
  const copy = certificateCopy[locale];
  const {state,isLoaded} = useLocalProgress();
  const { state: entrepreneur, isLoaded: entrepreneurLoaded } = useEntrepreneurQuest();
  const { state: leadership, isLoaded: leadershipLoaded } = useLeadershipQuest();
  const loaded = isLoaded && entrepreneurLoaded && leadershipLoaded;
  const band = state.ageBand;
  const ready = loaded && !!band && isFourQuestCertificateReady(state.completedActivityIds,band,entrepreneur,leadership);
  useRecordThreeQuestCompletion(band, ready, loaded);
  if(!loaded || !ready || !band)return null;
  const earned=CERTIFICATE_BANDS.filter(candidate=>candidate===band);
  return <section aria-label={copy.ready} className="mx-auto mt-8 max-w-3xl rounded-2xl border-2 border-amber-600 bg-white p-5 text-center text-slate-900">
    <h2 className="font-display text-2xl font-bold">{copy.congratulations}</h2>
    {earned.map(earnedBand=><div key={earnedBand} className="mt-4">
      <h3 className="font-bold">Money Quest Academy · {copy[earnedBand]}</h3>
      <p className="mt-2">{copy.ready}</p>
      <CertificateDownload band={earnedBand} locale={locale} date={state.threeQuestCertificateDates[earnedBand]} />
      <Link className="inline-flex min-h-12 items-center underline" href={`/academy-certificate?level=${earnedBand}`}>{copy.view}</Link>
    </div>)}
    <Link href="/play" className="mt-4 inline-flex min-h-12 items-center rounded-xl border border-teal px-4 py-2 text-teal-text">{t("nav.backToWorldMap")}</Link>
  </section>;
}
