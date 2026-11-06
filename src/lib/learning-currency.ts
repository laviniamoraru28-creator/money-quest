import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";

/** Teaching examples only. Shop prices and Stripe settlement are independent. */
export const LEARNING_CURRENCIES:Record<Locale,"GBP"|"RON"|"EUR"|"PLN">={
 en:"GBP",ro:"RON",es:"EUR",fr:"EUR",de:"EUR",it:"EUR",pt:"EUR",nl:"EUR",pl:"PLN"
};

export function formatLearningMoney(amount:number,locale:Locale):string{
 return new Intl.NumberFormat(REGIONAL_LOCALES[locale],{
  style:"currency",currency:LEARNING_CURRENCIES[locale],minimumFractionDigits:0,maximumFractionDigits:2
 }).format(amount);
}
