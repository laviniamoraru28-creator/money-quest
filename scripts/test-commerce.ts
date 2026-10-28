import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import Stripe from "stripe";
import {orderToken,parseOrderToken,saveOrderOnce,readOrder,type Order} from "../src/lib/commerce/orders";
import {privateDirectory,commerceConfig} from "../src/lib/commerce/config";
import {APP_ID,validatePaidSession} from "../src/lib/commerce/stripe";
import {SHOP_TERMS_VERSION} from "../src/content/shop";

async function main(){
 const secret="fixture-signing-secret-for-unit-tests-only-123456";
 const root=await mkdtemp(path.join(tmpdir(),"mq-order-test-"));
 const previous=process.env.MONEYQUEST_STRIPE_FAMILY_PRICE_ID;
 try{
 process.env.MONEYQUEST_STRIPE_FAMILY_PRICE_ID="price_fixture_family";
 const order:Order={sessionId:"cs_test_fixture1234567890",productId:"family-adventure-pack",locale:"en",amount:599,currency:"gbp",created:Date.now(),expires:Date.now()+60000,termsVersion:SHOP_TERMS_VERSION,instantSupply:true,cancellationAcknowledged:true};
 const token=orderToken(order,secret);
 assert.equal(parseOrderToken(token,secret).id,order.sessionId);
 assert.throws(()=>parseOrderToken(token+"bad",secret));
 assert.throws(()=>parseOrderToken(token,secret+"wrong"));
 assert.throws(()=>parseOrderToken(token,secret,order.expires+1));
 assert.throws(()=>parseOrderToken("../file.9999999999999.signature",secret));
 assert.throws(()=>privateDirectory("relative/path"));
 assert.throws(()=>privateDirectory(path.join(process.cwd(),"public/paid")));
 assert.throws(()=>commerceConfig(),"Live/unconfigured checkout must fail closed");
 await saveOrderOnce(root,order);
 assert.deepEqual(await saveOrderOnce(root,{...order,amount:100}),order,"Duplicate fulfilment must keep the original record");
 assert.deepEqual(await readOrder(root,order.sessionId),order);
 assert.equal(await readOrder(root,"cs_test_unknown1234567890"),null);
 assert.throws(()=>parseOrderToken(token.replace("cs_test_","cs_live_"),secret));
 const stored=await readFile(path.join(root,order.sessionId+".json"),"utf8");assert.ok(!/email|birthday|childName/.test(stored));
 const fixture={id:order.sessionId,livemode:false,mode:"payment",status:"complete",payment_status:"paid",currency:"gbp",amount_total:599,metadata:{app:APP_ID,product_id:"family-adventure-pack",locale:"en",instant_supply:"yes",cancellation_ack:"yes",terms_version:SHOP_TERMS_VERSION},line_items:{data:[{quantity:1,price:{id:"price_fixture_family"}}],has_more:false},payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:false}}};
 const validate=(value:unknown)=>validatePaidSession(value as Stripe.Checkout.Session);
 assert.equal(validate(fixture).id,"family-adventure-pack");
 for(const changes of [{livemode:true},{payment_status:"unpaid"},{status:"open"},{amount_total:1},{currency:"usd"},{payment_intent:{status:"processing",latest_charge:{}}},{payment_intent:{status:"succeeded",latest_charge:{refunded:true,amount_refunded:599,disputed:false}}},{payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:true}}},{line_items:{data:[{quantity:2,price:{id:"price_fixture_family"}}],has_more:false}},{metadata:{...fixture.metadata,instant_supply:"no"}},{metadata:{...fixture.metadata,cancellation_ack:"no"}}])assert.throws(()=>validate({...fixture,...changes}));
 const client=new Stripe("rk_test_fixture_only",{apiVersion:"2026-08-26.dahlia"});
 const payload=JSON.stringify({id:"evt_fixture",object:"event",type:"checkout.session.completed",data:{object:fixture}});
 const webhookSecret="whsec_fixture_only";
 const signature=client.webhooks.generateTestHeaderString({payload,secret:webhookSecret});
 assert.equal(client.webhooks.constructEvent(payload,signature,webhookSecret).type,"checkout.session.completed");
 assert.throws(()=>client.webhooks.constructEvent(payload+" ",signature,webhookSecret));
 assert.throws(()=>client.webhooks.constructEvent(payload,signature,"whsec_wrong"));
 console.log("PASS: signed/expiring download tokens, private paths, idempotent order records, paid amount/price/consent checks, refund/dispute rejection and webhook signatures.");
 }finally{if(previous===undefined)delete process.env.MONEYQUEST_STRIPE_FAMILY_PRICE_ID;else process.env.MONEYQUEST_STRIPE_FAMILY_PRICE_ID=previous;await rm(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1});
