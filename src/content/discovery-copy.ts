import copy from "./discovery-copy.json";
import type {Locale} from "@/i18n/config";
import {formatLibraryText} from "./reader-copy";
/** Draft interface copy, separate from public locale activation. */
export const discoveryCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export function discoveryText(locale:Locale,key:keyof typeof copy.en,values:Record<string,string|number>) {
 return formatLibraryText(discoveryCopy[locale][key],locale,values);
}
