import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import vm from "node:vm";
import ts from "typescript";
import type Stripe from "stripe";
import {shopProducts,SHOP_TERMS_VERSION} from "../src/content/shop";
import {APP_ID,validatePaidSession} from "../src/lib/commerce/stripe";
import type {Contract} from "../src/lib/commerce/release";

// Execute the production route body. Only external configuration, persistence,
// Stripe creation and SMTP preflight are replaced; never contact a real service.
async function main(){
 const source=await readFile("src/app/api/shop/checkout/route.ts","utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const actualRequire=createRequire(import.meta.url),module={exports:{} as {POST:(request:Request)=>Promise<Response>}};
 let mode:"sandbox"|"live"="sandbox",available=true,ready=true,creates=0,mailChecks=0;
 let captured:Stripe.Checkout.SessionCreateParams|undefined;
 let options:{idempotencyKey:string}|undefined;
 const contracts:Contract[]=[];
 const release={accountId:"acct_fixture",merchant:{name:"Synthetic merchant",address:"Synthetic address",email:"support@merchant.test"},terms:{version:"fixture-v1",text:"Synthetic terms"},privacy:"Synthetic privacy",taxStatement:"Synthetic tax statement",products:Object.fromEntries(shopProducts.map(p=>[p.id,{sha256:"a".repeat(64),bytes:200}]))};
 const mocks:Record<string,unknown>={
  "@/content/shop":{shopProducts,findProduct:(id:string)=>shopProducts.find(p=>p.id===id)},
  "@/lib/commerce/config":{commerceConfig:()=>({mode,origin:"https://moneyquesteducation.com",orders:"/synthetic-orders",termsVersion:mode==="live"?release.terms.version:SHOP_TERMS_VERSION,release:mode==="live"?release:undefined}),canCheckout:async()=>available},
  "@/lib/commerce/stripe":{APP_ID,verifyLiveStripeConfiguration:async()=>{if(!ready)throw new Error("Synthetic preflight failure");},stripeClient:()=>({checkout:{sessions:{create:async(params:Stripe.Checkout.SessionCreateParams,requestOptions:{idempotencyKey:string})=>{creates++;captured=params;options=requestOptions;return {url:"https://checkout.stripe.com/c/pay/cs_fixture",livemode:mode==="live"};}}}})},
  "@/lib/commerce/confirmation":{verifyConfirmationTransport:async()=>{mailChecks++;}},
  "@/lib/commerce/release":{saveContract:async(_directory:string,contract:Contract)=>{contracts.push(contract);},archiveName:(p:{id:string},hash:string)=>`${p.id}-${hash}.zip`}
 };
 const wrapper=vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`,{Request,Response,URL,Buffer,process,console});
 wrapper((id:string)=>id in mocks?mocks[id]:actualRequire(id.startsWith("@/")?"../src/"+id.slice(2):id),module,module.exports);
 const request=(productId:string,extra:Record<string,unknown>={},origin="https://moneyquesteducation.com")=>new Request(`${origin}/api/shop/checkout`,{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify({productId,instantSupply:true,cancellationAcknowledged:true,adultPurchaser:true,...(mode==="live"?{termsAccepted:true}:{}),...extra})});
 const previous=shopProducts.map(p=>process.env[p.priceEnv]);
 try{
  for(const p of shopProducts)process.env[p.priceEnv]=`price_fixture_${p.id.replaceAll("-","_")}`;
  for(const current of ["sandbox","live"] as const){
   mode=current;
   for(const product of shopProducts){
    const response=await module.exports.POST(request(product.id));assert.equal(response.status,200);
    assert(captured);const params=captured;
    const cookie=response.headers.get("set-cookie")??"";
    const match=/mq_checkout_([a-f0-9]{8})=([a-f0-9]{64})/.exec(cookie);assert(match);
    assert(match[1]);assert(match[2]);
    assert(cookie.includes("HttpOnly"));assert(cookie.includes("Secure"));assert(/SameSite=lax/i.test(cookie));
    assert.equal(params.client_reference_id,match[1]);
    assert.equal(params.metadata?.browser_hash,createHash("sha256").update(match[2]).digest("hex"));
    assert(!JSON.stringify(params.metadata).includes(match[2]),"Raw browser nonce must stay in the HttpOnly cookie");
    assert.equal(params.metadata?.app,APP_ID);assert.equal(params.metadata?.product_id,product.id);
    assert.equal(params.success_url,`https://moneyquesteducation.com/en/parents/shop/success?session_id={CHECKOUT_SESSION_ID}&checkout=${match[1]}`);
    assert.equal(params.cancel_url,"https://moneyquesteducation.com/en/parents/shop?cancelled=1");
    assert.equal(params.adaptive_pricing?.enabled,false);assert.equal(params.automatic_tax?.enabled,false);
    assert.equal(params.ui_mode,"hosted_page");assert.equal(params.integration_identifier,"hosted_web_0001");assert.equal(params.origin_context,"web");
    assert.equal(params.line_items?.length,1);assert(params.line_items?.[0]);assert.equal(params.line_items[0].price,process.env[product.priceEnv]);assert.equal(params.line_items[0].quantity,1);
    assert(options?.idempotencyKey.includes(match[1]));assert.equal(response.headers.get("cache-control"),"no-store");
    const contract=mode==="live"?contracts.at(-1):undefined;
    if(contract){assert.equal(params.metadata?.contract_id,contract.id);assert.equal(contract.productId,product.id);assert.equal(params.metadata?.account_id,release.accountId);assert.equal(params.metadata?.terms_accepted,"yes");}
    else{assert.equal(params.metadata?.contract_id,undefined);assert.equal(params.metadata?.terms_accepted,undefined);}
    // Validate the exact metadata emitted by the route, rather than a separate
    // hand-written fixture that could conceal missing fields in real Checkout.
    const paid={id:`cs_${mode==="live"?"live":"test"}_fixture1234567890`,livemode:mode==="live",mode:params.mode,status:"complete",payment_status:"paid",currency:"gbp",amount_total:product.price,metadata:params.metadata,client_reference_id:params.client_reference_id,line_items:{data:[{quantity:1,price:{id:process.env[product.priceEnv]}}],has_more:false},payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:false}}} as unknown as Stripe.Checkout.Session;
    assert.equal(validatePaidSession(paid,{mode,contract}).id,product.id);
    assert.throws(()=>validatePaidSession({...paid,metadata:{}},{mode,contract}));
    assert.throws(()=>validatePaidSession({...paid,amount_total:1},{mode,contract}));
    const before=creates;
    for(const extra of [{instantSupply:false},{cancellationAcknowledged:false},{adultPurchaser:false},{metadata:{app:APP_ID}},...(mode==="live"?[{termsAccepted:false}]:[])])assert.equal((await module.exports.POST(request(product.id,extra))).status,400);
    assert.equal((await module.exports.POST(request(product.id,{},"https://untrusted.test"))).status,403);
    available=false;assert.equal((await module.exports.POST(request(product.id))).status,503);available=true;
    ready=false;assert.equal((await module.exports.POST(request(product.id))).status,503);ready=true;
    assert.equal(creates,before,"Rejected choices/origins/preflight must not create a session");
   }
  }
  assert.equal(creates,4);assert.equal(contracts.length,2);assert.equal(mailChecks,2);
  console.log("PASS: actual checkout route for both products in sandbox/live, emitted payment metadata passes fulfilment checks, cookie ownership binding, immutable contract association, fixed GBP configuration and rejected choices/origins/preflight. No network, charge or email.");
 }finally{shopProducts.forEach((p,i)=>{if(previous[i]===undefined)delete process.env[p.priceEnv];else process.env[p.priceEnv]=previous[i];});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
