"use client";
import {useEffect,useState} from "react";
import {useTranslations} from "next-intl";
import {reviewsCopy} from "@/content/reviews-copy";
import {REGIONAL_LOCALES,type Locale} from "@/i18n/config";
import {formatLocalizedText} from "@/lib/i18n/format-text";
import {Link} from "@/i18n/navigation";
type Summary={count:number;average:number|null;comments:{rating:number;comment:string}[]};
export default function PublicReviews({locale="en"}:{locale?:Locale}){
 const t=reviewsCopy[locale],parent=useTranslations("parentInfo"),nav=useTranslations("nav"),format=(key:keyof typeof t,values:Record<string,string|number>)=>formatLocalizedText(t[key],locale,values);
  const [summary,setSummary]=useState<Summary|null>(null),[rating,setRating]=useState(0),[comment,setComment]=useState(""),[message,setMessage]=useState<""|"pending"|"saved"|"invalid"|"error">(""),[busy,setBusy]=useState(false),[available,setAvailable]=useState(false);
  const refresh=async()=>{try{const response=await fetch("/api/reviews",{cache:"no-store"});if(!response.ok)throw new Error();setSummary(await response.json());setAvailable(true);}catch{setAvailable(false);setMessage("error");}};
  useEffect(()=>{void refresh();},[]);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    try{const response=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating,comment})});const result=await response.json();if(!response.ok){setMessage(response.status===400?"invalid":"error");return;}setMessage(result.pending?"pending":"saved");setComment("");setRating(0);await refresh();}catch{setMessage("error");}finally{setBusy(false);}
  };
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-8"><Link href="/" className="inline-block min-h-12 py-3 text-teal-text underline">{nav("home")}</Link><h1 className="mt-4 text-3xl">{t.title}</h1><p className="mt-3">{t.intro}</p>
    <section aria-labelledby="rating-summary" className="mt-6 rounded-2xl border border-ink/20 bg-white p-5"><h2 id="rating-summary" className="text-2xl">{t.summary}</h2>{summary?<p className="mt-3">{summary.count?format("count",{average:new Intl.NumberFormat(REGIONAL_LOCALES[locale],{maximumFractionDigits:1,minimumFractionDigits:1}).format(summary.average!),count:summary.count}):t.none}</p>:<p className="mt-3">{t.unavailable}</p>}<h3 className="mt-5 text-xl">{t.comments}</h3>{summary?.comments.length?<ul className="mt-3 space-y-4">{summary.comments.map((review,index)=><li key={index} className="rounded-xl border border-ink/20 p-4"><p className="font-semibold">{t.anonymous} · {format("count",{average:review.rating,count:1}).split("·")[0]}</p><p className="mt-2 whitespace-pre-wrap break-words">{review.comment}</p></li>)}</ul>:<p className="mt-2">{t.noComments}</p>}</section>
    <form onSubmit={submit} className="mt-7 rounded-2xl border border-ink/20 bg-white p-5"><h2 className="text-2xl">{t.adult}</h2><p className="mt-3">{parent("q3Body")}</p><fieldset className="mt-5"><legend className="font-bold">{t.rating}</legend><div className="mt-3 flex flex-wrap gap-3">{[1,2,3,4,5].map(value=><label key={value} className="flex min-h-12 items-center gap-2 rounded-xl border border-ink/30 px-3 py-2"><input type="radio" name="rating" value={value} checked={rating===value} onChange={()=>setRating(value)} required className="h-5 w-5"/>{value} {value===1?t.star:t.stars}</label>)}</div></fieldset><label htmlFor="review-comment" className="mt-5 block font-bold">{t.comment}</label><textarea id="review-comment" maxLength={500} value={comment} onChange={event=>setComment(event.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-ink/30 bg-white p-3"/><p className="mt-3 text-sm">{parent("q2Body")}</p><button type="submit" disabled={!available||busy} className="mt-5 min-h-12 rounded-xl bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?t.sending:t.send}</button><p role="status" className="mt-3">{message?t[message]:""}</p></form>
  </main>;
}
