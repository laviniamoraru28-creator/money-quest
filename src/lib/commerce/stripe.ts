import Stripe from "stripe";
import {findProduct,SHOP_TERMS_VERSION} from "@/content/shop";
import {commerceConfig} from "./config";
import {readOrder,saveOrderOnce,type Order} from "./orders";
export const APP_ID="moneyquest-parent-shop-v1";
export function stripeClient(){return new Stripe(commerceConfig().key,{apiVersion:"2026-08-26.dahlia",maxNetworkRetries:2,timeout:15000})}
export function validatePaidSession(session:Stripe.Checkout.Session){
 const product=findProduct(session.metadata?.product_id??"");
 const lines=session.line_items?.data;
 if(session.livemode||session.mode!=="payment"||session.status!=="complete"||session.payment_status!=="paid"||session.currency!=="gbp"||!product||session.metadata?.app!==APP_ID||session.metadata?.locale!=="en"||session.metadata?.instant_supply!=="yes"||session.metadata?.cancellation_ack!=="yes"||session.metadata?.terms_version!==SHOP_TERMS_VERSION||session.amount_total!==product.price||lines?.length!==1||session.line_items?.has_more||lines[0]?.quantity!==1||lines[0]?.price?.id!==process.env[product.priceEnv])throw new Error("Payment is not eligible for this download");
 const intent=session.payment_intent;
 if(!intent||typeof intent==="string"||intent.status!=="succeeded")throw new Error("Payment is not settled");
 const charge=intent.latest_charge;
 if(!charge||typeof charge==="string"||charge.refunded||charge.amount_refunded>0||charge.disputed)throw new Error("Payment is refunded or disputed");
 return product;
}
export async function paidSession(id:string){
 const session=await stripeClient().checkout.sessions.retrieve(id,{expand:["line_items","payment_intent.latest_charge"]});validatePaidSession(session);return session;
}
export async function fulfillSession(id:string){
 const config=commerceConfig();const session=await paidSession(id);const product=validatePaidSession(session);
 const existing=await readOrder(config.orders,id);if(existing)return existing;
 const created=Date.now();const order:Order={sessionId:id,productId:product.id,locale:"en",amount:product.price,currency:"gbp",created,expires:created+90*86400000,termsVersion:SHOP_TERMS_VERSION,instantSupply:true,cancellationAcknowledged:true};
 return saveOrderOnce(config.orders,order);
}
