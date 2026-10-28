import {randomBytes,createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {findProduct,SHOP_TERMS_VERSION} from "@/content/shop";
import {canCheckout,commerceConfig} from "@/lib/commerce/config";
import {stripeClient,APP_ID} from "@/lib/commerce/stripe";
import {limitedBody} from "@/lib/security/limited-body";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
 let config;try{config=commerceConfig();}catch{return NextResponse.json({message:"Purchases are not open yet. Free samples are available."},{status:503})}
 if(request.headers.get("origin")!==config.origin)return NextResponse.json({message:"Use the Money Quest checkout page."},{status:403});
 let value:Record<string,unknown>;
 try{value=JSON.parse(await limitedBody(request,1500));if(!value||Array.isArray(value)||Object.keys(value).some(key=>!["productId","instantSupply","cancellationAcknowledged","adultPurchaser"].includes(key)))throw new Error();}catch{return NextResponse.json({message:"Check the checkout choices."},{status:400})}
 const product=findProduct(String(value.productId));
 if(!product||value.instantSupply!==true||value.cancellationAcknowledged!==true||value.adultPurchaser!==true)return NextResponse.json({message:"An adult must confirm both digital-download choices."},{status:400});
 if(!await canCheckout(product))return NextResponse.json({message:"This download is not available for purchase yet."},{status:503});
 const nonce=randomBytes(32).toString("hex"),tag=randomBytes(4).toString("hex"),letters=Array.from(randomBytes(8),n=>String.fromCharCode(97+n%26)).join("");
 try{
 const session=await stripeClient().checkout.sessions.create({mode:"payment",line_items:[{price:process.env[product.priceEnv]!,quantity:1}],success_url:`${config.origin}/en/parents/shop/success?session_id={CHECKOUT_SESSION_ID}&checkout=${tag}`,cancel_url:`${config.origin}/en/parents/shop?cancelled=1`,client_reference_id:tag,integration_identifier:`moneyquest_parent_shop_${letters}`,locale:"en-GB",customer_creation:"if_required",metadata:{app:APP_ID,product_id:product.id,locale:"en",instant_supply:"yes",cancellation_ack:"yes",terms_version:SHOP_TERMS_VERSION,browser_hash:createHash("sha256").update(nonce).digest("hex")},custom_text:{submit:{message:"Sandbox test only. Digital PDF, no physical item. You requested immediate access and acknowledged loss of the change-of-mind cancellation right once supply begins. Statutory rights for faulty or misdescribed content remain."}}},{idempotencyKey:`mq-checkout-${tag}-${nonce}`});
 if(!session.url||new URL(session.url).hostname!=="checkout.stripe.com")throw new Error("Invalid checkout URL");
 const response=NextResponse.json({url:session.url},{headers:{"Cache-Control":"no-store"}});response.cookies.set(`mq_checkout_${tag}`,nonce,{httpOnly:true,secure:config.origin.startsWith("https:"),sameSite:"lax",maxAge:86400,path:"/api/shop"});return response;
 }catch{return NextResponse.json({message:"Checkout could not be opened. You have not been charged by this request."},{status:503})}
}
