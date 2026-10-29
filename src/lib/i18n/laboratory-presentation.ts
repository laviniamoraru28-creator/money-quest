import type {Lab} from "@/content/learning-labs";
import {labAgeVariants} from "@/content/lab-age-variants";
import {ACTIVE_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import translations from "@/content/translations/laboratories.ro.json";
import manifest from "@/content/translations/laboratories.sources.json";
import {draftTranslatedLaboratory} from "./content-translations";

export type LaboratoryPresentation = {
  lab:Lab;
  locale?:"en";
  variants?:typeof labAgeVariants;
}|{lab:Lab;locale:Exclude<Locale,"en">;variants:typeof labAgeVariants};

/** Explicit draft assembly, also used by editorial rendering checks. No public activation. */
export function draftLaboratoryPresentation(lab:Lab,locale:Locale):LaboratoryPresentation {
  if(locale==="en")return {lab,locale,variants:labAgeVariants};
  if(locale!=="ro")throw new Error(`Laboratory content not ready: ${locale}`);
  const slug=lab.slug as keyof typeof translations;
  if(!translations[slug]||!manifest.sources[slug])throw new Error(`Missing laboratory translation: ${lab.slug}`);
  return {locale,...draftTranslatedLaboratory(lab,labAgeVariants,translations[slug],manifest.sources[slug])};
}

/** Match the public language gate. Never send draft Romanian on a public English route. */
export function publicLaboratoryPresentation(lab:Lab,requestedLocale:string):LaboratoryPresentation {
  const active:readonly string[]=ACTIVE_LOCALES;
  const locale=isSupportedLocale(requestedLocale)&&active.includes(requestedLocale)?requestedLocale:"en";
  return draftLaboratoryPresentation(lab,locale);
}
