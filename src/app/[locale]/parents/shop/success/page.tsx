import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {storefrontFlow,publicCommerce} from "@/lib/commerce/storefront";
import type {Metadata} from "next";
import {Link} from "@/i18n/navigation";
import {ShopOrder} from "@/components/ShopOrder";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your digital order",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const flow=storefrontFlow(publicParentLocale(locale),publicCommerce()?.mode==="live"),copy=flow.copy;return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-9"><h1 className="text-3xl">{copy.successTitle}</h1><div className="mt-6"><ShopOrder {...flow}/></div><Link href="/parents/shop" className="mt-8 inline-block min-h-12 py-3 text-teal-text underline">{copy.back}</Link></main>}
