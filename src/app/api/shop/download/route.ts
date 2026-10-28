import {readFile} from "node:fs/promises";
import path from "node:path";
import {NextResponse} from "next/server";
import {authorisedOrder} from "@/lib/commerce/download";
import {commerceConfig} from "@/lib/commerce/config";
import {limitedBody} from "@/lib/security/limited-body";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  if(request.headers.get("origin")!==commerceConfig().origin)return new NextResponse(null,{status:403});
  const data=new URLSearchParams(await limitedBody(request,2000));const {config,product}=await authorisedOrder(data.get("token")??"");
  const file=await readFile(path.join(config.assets,product.file));
  return new NextResponse(new Uint8Array(file),{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="${product.file}"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({message:"Download unavailable or link expired. Use adult support to recover your paid order."},{status:403,headers:{"Cache-Control":"no-store"}})}
}
