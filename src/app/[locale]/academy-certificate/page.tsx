"use client";
import { Suspense, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy, certificateCompetencies } from "@/content/certificate-copy";
import { isSupportedLocale } from "@/i18n/config";
import { CERTIFICATE_BANDS, isCertificateEligible } from "@/lib/certificates/eligibility";
import { CertificateDownload } from "@/components/CertificateDownload";
import { Link } from "@/i18n/navigation";

export default function AcademyCertificatePage() {return <Suspense><CertificateContent /></Suspense>;}
function CertificateContent() {
  const params=useSearchParams();
  const band=CERTIFICATE_BANDS.find(item=>item===params.get("level"));
  const raw=useLocale(), locale=isSupportedLocale(raw)?raw:"en";
  const t=useTranslations(), copy=certificateCopy[locale];
  const {state,isLoaded}=useLocalProgress();
  const [preview,setPreview]=useState<string>();
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  const eligible=band&&isCertificateEligible(state.completedActivityIds,band);
  return <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen max-w-6xl p-4 text-center">
    <h1 className="text-2xl font-bold">{copy.title}</h1>
    {!isLoaded?<p>{t("common.loading")}</p>:!band||!eligible?<p className="mt-4">{copy.locked}</p>:<>
      <p className="mt-4">{copy.congratulations} {copy.level}: {copy[band]}</p>
      {!state.certificateCompletionDates[band]&&<p className="mx-auto mt-2 max-w-2xl text-sm">{copy.dateUnknown}</p>}
      <CertificateDownload band={band} locale={locale} date={state.certificateCompletionDates[band]} onPrepared={setPreview} />
      {preview&&<iframe src={preview} title={`${copy.title}: ${copy[band]}`} className="mt-4 h-[65vh] w-full rounded-lg border" />}
      <ul className="mx-auto mt-4 max-w-xl text-sm">{certificateCompetencies[band].map(key=><li key={key}>{copy[key]}</li>)}</ul>
    </>}
    <Link href="/play" className="mt-4 inline-flex min-h-12 items-center underline">{copy.back}</Link>
  </main>;
}
