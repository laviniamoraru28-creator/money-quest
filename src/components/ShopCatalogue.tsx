import type {ReactNode} from "react";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {ShopCheckout} from "@/components/ShopCheckout";
import type {ShopCataloguePresentation} from "@/lib/i18n/shop-catalogue-presentation";
/** Selected server copy only; product IDs and file URLs remain canonical. */
export function ShopCatalogue({copy,products,flowCopy,available,termsRequired=false,merchant}:ShopCataloguePresentation & {available:readonly boolean[];termsRequired?:boolean;merchant?:ReactNode}){
 return <div className="min-h-screen bg-fog text-ink">
  <header className="border-b border-ink/15 bg-white"><nav aria-label={copy.nav} className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-5 py-3"><Link href="/" className="min-h-12 py-3 font-bold text-teal-text underline">{copy.home}</Link><Link href="/parents/resources" className="min-h-12 py-3 text-teal-text underline">{copy.guides}</Link><Link href="/parent-info" className="min-h-12 py-3 text-teal-text underline">{copy.privacy}</Link></nav></header>
  <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-5 py-9">
   <section className="rounded-3xl border border-teal/20 bg-white p-6 md:p-10"><p className="font-bold text-teal-text">{copy.audience}</p><h1 className="mt-3 max-w-3xl text-3xl leading-tight md:text-4xl">{copy.title}</h1><p className="mt-5 max-w-3xl text-lg leading-relaxed">{copy.intro}</p><p className="mt-4 max-w-3xl">{copy.digital}</p><a href="#free-preview" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-teal px-6 py-3 font-bold text-white">{copy.sampleCta}</a><p className="mt-3 text-sm">{copy.freeNote}</p></section>
   <aside className="mt-6 rounded-2xl border border-ink/20 bg-cream p-5"><h2 className="text-lg font-bold">{copy.previewTitle}</h2><p className="mt-2">{copy.previewBody}</p></aside>
   {merchant&&<div className="mt-6">{merchant}</div>}
   <section id="free-preview" aria-labelledby="products-title" className="mt-10 scroll-mt-6"><h2 id="products-title" className="text-2xl">{copy.productsTitle}</h2><div className="mt-6 grid items-start gap-7 lg:grid-cols-2">{products.map((product,index)=><article key={product.id} id={product.id} className="min-w-0 overflow-hidden rounded-3xl border border-ink/20 bg-white">
    <div className="bg-cream p-6"><Image unoptimized src={product.image} alt={product.imageAlt} width={640} height={900} className="mx-auto h-72 w-auto max-w-full rounded-xl object-contain shadow-md"/></div>
    <div className="p-6"><h3 className="text-2xl">{product.title}</h3><p className="mt-3 leading-relaxed">{product.description}</p><p className="mt-3 font-bold text-teal-text">{product.pages}</p><ul className="mt-4 list-disc space-y-2 pl-5">{product.includes.map(item=><li key={item}>{item}</li>)}</ul>
     <p className="mt-5 text-2xl font-bold">{product.priceLabel} <span className="text-sm font-normal">{copy.priceNote}</span></p><p className="mt-2 text-sm">{copy.format}</p>
     <a href={product.sample} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-teal px-4 py-3 text-center font-bold text-teal-text">{product.sampleLabel}</a>
     <ShopCheckout productId={product.id} enabled={available[index]??false} copy={flowCopy} termsRequired={termsRequired}/>
    </div>
   </article>)}</div></section>
   <section aria-labelledby="included-title" className="mt-10 rounded-3xl border border-ink/15 bg-white p-6"><h2 id="included-title" className="text-2xl">{copy.includedTitle}</h2><div className="mt-5 grid gap-6 md:grid-cols-3"><div><h3 className="font-bold">{copy.picturesTitle}</h3><p className="mt-2">{copy.picturesBody}</p></div><div><h3 className="font-bold">{copy.responseTitle}</h3><p className="mt-2">{copy.responseBody}</p></div><div><h3 className="font-bold">{copy.supportTitle}</h3><p className="mt-2">{copy.supportBody}</p></div></div><p className="mt-6 text-sm">{copy.evidence}</p><Link href="/parents/resources" className="mt-3 inline-block min-h-12 py-3 font-semibold text-teal-text underline">{copy.evidenceLink}</Link></section>
   <section className="mt-9 max-w-3xl"><h2 className="text-2xl">{copy.faqTitle}</h2>{[[copy.q1,copy.a1],[copy.q2,copy.a2],[copy.q3,copy.a3],[copy.q4,copy.a4]].map(([q,a])=><details key={q} className="mt-4 rounded-xl border border-ink/20 bg-white p-4"><summary className="min-h-12 cursor-pointer py-2 font-bold">{q}</summary><p className="mt-3 leading-relaxed">{a}</p></details>)}<Link href="/parents/shop/terms" className="mt-5 inline-block min-h-12 py-3 font-semibold text-teal-text underline">{copy.terms}</Link></section>
  </main>
 </div>
}
