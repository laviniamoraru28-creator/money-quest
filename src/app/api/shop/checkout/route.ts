import {randomBytes,createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {findProduct} from "@/content/shop";
import {canCheckout,commerceConfig} from "@/lib/commerce/config";
import {stripeClient,verifyLiveStripeConfiguration,APP_ID} from "@/lib/commerce/stripe";
import {limitedBody} from "@/lib/security/limited-body";
import {verifyConfirmationTransport} from "@/lib/commerce/confirmation";
import {validatedCheckoutUrl} from "@/lib/commerce/client-messages";
import {saveContract,archiveName,type Contract} from "@/lib/commerce/release";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){
 let config;try{config=commerceConfig();}catch{return NextResponse.json({code:"purchases_closed",message:"Purchases are not open yet. Free samples are available."},{status:503})}
 if(request.headers.get("origin")!==config.origin)return NextResponse.json({code:"checkout_use_site",message:"Use the Money Quest checkout page."},{status:403});
 let value:Record<string,unknown>;
 try{value=JSON.parse(await limitedBody(request,1500));if(!value||Array.isArray(value)||Object.keys(value).some(key=>!["productId","instantSupply","cancellationAcknowledged","adultPurchaser",...(config.mode==="live"?["termsAccepted"]:[])].includes(key)))throw new Error();}catch{return NextResponse.json({code:"checkout_choices",message:"Check the checkout choices."},{status:400})}
 const product=findProduct(String(value.productId));
 if(!product||value.instantSupply!==true||value.cancellationAcknowledged!==true||value.adultPurchaser!==true||(config.mode==="live"&&value.termsAccepted!==true))return NextResponse.json({code:"checkout_adult",message:"An adult must confirm both digital-download choices."},{status:400});
 if(!await canCheckout(product))return NextResponse.json({code:"product_unavailable",message:"This download is not available for purchase yet."},{status:503});
 const nonce=randomBytes(32).toString("hex"),tag=randomBytes(4).toString("hex");
 try{
 await verifyLiveStripeConfiguration(config,product.id);
 if(config.mode==="live")await verifyConfirmationTransport();
 let contract:Contract|undefined;
 if(config.mode==="live"){
  const r=config.release!,asset=r.products[product.id];
  contract={id:randomBytes(16).toString("hex"),mode:"live",accountId:r.accountId,productId:product.id,title:product.title,description:product.description,pages:product.pages,includes:[...product.includes],amount:product.price,currency:"gbp",priceId:process.env[product.priceEnv]!,termsVersion:r.terms.version,termsText:r.terms.text,merchant:r.merchant,privacy:r.privacy,taxStatement:r.taxStatement,archive:{file:archiveName(product,asset.sha256),...asset},created:Date.now()};
  await saveContract(config.orders,contract);
 }
 const session=await stripeClient().checkout.sessions.create({
  ui_mode:"hosted_page",
  mode:"payment",
  billing_address_collection:"auto",
  phone_number_collection:{enabled:false},
  automatic_tax:{enabled:false},
  allow_promotion_codes:false,
  submit_type:"auto",
  integration_identifier:"hosted_web_0001",
  origin_context:"web",
  adaptive_pricing:{enabled:false},
  client_reference_id:tag,
  // Fulfilment validates these server-owned fields before releasing an archive.
  metadata:{app:APP_ID,product_id:product.id,locale:"en",instant_supply:"yes",cancellation_ack:"yes",terms_version:config.termsVersion,...(contract?{contract_id:contract.id,account_id:contract.accountId,terms_accepted:"yes"}:{}),browser_hash:createHash("sha256").update(nonce).digest("hex")},
  line_items:[{price:process.env[product.priceEnv]!,quantity:1}],
  success_url:`${config.origin}/en/parents/shop/success?session_id={CHECKOUT_SESSION_ID}&checkout=${tag}`,
  cancel_url:`${config.origin}/en/parents/shop?cancelled=1`
 },{idempotencyKey:`mq-checkout-${tag}-${nonce}`});
 const checkoutUrl=validatedCheckoutUrl(session.url);
 if(session.livemode!==(config.mode==="live"))throw new Error("Checkout environment mismatch");
 const response=NextResponse.json({url:checkoutUrl},{headers:{"Cache-Control":"no-store"}});response.cookies.set(`mq_checkout_${tag}`,nonce,{httpOnly:true,secure:config.origin.startsWith("https:"),sameSite:"lax",maxAge:86400,path:"/api/shop"});return response;
 }catch{return NextResponse.json({code:"checkout_unavailable",message:"Checkout could not be opened. You have not been charged by this request."},{status:503})}
}
