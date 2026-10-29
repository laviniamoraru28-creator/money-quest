import {ACTIVE_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import {parentGuideCopy} from "@/content/parent-guide-copy";
import {shopFlowCopy} from "@/content/shop-flow-copy";
/** Copy drafts do not enable a translated product edition or a public language. */
export function publicParentLocale(requested:string):Locale {
 const active:readonly string[]=ACTIVE_LOCALES;
 return isSupportedLocale(requested)&&active.includes(requested)?requested:"en";
}
export function parentGuidePresentation(locale:Locale){return {locale,copy:parentGuideCopy[locale]};}
export function shopFlowPresentation(locale:Locale){return {copy:shopFlowCopy[locale]};}
