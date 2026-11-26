"use client";
import {useLocale} from "next-intl";
import {useLocalProgress} from "@/lib/local-progress/use-local-progress";
import {isSupportedLocale} from "@/i18n/config";
import {learningAmount} from "@/lib/currency/learning-currency";

// A common circulating example for each supported currency. Values use major units.
export const teachingCash: Record<string, {coin:number; note:number}> = {
  GBP:{coin:1,note:5}, USD:{coin:0.25,note:1}, EUR:{coin:1,note:5},
  CAD:{coin:1,note:5}, AUD:{coin:1,note:5}, CHF:{coin:1,note:10},
  JPY:{coin:100,note:1000}, RON:{coin:0.5,note:5}, PLN:{coin:2,note:10},
};

export function LearningCash({kind, value, size=56}: {kind:"coin"|"note";value?:number;size?:number}) {
  const {state:{currencyCode}}=useLocalProgress();
  const raw=useLocale(), locale=isSupportedLocale(raw)?raw:"en";
  const denomination=value ?? (teachingCash[currencyCode] ?? teachingCash.GBP!)[kind];
  const label=learningAmount(denomination,locale,currencyCode);
  return <span aria-hidden="true" data-learning-cash={kind} data-currency={currencyCode}
    className={"inline-flex shrink-0 flex-col items-center justify-center border-double font-bold leading-none shadow-sm " +
      (kind==="coin" ? "rounded-full border-4 border-stone-500 bg-gradient-to-br from-stone-100 via-stone-300 to-amber-200 text-stone-900" :
        "rounded-md border-4 border-emerald-700 bg-gradient-to-br from-emerald-100 via-amber-50 to-emerald-200 text-emerald-950")}
    style={{width:kind==="coin"?size:size*1.55,height:size,fontSize:Math.max(9,size/4)}}>
    <span>{label}</span><small className="mt-0.5">{currencyCode}</small>
  </span>;
}
