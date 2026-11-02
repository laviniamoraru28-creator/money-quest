import copy from "./library-shelf-copy.json";
import type {Locale} from "@/i18n/config";
import {formatLibraryText} from "./reader-copy";
export const libraryShelfCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
export function shelfText(locale:Locale,key:keyof typeof copy.en,values:Record<string,string|number>) {
 return formatLibraryText(libraryShelfCopy[locale][key],locale,values);
}
