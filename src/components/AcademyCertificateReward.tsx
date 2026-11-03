"use client";
import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { WORLDS } from "@/content/worlds";
import { getWorldCatalog } from "@/content/catalog";
import { certificateCopy, certificateCompetencies } from "@/content/certificate-copy";
import { REGIONAL_LOCALES, isSupportedLocale } from "@/i18n/config";
import type { AgeBand } from "@/types/database.types";

export function AcademyCertificateReward() {
  const localeRaw = useLocale();
  const locale = isSupportedLocale(localeRaw) ? localeRaw : "en";
  const copy = certificateCopy[locale] as Record<string,string>;
  const t = useTranslations();
  const { state, isLoaded, recordCertificateCompletion } = useLocalProgress();
  const band = state.ageBand as AgeBand | null;
  const required = band ? WORLDS.flatMap(world => getWorldCatalog(world.id, band, t).map(activity => activity.id)) : [];
  const completed = new Set(state.completedActivityIds);
  const eligible = Boolean(band && required.length > 0 && required.every(id => completed.has(id)));
  const date = band ? state.certificateCompletionDates?.[band] : undefined;
  useEffect(() => {
    if (isLoaded && eligible && band && !date) recordCertificateCompletion(band);
  }, [isLoaded, eligible, band, date, recordCertificateCompletion]);
  if (!isLoaded || !band || !eligible || !date) return null;
  const dateText = new Intl.DateTimeFormat(REGIONAL_LOCALES[locale], {day:"numeric",month:"long",year:"numeric"}).format(new Date(date));
  const competencies = certificateCompetencies[band].map(key => copy[key]);
  return (
    <section aria-label={copy.ready} className="mt-8 rounded-2xl border-2 border-amber-600 bg-white p-5 text-center text-slate-900">
      <h2 className="font-display text-2xl font-bold">{copy.ready}</h2>
      <p className="mt-2">Money Quest Academy · {band.toUpperCase()}</p>
      <a className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-6 py-3 font-semibold text-white" href={`/${locale}/academy-certificate?level=${band}`}>
        {copy.download}
      </a>
      <p className="mt-2 text-sm">{copy.date}: {dateText}</p>
      <span className="sr-only">{competencies.join(", ")}</span>
    </section>
  );
}
