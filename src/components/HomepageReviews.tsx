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
  <div className="rounded-3xl border border-teal/20 bg-white p-md md:p-lg">
   <h2 id="homepage-reviews-title" className="font-display text-2xl font-bold text-ink">{t.title}</h2>
   <p className="mt-xs text-ink/70">{t.intro}</p>
   <p className="mt-md text-xl font-bold text-teal-text" aria-live="polite">{failed?t.unavailable:!data?"…":count&&data.average!==null?`★ ${new Intl.NumberFormat(REGIONAL_LOCALES[locale],{minimumFractionDigits:1,maximumFractionDigits:1}).format(data.average)} / 5 · ${count}`:t.none}</p>
   {data?.comments.length?<ul className="mt-md grid gap-sm md:grid-cols-3">{data.comments.slice(0,3).map((review,index)=><li key={index} className="rounded-xl border border-ink/10 bg-cream p-md"><p className="font-semibold text-teal-text">{"★".repeat(Math.max(0,Math.min(5,review.rating)))}</p><p className="mt-2 whitespace-pre-wrap break-words text-ink">{review.comment}</p><p className="mt-2 text-sm text-ink/70">{t.anonymous}</p></li>)}</ul>:data?<p className="mt-sm text-ink/70">{t.noComments}</p>:null}
   <Link href="/reviews" className="mt-md inline-flex min-h-12 items-center rounded-xl border border-teal px-5 py-3 font-bold text-teal-text">{t.title} →</Link>
  </div>
 </section>;
}
