import {createHash,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {commerceConfig} from "@/lib/commerce/config";
import {paidSession,fulfillSession} from "@/lib/commerce/stripe";
import {orderToken,validSessionId} from "@/lib/commerce/orders";
import {limitedBody} from "@/lib/security/limited-body";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const config=commerceConfig();if(request.headers.get("origin")!==config.origin)return NextResponse.json({message:"Use Money Quest to retrieve your order"},{status:403});
  const {sessionId,checkout}=JSON.parse(await limitedBody(request,1500));if(typeof sessionId!=="string"||!validSessionId(sessionId)||typeof checkout!=="string"||!/^[a-f0-9]{8}$/.test(checkout))throw new Error();
  const nonce=(await cookies()).get(`mq_checkout_${checkout}`)?.value;if(!nonce)throw new Error();
  const session=await paidSession(sessionId);const expected=session.metadata?.browser_hash;if(!expected||!/^[a-f0-9]{64}$/.test(expected)||session.client_reference_id!==checkout)throw new Error();
  const hash=createHash("sha256").update(nonce).digest();if(!timingSafeEqual(hash,Buffer.from(expected,"hex")))throw new Error();
  const order=await fulfillSession(sessionId);return NextResponse.json({token:orderToken(order,config.signing),productId:order.productId,expires:order.expires},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({message:"Order not ready or this browser cannot verify it. Retry after payment completes; do not pay again."},{status:409,headers:{"Cache-Control":"no-store"}})}
}
