import type {Lab} from "@/content/learning-labs";
import {labAgeVariants} from "@/content/lab-age-variants";
import {ACTIVE_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import translations from "@/content/translations/laboratories.ro.json";
import manifest from "@/content/translations/laboratories.sources.json";
import {draftTranslatedLaboratory} from "./content-translations";

import labsES from "@/content/translations/laboratories.es.json";
import labsFR from "@/content/translations/laboratories.fr.json";
import labsDE from "@/content/translations/laboratories.de.json";
import labsIT from "@/content/translations/laboratories.it.json";
import labsPT from "@/content/translations/laboratories.pt.json";
import labsNL from "@/content/translations/laboratories.nl.json";
import labsPL from "@/content/translations/laboratories.pl.json";
const drafts:Partial<Record<Locale,Record<string,unknown>>>={ro:translations,es:labsES,fr:labsFR,de:labsDE,it:labsIT,pt:labsPT,nl:labsNL,pl:labsPL};

export type LaboratoryPresentation = {
  lab:Lab;
  locale?:"en";
  variants?:typeof labAgeVariants;
}|{lab:Lab;locale:Exclude<Locale,"en">;variants:typeof labAgeVariants};

/** Explicit draft assembly, also used by editorial rendering checks. No public activation. */
export function draftLaboratoryPresentation(lab:Lab,locale:Locale):LaboratoryPresentation {
  if(locale==="en")return {lab,locale,variants:labAgeVariants};
  const draft=drafts[locale];if(!draft)throw new Error(`Laboratory content not ready: ${locale}`);
  const slug=lab.slug as keyof typeof translations;
  if(!draft[slug]||!manifest.sources[slug])throw new Error(`Missing laboratory translation: ${lab.slug}`);
  return {locale,...draftTranslatedLaboratory(lab,labAgeVariants,draft[slug],manifest.sources[slug])};
}

/** Match the public language gate. Never send draft Romanian on a public English route. */
export function publicLaboratoryPresentation(lab:Lab,requestedLocale:string):LaboratoryPresentation {
  const active:readonly string[]=ACTIVE_LOCALES;
  const locale=isSupportedLocale(requestedLocale)&&active.includes(requestedLocale)?requestedLocale:"en";
  return draftLaboratoryPresentation(lab,locale);
}
