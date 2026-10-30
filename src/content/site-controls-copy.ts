import copy from "./site-controls-copy.json";
import type {Locale} from "@/i18n/config";
import {formatLocalizedText} from "@/lib/i18n/format-text";
export const siteControlsCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export type SiteControlsCopy=typeof copy.en;
export function siteControlsText(locale:Locale,key:keyof typeof copy.en,values:Record<string,string|number>) {
 return formatLocalizedText(siteControlsCopy[locale][key],locale,values);
}
