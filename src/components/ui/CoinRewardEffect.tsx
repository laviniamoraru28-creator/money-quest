"use client";
import {useEffect,useRef,useState} from "react";
import {useLocale} from "next-intl";
import {Coin} from "./Coin";
import {formatCurrency} from "@/lib/currency/format";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
export function CoinRewardEffect(){
  const [award,setAward]=useState<{amount:number;currency:string}|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const {reducedMotion}=useAccessibilityPrefs();const locale=useLocale();
  useEffect(()=>{
    const receive=(event:Event)=>{
      const value=(event as CustomEvent).detail;
      if(!value||!Number.isSafeInteger(value.amount)||value.amount<=0)return;
      setAward(value);if(timer.current)clearTimeout(timer.current);
      timer.current=setTimeout(()=>setAward(null),3000);
    };
    window.addEventListener("moneyquest-coin-award",receive);
    return()=>{window.removeEventListener("moneyquest-coin-award",receive);if(timer.current)clearTimeout(timer.current);};
  },[]);
  return <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center" aria-live="polite" aria-atomic="true">{award&&<div data-coin-award data-reduced-motion={reducedMotion?"true":"false"} className="coin-reward flex max-w-sm items-center gap-3 rounded-2xl border-2 border-gold bg-white px-5 py-4 shadow-floating"><div aria-hidden="true" className="relative flex items-center gap-1"><Coin/><span className="coin-reward-rise"><Coin size="sm"/></span><span className="coin-reward-rise coin-reward-later"><Coin size="sm"/></span></div><p className="font-semibold">Virtual coins earned: +{formatCurrency(award.amount,award.currency,locale)}</p></div>}</div>;
}
