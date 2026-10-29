import copy from "./laboratory-copy.json";
import type {Locale} from "@/i18n/config";

/** Draft UI copy. Availability here does not activate a public language. */
export const laboratoryCopy = copy satisfies Record<Locale, Record<keyof typeof copy.en, string>>;
export const laboratorySpeechLocales: Record<Locale, string> = {
  en:"en-GB", ro:"ro-RO", es:"es-ES", fr:"fr-FR", de:"de-DE",
  it:"it-IT", pt:"pt-PT", nl:"nl-NL", pl:"pl-PL"
};
export function laboratoryPosition(locale:Locale,current:number,total:number) {
  const numbers = new Intl.NumberFormat(laboratorySpeechLocales[locale]);
  return laboratoryCopy[locale].position.replace("{current}",numbers.format(current)).replace("{total}",numbers.format(total));
}
