import type {Metadata} from "next";
import {ShopOrder} from "@/components/ShopOrder";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Recover your digital download",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Page(){return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-9"><h1 className="text-3xl">Recover your digital download</h1><div className="mt-6"><ShopOrder recovery/></div></main>}
