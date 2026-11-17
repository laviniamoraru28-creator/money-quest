import {Link} from "@/i18n/navigation";
import {formatLocalizedText} from "@/lib/i18n/format-text";
import {librarySourceDate} from "@/content/reader-copy";
import {PARENT_GUIDE_SOURCES,PARENT_GUIDE_CHECKED,type ParentGuideCopy} from "@/content/parent-guide-copy";
import {certificateCopy} from "@/content/certificate-copy";
import type {WorksheetBand} from "@/content/worksheets";
import type {Locale} from "@/i18n/config";

const BAND_AGE_RANGE:Record<WorksheetBand,string>={explorer:"6–8",builder:"9–11",strategist:"12–14"};
const BAND_ORDER:WorksheetBand[]=["explorer","builder","strategist"];
const BAND_ZIP:Record<WorksheetBand,string>={explorer:"explorer-worksheets.zip",builder:"builder-worksheets.zip",strategist:"strategist-worksheets.zip"};
const BAND_DOWNLOAD_COPY_KEY:Record<WorksheetBand,"downloadExplorerWorksheets"|"downloadBuilderWorksheets"|"downloadStrategistWorksheets"> = {
 explorer:"downloadExplorerWorksheets",builder:"downloadBuilderWorksheets",strategist:"downloadStrategistWorksheets"
};

export interface WorksheetDisplayEntry{lessonId:string;filename:string;band:WorksheetBand;title:string}

export function ParentResourceGuide({locale,copy,worksheets}:{locale:Locale;copy:ParentGuideCopy;worksheets:WorksheetDisplayEntry[]}){
 const bandNames=certificateCopy[locale];
 return <div className="min-h-screen bg-fog text-ink"><main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-9"><Link href="/" className="inline-block min-h-12 py-3 font-semibold text-teal-text underline">{copy.home}</Link><p className="mt-5 font-bold text-teal-text">{copy.eyebrow}</p><h1 className="mt-3 text-3xl">{copy.title}</h1><p className="mt-5 text-lg leading-relaxed">{copy.intro}</p>
 <section className="mt-8 rounded-3xl border border-ink/15 bg-white p-6"><h2 className="text-2xl">{copy.startHeading}</h2><ol className="mt-4 list-decimal space-y-3 pl-6">{[copy.step1,copy.step2,copy.step3,copy.step4,copy.step5].map(text=><li key={text}>{text}</li>)}</ol></section>
 <section className="mt-8"><h2 className="text-2xl">{copy.levelsHeading}</h2><p className="mt-3 leading-relaxed">{copy.levelsBody}</p><p className="mt-3 leading-relaxed">{copy.sendBody}</p></section>

 <section className="mt-8 rounded-3xl border border-teal/25 bg-white p-6">
  <h2 className="text-2xl">{copy.printablesHeading}</h2>
  <p className="mt-3 leading-relaxed">{copy.printablesIntro}</p>
  <div className="mt-5 flex flex-wrap gap-3">
   <a href={`/worksheets/${locale}/all-worksheets.zip`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-5 py-3 text-center font-bold text-white">{copy.downloadAllWorksheets}</a>
   {BAND_ORDER.map(band=><a key={band} href={`/worksheets/${locale}/${BAND_ZIP[band]}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-teal px-5 py-3 text-center font-semibold text-teal-text">{copy[BAND_DOWNLOAD_COPY_KEY[band]]}</a>)}
  </div>
  {BAND_ORDER.map(band=>{
   const entries=worksheets.filter(entry=>entry.band===band);
   if(!entries.length)return null;
   return <div key={band} className="mt-6">
    <h3 className="text-xl font-bold text-teal-text">{bandNames[band]} <span className="font-normal text-ink/70">· {BAND_AGE_RANGE[band]}</span></h3>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
     {entries.map(entry=><li key={entry.lessonId} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-fog px-4 py-3">
      <span className="min-w-0 flex-1 break-words">{formatLocalizedText(copy.worksheetLessonLabel,locale,{title:entry.title})}</span>
      <a href={`/worksheets/${locale}/${entry.filename}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-touch-min flex-shrink-0 items-center justify-center rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white">{copy.downloadPdf}</a>
     </li>)}
    </ul>
   </div>;
  })}
 </section>

 <section className="mt-8"><h2 className="text-2xl">{copy.evidenceHeading}</h2><p className="mt-3">{copy.evidenceBody}</p><ul className="mt-4 list-disc space-y-4 pl-5">{PARENT_GUIDE_SOURCES.map(source=><li key={source.id}><a href={source.url} rel="noreferrer" className="text-teal-text underline">{source.title}</a>. {copy[source.id]}</li>)}</ul><p className="mt-5 text-sm">{formatLocalizedText(copy.sourceNote,locale,{date:librarySourceDate(locale,PARENT_GUIDE_CHECKED)})}</p></section>
 <section className="mt-8"><h2 className="text-2xl">{copy.freeHeading}</h2><p className="mt-3">{copy.freeBody}</p><div className="mt-4 flex flex-wrap gap-5"><Link href="/library" className="min-h-12 py-3 font-semibold text-teal-text underline">{copy.library}</Link><Link href="/play" className="min-h-12 py-3 font-semibold text-teal-text underline">{copy.worlds}</Link><Link href="/parent-info" className="min-h-12 py-3 font-semibold text-teal-text underline">{copy.privacy}</Link></div></section>
 </main></div>;
}
