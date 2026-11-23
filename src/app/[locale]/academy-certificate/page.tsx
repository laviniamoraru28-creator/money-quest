"use client";
import { Suspense, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy, certificateCompetencies } from "@/content/certificate-copy";
import { isSupportedLocale } from "@/i18n/config";
import { CERTIFICATE_BANDS } from "@/lib/certificates/eligibility";
import { isThreeQuestCertificateReady } from "@/lib/certificates/three-quest-eligibility";
import { useRecordThreeQuestCompletion } from "@/lib/certificates/use-record-three-quest-completion";
import { useEntrepreneurQuest } from "@/lib/entrepreneur-quest/use-entrepreneur-quest";
import { useLeadershipQuest } from "@/lib/leadership-quest/use-leadership-quest";
import { CertificateDownload } from "@/components/CertificateDownload";
import { Link } from "@/i18n/navigation";

export default function AcademyCertificatePage() {return <Suspense><CertificateContent /></Suspense>;}
function CertificateContent() {
  const params=useSearchParams();
  const band=CERTIFICATE_BANDS.find(item=>item===params.get("level"));
  const raw=useLocale(), locale=isSupportedLocale(raw)?raw:"en";
  const t=useTranslations(), copy=certificateCopy[locale];
  const {state,isLoaded}=useLocalProgress();
  const { state: entrepreneur, isLoaded: entrepreneurLoaded } = useEntrepreneurQuest();
  const { state: leadership, isLoaded: leadershipLoaded } = useLeadershipQuest();
  const [preview,setPreview]=useState<string>();
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  // entrepreneur/leadership are already scoped to state.ageBand (the only
  // band either hook can return a slice for) - requiring the URL's own
  // ?level= to match it is what stops a direct link to another band's
  // certificate from ever reading as eligible, per Issue #86 point 4.
  const loaded=isLoaded&&entrepreneurLoaded&&leadershipLoaded;
  const sameBand=!!band&&band===state.ageBand;
  const eligible=loaded&&sameBand&&isThreeQuestCertificateReady(state.completedActivityIds,band,entrepreneur,leadership)
    && (state.certificateQuestCount === 3 || !!state.threeQuestCertificateDates[band] || state.completedActivityIds.includes(`ai-quest-${band}`));
  useRecordThreeQuestCompletion(sameBand?band!:null, eligible, loaded);
  return <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen max-w-6xl p-4 text-center">
    <h1 className="text-2xl font-bold">{copy.title}</h1>
    {!isLoaded?<p>{t("common.loading")}</p>:!band||!eligible?<p className="mt-4">{copy.locked}</p>:<>
      <p className="mt-4">{copy.congratulations} {copy.level}: {copy[band]}</p>
      {!state.threeQuestCertificateDates[band]&&<p className="mx-auto mt-2 max-w-2xl text-sm">{copy.dateUnknown}</p>}
      <CertificateDownload band={band} locale={locale} date={state.threeQuestCertificateDates[band]} onPrepared={setPreview} />
      {preview&&<iframe src={preview} title={`${copy.title}: ${copy[band]}`} className="mt-4 h-[65vh] w-full rounded-lg border" />}
      <ul className="mx-auto mt-4 max-w-xl text-sm">{certificateCompetencies[band].map(key=><li key={key}>{copy[key]}</li>)}</ul>
    </>}
    <Link href="/play" className="mt-4 inline-flex min-h-12 items-center underline">{copy.back}</Link>
  </main>;
}
