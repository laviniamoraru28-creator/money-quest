"use client";
import {useEffect,useState} from "react";
import {Link} from "@/i18n/navigation";
import {reviewsCopy} from "@/content/reviews-copy";
import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";
type ReviewSummary={count:number;average:number|null;comments:{rating:number;comment:string}[]};
export function HomepageReviews({locale}:{locale:Locale}){
 const t=reviewsCopy[locale], [data,setData]=useState<ReviewSummary|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch("/api/reviews",{cache:"no-store",signal:controller.signal}).then(r=>{if(!r.ok)throw new Error("reviews");return r.json()}).then((value:ReviewSummary)=>{if(Number.isFinite(value.count)&&Array.isArray(value.comments))setData(value);else setFailed(true)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});return()=>controller.abort()},[]);
 const count=data?.count??0;
 return <section aria-labelledby="homepage-reviews-title" className="mx-auto max-w-[1200px] px-sm pb-2xl">
  <div className="rounded-2xl border border-teal/20 bg-white px-md py-sm">
   <h2 id="homepage-reviews-title" className="font-display text-lg font-bold text-ink">{t.title}</h2>
   <p className="mt-xs text-xl font-bold text-teal-text" aria-live="polite">{failed?t.unavailable:!data?"…":count&&data.average!==null?`★ ${new Intl.NumberFormat(REGIONAL_LOCALES[locale],{minimumFractionDigits:1,maximumFractionDigits:1}).format(data.average)} / 5 · ${count}`:t.none}</p>
   <Link href="/reviews" className="mt-xs inline-flex min-h-12 items-center rounded-xl border border-teal px-5 py-3 font-bold text-teal-text">{t.title} →</Link>
  </div>
 </section>;
}
