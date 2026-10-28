import type {Metadata} from "next";
import {Link} from "@/i18n/navigation";
import {ShopOrder} from "@/components/ShopOrder";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your digital order",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Page(){return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-9"><h1 className="text-3xl">Your digital order</h1><div className="mt-6"><ShopOrder/></div><Link href="/parents/shop" className="mt-8 inline-block min-h-12 py-3 text-teal-text underline">Return to parent resources</Link></main>}
