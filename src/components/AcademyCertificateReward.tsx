"use client";
import { useLocale } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy } from "@/content/certificate-copy";
import { isSupportedLocale } from "@/i18n/config";
import { CERTIFICATE_BANDS, isCertificateEligible } from "@/lib/certificates/eligibility";
import { CertificateDownload } from "@/components/CertificateDownload";
import { Link } from "@/i18n/navigation";

/** Earned levels remain accessible when a family switches to another level. */
export function AcademyCertificateReward() {
  const raw = useLocale();
  const locale = isSupportedLocale(raw) ? raw : "en";
  const copy = certificateCopy[locale];
  const {state,isLoaded} = useLocalProgress();
  if(!isLoaded)return null;
  const earned=CERTIFICATE_BANDS.filter(band=>isCertificateEligible(state.completedActivityIds,band));
  if(!earned.length)return null;
  return <section aria-label={copy.ready} className="mx-auto mt-8 max-w-3xl rounded-2xl border-2 border-amber-600 bg-white p-5 text-center text-slate-900">
    <h2 className="font-display text-2xl font-bold">{copy.congratulations}</h2>
    {earned.map(band=><div key={band} className="mt-4">
      <h3 className="font-bold">Money Quest Academy · {copy[band]}</h3>
      <CertificateDownload band={band} locale={locale} date={state.certificateCompletionDates[band]} />
      <Link className="inline-flex min-h-12 items-center underline" href={`/academy-certificate?level=${band}`}>{copy.view}</Link>
    </div>)}
  </section>;
}
