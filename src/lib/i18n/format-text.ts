import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";
/** Pure formatting shared by clients; does not import translated catalogues. */
export function formatLocalizedText(text:string,locale:Locale,values:Record<string,string|number>) {
 return text.replace(/\{(\w+)\}/g,(_,name:string)=>{
  const value=values[name];
  if(value===undefined)throw new Error(`Missing library placeholder: ${name}`);
  return typeof value==="number"?new Intl.NumberFormat(REGIONAL_LOCALES[locale]).format(value):value;
 });
}
