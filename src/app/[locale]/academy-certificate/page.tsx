"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useLocalProgress } from "@/lib/local-progress/use-local-progress";
import { certificateCopy, certificateCompetencies } from "@/content/certificate-copy";
import { isSupportedLocale, REGIONAL_LOCALES } from "@/i18n/config";
import { WORLDS } from "@/content/worlds";
import { getWorldCatalog } from "@/content/catalog";
import type { AgeBand } from "@/types/database.types";

const BANDS = ["explorer","builder","strategist"] as const;
export default function AcademyCertificatePage() {
  const query = useSearchParams();
  const raw = query.get("level");
  const band: AgeBand | null = BANDS.find(b => b === raw) ?? null;
  const rawLocale = useLocale();
  const locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const copy = certificateCopy[locale] as Record<string,string>;
  const t = useTranslations();
  const { state, isLoaded, recordCertificateCompletion } = useLocalProgress();
  const [printing, setPrinting] = useState(false);
  const required = band ? WORLDS.flatMap(world => getWorldCatalog(world.id, band, t).map(entry => entry.id)) : [];
  const complete = Boolean(band && required.length && required.every(id => state.completedActivityIds.includes(id)));
  const date = band ? state.certificateCompletionDates?.[band] : undefined;
  useEffect(() => {
    if (isLoaded && band && complete && !date) recordCertificateCompletion(band);
  }, [isLoaded, band, complete, date, recordCertificateCompletion]);
  if (!isLoaded) return <main className="p-8">Loading…</main>;
  if (!band || !complete || !date) return <main className="p-8">Certificate unavailable until all activities in this level are completed.</main>;
  const dateText = new Intl.DateTimeFormat(REGIONAL_LOCALES[locale],{day:"numeric",month:"long",year:"numeric"}).format(new Date(date));
  const badges = certificateCompetencies[band].map(key => copy[key]);
  return <main className="min-h-screen bg-slate-100 p-4 text-center">
    <style>{`@page { size: A4 landscape; margin: 0; } @media print { body { margin: 0; } .no-print { display: none !important; } .certificate-sheet { width: 297mm !important; height: 210mm !important; box-shadow: none !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`}</style>
    <div className="no-print mx-auto mb-4 max-w-3xl">
      <button type="button" disabled={printing} onClick={() => {setPrinting(true);window.print();setPrinting(false);}} className="rounded-lg bg-teal px-6 py-3 font-bold text-white">{copy.download}</button>
      <p className="mt-2 text-sm">Choose “Save as PDF” in your browser’s print dialog. A4 landscape.</p>
    </div>
    <article className="certificate-sheet relative mx-auto flex aspect-[297/210] w-full max-w-[1122px] flex-col overflow-hidden border-[12px] border-[#0c2244] bg-[#fff9e9] p-[3%] text-[#0c2244] shadow-xl" style={{fontFamily:"Georgia, 'Times New Roman', serif"}}>
      <div className="pointer-events-none absolute inset-2 border-[3px] border-[#bd913e]" />
      <div className="pointer-events-none absolute inset-5 border border-[#bd913e]" />
      <div className="relative flex h-full flex-col items-center justify-between">
        <div>
          <p className="text-4xl text-[#b48b35]">❧ ⚜ ❧</p>
          <h1 className="mt-1 text-4xl font-bold tracking-wide">MONEY QUEST ACADEMY</h1>
          <p className="mt-1 text-sm text-[#836b3f]">An Educational Programme by Money Quest Education</p>
          <h2 className="mt-4 text-3xl font-bold uppercase">{copy.title}</h2>
          <p className="mt-3 rounded bg-[#0c2244] px-8 py-2 text-xl font-bold uppercase tracking-wide text-[#f5d999]">{band} · {copy.level}</p>
        </div>
        <div className="w-[78%] flex-1 py-6">
          <div className="h-[50%] rounded-md border-2 border-[#c3a260] bg-white/40" aria-label="Blank space for handwritten name" />
          <p className="mt-4 text-base italic">{copy.message}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          {badges.map((label,i)=><div key={i} className="rounded-full border-2 border-[#bb9343] bg-[#f4e9c9] px-2 py-2 text-xs font-semibold">{label}</div>)}
        </div>
        <div className="mt-4 flex w-full items-end justify-between px-6 text-sm">
          <div><div className="font-bold">{dateText}</div><div className="border-t border-[#0c2244] pt-1">{copy.date}</div></div>
          <div className="rounded-full border-4 border-double border-[#b48b35] bg-[#0c2244] px-6 py-4 font-bold text-[#e5c778]">MQA</div>
          <div><div className="text-2xl italic" style={{fontFamily:"cursive"}}>Money Quest</div><div className="border-t border-[#0c2244] pt-1">{copy.signature}</div></div>
        </div>
      </div>
    </article>
  </main>;
}
