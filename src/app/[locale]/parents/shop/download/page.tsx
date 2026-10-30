import {publicParentLocale} from "@/lib/i18n/parent-presentation";
import {storefrontFlow,publicCommerce} from "@/lib/commerce/storefront";
import type {Metadata} from "next";
import {ShopOrder} from "@/components/ShopOrder";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Recover your digital download",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const flow=storefrontFlow(publicParentLocale(locale),publicCommerce()?.mode==="live"),copy=flow.copy;return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-9"><h1 className="text-3xl">{copy.recoveryTitle}</h1><div className="mt-6"><ShopOrder recovery {...flow}/></div></main>}
