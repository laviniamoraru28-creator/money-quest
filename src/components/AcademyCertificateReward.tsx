"use client";
import { useLocale, useTranslations } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy } from "@/content/certificate-copy";
import { isSupportedLocale } from "@/i18n/config";
import { CERTIFICATE_BANDS, isCertificateEligible } from "@/lib/certificates/eligibility";
import { CertificateDownload } from "@/components/CertificateDownload";
import { Link } from "@/i18n/navigation";
import { getNextEducationalSection } from "@/lib/navigation/next-educational-section";

// Money Quest itself ("/play") is where every band's curriculum lives, so
// the next step after earning a certificate for it is whatever immediately
// follows "/play" in the real nav menu order (see nav-menu-structure.ts) —
// never a hardcoded guess, so a future reorder of that menu is picked up
// here automatically too.
const nextAfterMoneyQuest = getNextEducationalSection("/play");

/** Earned levels remain accessible when a family switches to another level. */
export function AcademyCertificateReward() {
  const raw = useLocale();
  const t=useTranslations();
  const locale = isSupportedLocale(raw) ? raw : "en";
  const copy = certificateCopy[locale];
  const {state,isLoaded} = useLocalProgress();
  if(!isLoaded)return null;
  const earned=CERTIFICATE_BANDS.filter(band=>isCertificateEligible(state.completedActivityIds,band));
  if(!earned.length)return null;
  const nextSectionLabel = nextAfterMoneyQuest ? t(`navMenu.${nextAfterMoneyQuest.labelKey}`) : null;
  return <section aria-label={copy.ready} className="mx-auto mt-8 max-w-3xl rounded-2xl border-2 border-amber-600 bg-white p-5 text-center text-slate-900">
    <h2 className="font-display text-2xl font-bold">{copy.congratulations}</h2>
    {earned.map(band=><div key={band} className="mt-4">
      <h3 className="font-bold">Money Quest Academy · {copy[band]}</h3>
      <p className="mt-2">{copy.ready}</p>
      <CertificateDownload band={band} locale={locale} date={state.certificateCompletionDates[band]} />
      <Link className="inline-flex min-h-12 items-center underline" href={`/academy-certificate?level=${band}`}>{copy.view}</Link>
      {/* Completing the certificate download/view above is never required
          before this appears — local progress (and thus `earned`) is
          already saved the moment the band's last activity completed, so
          this renders alongside the download link, not after it. */}
      {nextAfterMoneyQuest && nextSectionLabel && (
        <Link
          href={nextAfterMoneyQuest.href}
          aria-label={copy.continueToNextSectionAria.replace("{section}", nextSectionLabel)}
          className="mt-4 inline-flex min-h-touch-min w-full max-w-xs items-center justify-center rounded-xl bg-success-text px-5 py-3 text-lg font-bold text-white shadow-resting hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-success-text"
        >
          {copy.continueToNextSection.replace("{section}", nextSectionLabel)}
        </Link>
      )}
    </div>)}
    <Link href="/play" className="mt-4 inline-flex min-h-12 items-center rounded-xl border border-teal px-4 py-2 text-teal-text">{t("nav.backToWorldMap")}</Link>
  </section>;
}
