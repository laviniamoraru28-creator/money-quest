import {NextResponse} from "next/server";
import {authorisedOrder} from "@/lib/commerce/download";
import {commerceConfig} from "@/lib/commerce/config";
import {limitedBody} from "@/lib/security/limited-body";
import {orderToken} from "@/lib/commerce/orders";
import {priceLabel} from "@/content/shop";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){try{
 if(request.headers.get("origin")!==commerceConfig().origin)return new NextResponse(null,{status:403});
 const body=new URLSearchParams(await limitedBody(request,2000));const {order,product,config}=await authorisedOrder(body.get("token")??"");
 const text=`MONEY QUEST SANDBOX ORDER CONFIRMATION\nNo real money was charged. This is not a live sales contract.\n\nProduct: ${product.title}\nAmount: ${priceLabel(order.amount)} GBP (test)\nOrder: ${order.sessionId}\nDate: ${new Date(order.created).toISOString()}\nTerms version: ${order.termsVersion}\nFormat: downloadable PDF files in a ZIP archive. No printed product or shipping. Printing and binding costs not included.\nLicence: one household, no redistribution or resale.\nImmediate supply explicitly requested: yes.\nAcknowledgement of loss of the change-of-mind cancellation right once digital supply begins: yes. Statutory rights for faulty or misdescribed content remain.\nDownload link expires: ${new Date(order.expires).toISOString()}\nRecovery link (keep private): ${config.origin}/en/parents/shop/download#token=${orderToken(order,config.signing)}\n\nLive launch still requires verified seller identity/contact, final consumer terms, tax decisions, automatic durable confirmation, recovery and all requested languages.\n`;
 return new NextResponse(text,{headers:{"Content-Type":"text/plain; charset=utf-8","Content-Disposition":"attachment; filename=money-quest-sandbox-confirmation.txt","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}catch{return new NextResponse("Order confirmation unavailable",{status:403,headers:{"Cache-Control":"no-store"}})}}
