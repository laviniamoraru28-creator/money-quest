import Stripe from "stripe";
import {findProduct,SHOP_TERMS_VERSION} from "@/content/shop";
import {commerceConfig,type CommerceConfig} from "./config";
import {readOrder,saveOrderOnce,validSessionId,type Order} from "./orders";
import {readContract,verifyArchive,type Contract} from "./release";
import {sendOrderConfirmation,type MailSender} from "./confirmation";
export const APP_ID="moneyquest-parent-shop-v1";
export function stripeClient(){return new Stripe(commerceConfig().key,{maxNetworkRetries:2,timeout:15000})}
export function validatePaidSession(session:Stripe.Checkout.Session,expected?:{mode:"sandbox"|"live";contract?:Contract}){
 const mode=expected?.mode??"sandbox",contract=expected?.contract;
 const product=findProduct(session.metadata?.product_id??"");
 const lines=session.line_items?.data,amount=contract?.amount??product?.price,price=contract?.priceId??(product?process.env[product.priceEnv]:undefined),terms=contract?.termsVersion??SHOP_TERMS_VERSION;
 if(session.livemode!==(mode==="live")||!validSessionId(session.id,mode)||session.mode!=="payment"||session.status!=="complete"||session.payment_status!=="paid"||session.currency!=="gbp"||!product||session.metadata?.app!==APP_ID||session.metadata?.locale!=="en"||session.metadata?.instant_supply!=="yes"||session.metadata?.cancellation_ack!=="yes"||session.metadata?.terms_version!==terms||session.amount_total!==amount||lines?.length!==1||session.line_items?.has_more||lines[0]?.quantity!==1||lines[0]?.price?.id!==price)throw new Error("Payment is not eligible for this download");
 if(mode==="live"&&(!contract||contract.productId!==product.id||session.metadata?.contract_id!==contract.id||session.metadata?.terms_accepted!=="yes"||session.metadata?.account_id!==contract.accountId))throw new Error("Live purchase contract mismatch");
 const intent=session.payment_intent;
 if(!intent||typeof intent==="string"||intent.status!=="succeeded")throw new Error("Payment is not settled");
 const charge=intent.latest_charge;
 if(!charge||typeof charge==="string"||charge.refunded||charge.amount_refunded>0||charge.disputed)throw new Error("Payment is refunded or disputed");
 return product;
}
export async function paidSession(id:string,client:Stripe=stripeClient()){
 const config=commerceConfig();if(!validSessionId(id,config.mode))throw new Error("Order belongs to another payment environment");
 const session=await client.checkout.sessions.retrieve(id,{expand:["line_items","payment_intent.latest_charge"]});
 const contract=config.mode==="live"?await readContract(config.orders,session.metadata?.contract_id??""):undefined;
 if(contract&&contract.accountId!==config.release!.accountId)throw new Error("Wrong merchant account");
 validatePaidSession(session,{mode:config.mode,contract});return session;
}
export async function verifyLiveStripeConfiguration(config:CommerceConfig,productId:string,client:Stripe=stripeClient()){
 if(config.mode!=="live")return;
 const product=findProduct(productId);if(!product)throw new Error("Unknown product");
 const account=await client.accounts.retrieve(null);
 if(account.id!==config.release!.accountId||!account.charges_enabled||!account.payouts_enabled)throw new Error("Live merchant is not ready to receive payments");
 const price=await client.prices.retrieve(process.env[product.priceEnv]!);
 if(!price.livemode||!price.active||price.type!=="one_time"||price.currency!=="gbp"||price.unit_amount!==product.price||price.tax_behavior!=="inclusive")throw new Error("Live price must match the displayed inclusive GBP total");
}
export async function fulfillSession(id:string,services?:{client?:Stripe;send?:MailSender}){
 const config=commerceConfig();const session=await paidSession(id,services?.client);
 const contract=config.mode==="live"?await readContract(config.orders,session.metadata?.contract_id??""):undefined;
 const product=validatePaidSession(session,{mode:config.mode,contract});
 if(contract)await verifyArchive(config.assets,contract.archive.file,contract.archive,false);
 let order=await readOrder(config.orders,id);
 if(!order){const created=Date.now();order=await saveOrderOnce(config.orders,{sessionId:id,productId:product.id,locale:"en",amount:contract?.amount??product.price,currency:"gbp",created,expires:created+90*86400000,termsVersion:contract?.termsVersion??SHOP_TERMS_VERSION,instantSupply:true,cancellationAcknowledged:true,...(contract?{mode:"live",contract}:{})} satisfies Order);}
 if(config.mode==="live")await sendOrderConfirmation(config,order,session.customer_details?.email??session.customer_email??"",services?.send);
 return order;
}
