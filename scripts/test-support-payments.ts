import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {amountInPence, checkoutInput, SUPPORT_APP} from '../src/lib/support/validation';
import {supportConfig, validSupportSession, confirmedSupport, browserHash, createSupportSession, allowSupportRequest} from '../src/lib/support/server';
import {checkoutPaused} from '../src/lib/commerce/checkout-pause';
import {readFileSync} from 'node:fs';

async function main() {
  for (const [v,n] of [['2',200],['5',500],['10',1000],['2,50',250],['100',10000]] as const) assert.equal(amountInPence(v),n);
  for (const value of ['0','1.99','100.01','-5','1e2','2.001','Infinity','NaN',' 2','2,000',2,null,{}]) assert.throws(()=>amountInPence(value));
  const input={amount:'5',locale:'ro',adult:true,requestId:'12345678-1234-1234-1234-123456789abc'};
  assert.equal(checkoutInput(input).amount,500);
  for(const value of [{...input,adult:false},{...input,currency:'usd'},{...input,locale:'xx'},{...input,requestId:'x'}]) assert.throws(()=>checkoutInput(value));
  const original={...process.env};
  delete process.env.MONEYQUEST_SUPPORT_MODE;
  assert.throws(supportConfig);
  process.env.MONEYQUEST_SUPPORT_MODE='live';assert.throws(supportConfig);
  process.env.MONEYQUEST_SUPPORT_MODE='sandbox';process.env.MONEYQUEST_SUPPORT_STRIPE_KEY='sk_live_fake';assert.throws(supportConfig);
  process.env.MONEYQUEST_SUPPORT_STRIPE_KEY='sk_test_fake';process.env.MONEYQUEST_SUPPORT_PRODUCT_ID='prod_support';process.env.MONEYQUEST_SUPPORT_WEBHOOK_SECRET='whsec_fake';process.env.NEXT_PUBLIC_SITE_URL='http://localhost:3000';
  const config=supportConfig();
  const token='a'.repeat(64);
  const good={id:'cs_test_1234567890123',livemode:false,mode:'payment',status:'complete',payment_status:'paid',currency:'gbp',amount_total:500,metadata:{app:SUPPORT_APP,amount:'500',browser_hash:browserHash(token)},line_items:{has_more:false,data:[{quantity:1,price:{product:'prod_support',unit_amount:500,currency:'gbp',type:'one_time'}}]},payment_intent:{status:'succeeded',amount:500,currency:'gbp',latest_charge:{refunded:false,amount_refunded:0,disputed:false}}} as unknown as Stripe.Checkout.Session;
  assert(validSupportSession(good,config.product));
  for(const change of [{livemode:true},{mode:'subscription'},{payment_status:'unpaid'},{status:'open'},{currency:'eur'},{amount_total:200},{metadata:{app:'shop',amount:'500'}},{payment_intent:{status:'processing'}},{line_items:{has_more:true,data:good.line_items!.data}}]) assert(!validSupportSession({...good,...change} as Stripe.Checkout.Session,config.product));
  for(const change of [{refunded:true},{amount_refunded:1},{disputed:true}]) {const s=structuredClone(good);Object.assign((s.payment_intent as Stripe.PaymentIntent).latest_charge!,change);assert(!validSupportSession(s,config.product));}
  const calls: unknown[][]=[];
  const fake={products:{retrieve:async()=>({active:true,livemode:false,metadata:{app:SUPPORT_APP}})},checkout:{sessions:{retrieve:async()=>good,create:async(...args:unknown[])=>{calls.push(args);return {url:'https://checkout.stripe.com/c/pay/test',livemode:false};}}}} as unknown as Stripe;
  assert(await confirmedSupport(good.id,token,config,fake));
  assert(!await confirmedSupport(good.id,'b'.repeat(64),config,fake));
  assert(!await confirmedSupport('cs_live_bad',token,config,fake));
  await createSupportSession(checkoutInput(input),token,config,fake);
  await createSupportSession(checkoutInput(input),token,config,fake);
  assert.deepEqual(calls[0],calls[1], 'retry parameters and idempotency key must remain stable');
  const params=calls[0]![0] as Stripe.Checkout.SessionCreateParams;
  assert.equal(params.mode,'payment');assert.equal(params.line_items![0]!.price_data!.unit_amount,500);assert.equal(params.line_items![0]!.price_data!.currency,'gbp');assert.equal(params.metadata!.app,SUPPORT_APP);assert(!("payment_method_types" in params));assert.match(params.cancel_url!,/\/ro\/support\?cancelled=1$/);
  const now=Date.now()+120000;for(let i=0;i<5;i++)assert(allowSupportRequest(token,now));assert(!allowSupportRequest(token,now));assert(allowSupportRequest(token,now+60001));
  for(let i=0;i<29;i++)assert(allowSupportRequest(String(i),now+60001));assert(!allowSupportRequest('rotating-browser',now+60001));
  delete process.env.MONEYQUEST_CHECKOUT_PAUSED;assert(checkoutPaused());
  const locales=['en','ro','es','fr','de','it','pt','nl','pl'];let expected:string[]|undefined;
  for(const locale of locales){const copy=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8')).support;assert(copy);const keys=Object.keys(copy).sort();if(expected)assert.deepEqual(keys,expected);expected=keys;for(const value of Object.values(copy))assert(typeof value==='string'&&value.length>0);}
  process.env=original;
  console.log('PASS support: amounts, tampering, adult validation, sandbox-only gate, payment settlement/refunds, browser binding, retry idempotency, rate limits, 9 locales and shop pause');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
