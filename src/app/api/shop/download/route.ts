import {orderErrorResponse,publicOrderErrorLocale} from "@/lib/commerce/order-error";
import type {Locale} from "@/i18n/config";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {NextResponse} from "next/server";
import {authorisedOrder} from "@/lib/commerce/download";
import {commerceConfig} from "@/lib/commerce/config";
import {limitedBody} from "@/lib/security/limited-body";
import {verifyArchive} from "@/lib/commerce/release";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){let locale:Locale="en";
 try{
  if(request.headers.get("origin")!==commerceConfig().origin)return new NextResponse(null,{status:403});
  const data=new URLSearchParams(await limitedBody(request,2000));locale=publicOrderErrorLocale(data.get("locale"));const {config,product,order}=await authorisedOrder(data.get("token")??"");
  const file=order.contract?await verifyArchive(config.assets,order.contract.archive.file,order.contract.archive):await readFile(path.join(config.assets,product.file));
  return new NextResponse(new Uint8Array(file),{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="${product.file}"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
 }catch{return orderErrorResponse(locale,"download")}
}
