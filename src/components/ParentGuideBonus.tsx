import Image from "next/image";
import type {Locale} from "@/i18n/config";
import {parentBonusCopy,parentBonusTitle} from "@/content/parent-bonus-copy";
/** Only the cover preview is public. The full PDF always uses authorised POST delivery. */
export function ParentGuideBonus({locale,token}:{locale:Locale;token?:string}){
 const copy=parentBonusCopy[locale];
 return <section aria-labelledby="parent-bonus-title" className="mt-8 grid min-w-0 gap-6 rounded-3xl border border-teal/25 bg-cream p-5 md:grid-cols-[180px_minmax(0,1fr)] md:p-8">
  <Image unoptimized src="/images/money-quest/parents/little-minds-smart-money-cover-v1.webp" alt={copy.coverAlt} width={640} height={906} className="mx-auto h-auto max-h-80 w-auto max-w-full rounded-lg object-contain shadow-md"/>
  <div className="min-w-0 self-center"><p className="text-sm font-bold text-teal-text">{token?copy.ready:copy.badge}</p><p className="mt-2 text-sm">{copy.collection}</p><h2 id="parent-bonus-title" lang="en" className="mt-3 text-2xl">{parentBonusTitle}</h2>
   <p className="mt-3 leading-relaxed">{copy.description}</p><p className="mt-3 leading-relaxed">{copy.activities}</p><p className="mt-4 font-semibold">{copy.included}</p><p className="mt-3 text-sm font-semibold">{copy.englishOnly}</p>
   {token&&<form method="post" action="/api/shop/download" className="mt-5"><input type="hidden" name="token" value={token}/><input type="hidden" name="locale" value={locale}/><input type="hidden" name="asset" value="parent-guide"/><button className="min-h-12 max-w-full rounded-xl bg-teal px-5 py-3 text-left font-bold text-white">{copy.download}</button></form>}
  </div>
 </section>;
}
