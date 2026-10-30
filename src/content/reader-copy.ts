import copy from "./reader-copy.json";
import {formatLocalizedText as formatLibraryText} from "@/lib/i18n/format-text";
export {formatLocalizedText as formatLibraryText} from "@/lib/i18n/format-text";
import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";

/** Draft labels do not activate translated public routes. */
export const readerCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export function readerText(locale:Locale,key:keyof typeof copy.en,values:Record<string,string|number>) {
  return formatLibraryText(readerCopy[locale][key],locale,values);
}
/** A source date is a calendar date, never a browser-local instant. */
export function librarySourceDate(locale:Locale,iso:string) {
  const date=new Date(`${iso}T00:00:00Z`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==iso)throw new Error("Invalid library source date");
  return new Intl.DateTimeFormat(REGIONAL_LOCALES[locale],{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(date);
}
