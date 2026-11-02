import {Link} from "@/i18n/navigation";
import type {ShopTermsCopy} from "@/content/shop-terms-copy";
/** Display-only translation drafts. This does not change the accepted consent version. */
export function ShopTerms({copy,version}:{copy:ShopTermsCopy;version:string}){
 const sections=[1,2,3,4,5,6] as const;
 return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-9 text-ink"><Link href="/parents/shop" className="inline-block min-h-12 py-3 text-teal-text underline">{copy.back}</Link><h1 className="mt-5 text-3xl">{copy.title}</h1><p className="mt-4">{copy.status.replace("{version}",version)}</p>{sections.map(i=><section key={i} className="mt-7"><h2 className="text-xl">{copy[`heading${i}`]}</h2><p className="mt-3 leading-relaxed">{copy[`body${i}`]}</p></section>)}<Link href="/privacy" className="mt-6 inline-block min-h-12 py-3 text-teal-text underline">{copy.privacy}</Link></main>;
}
