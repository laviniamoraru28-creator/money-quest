import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import Stripe from "stripe";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {PARENT_BONUS,parentBonusMetadata,verifyParentBonus,parentBonusReady,validateParentBonus} from "../src/lib/commerce/parent-bonus";
import {saveOrderOnce,readOrder,orderToken,type Order} from "../src/lib/commerce/orders";
import {commerceConfig} from "../src/lib/commerce/config";
import {APP_ID,validatePaidSession,fulfillSession} from "../src/lib/commerce/stripe";
import {confirmationText,sendOrderConfirmation} from "../src/lib/commerce/confirmation";
import {validateContract,type Contract} from "../src/lib/commerce/release";
import {shopProducts,SHOP_TERMS_VERSION} from "../src/content/shop";
import {ParentGuideBonus} from "../src/components/ParentGuideBonus";
import {parentBonusCopy} from "../src/content/parent-bonus-copy";
import {LOCALES} from "../src/i18n/config";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
async function load(file:string,mocks:Record<string,unknown>){
 const source=await readFile(file,"utf8"),compiled=ts.transpileModule(source,{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const require=createRequire(path.resolve(file)),module={exports:{} as Record<string,unknown>};
 vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`,{Request,Response,URL,URLSearchParams,Buffer,Uint8Array,process,console})((id:string)=>id in mocks?mocks[id]:require(id.startsWith("@/")?path.resolve("src",id.slice(2)):id),module,module.exports);
 return module.exports;
}
async function main(){
 const original={...process.env},root=await mkdtemp(path.join(tmpdir(),"mq-parent-bonus-"));
 const assets=path.join(root,"assets"),orders=path.join(root,"orders"),publicRoot=path.join(root,"public");await Promise.all([assets,orders,publicRoot].map(p=>mkdir(p)));
 Object.assign(process.env,{MONEYQUEST_COMMERCE_MODE:"sandbox",MONEYQUEST_STRIPE_KEY:"rk_test_fixtureonly",MONEYQUEST_STRIPE_WEBHOOK_SECRET:"whsec_fixture",MONEYQUEST_ORDER_SIGNING_SECRET:"fixture-signing-only-12345678901234567890",MONEYQUEST_ORDER_DIRECTORY:orders,MONEYQUEST_DOWNLOAD_DIRECTORY:assets,MONEYQUEST_DOCUMENT_ROOT:publicRoot,NEXT_PUBLIC_SITE_URL:"https://moneyquesteducation.com"});
 for(const p of shopProducts)process.env[p.priceEnv]=`price_fixture_${p.id.replaceAll("-","_")}`;
 const pdf=Buffer.from("%PDF-1.7\nSynthetic integrity fixture, not the actual parent guide.\n".repeat(4)+"%%EOF\n"),sha256=createHash("sha256").update(pdf).digest("hex");
 const grant={...PARENT_BONUS,sha256,bytes:pdf.length,file:`parent-toolkit-${PARENT_BONUS.id}-${sha256}.pdf`};
 const product=shopProducts[0]!,zip=Buffer.from("PK\x03\x04synthetic purchased product archive");
 const order:Order={sessionId:"cs_test_bonusfixture123456",productId:product.id,locale:"en",amount:product.price,currency:"gbp",created:Date.now(),expires:Date.now()+600000,termsVersion:SHOP_TERMS_VERSION,instantSupply:true,cancellationAcknowledged:true,bonus:grant};
 const paid={id:order.sessionId,livemode:false,mode:"payment",status:"complete",payment_status:"paid",currency:"gbp",amount_total:product.price,metadata:{app:APP_ID,product_id:product.id,locale:"en",instant_supply:"yes",cancellation_ack:"yes",terms_version:SHOP_TERMS_VERSION,...parentBonusMetadata()},line_items:{data:[{quantity:1,price:{id:process.env[product.priceEnv]}}],has_more:false},payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:false}}} as unknown as Stripe.Checkout.Session;
 let paymentValid=true;
 try{
  await writeFile(path.join(assets,grant.file),pdf);await writeFile(path.join(assets,product.file),zip);await saveOrderOnce(orders,order);
  assert.deepEqual(await verifyParentBonus(assets,grant),pdf);
  assert.equal(await parentBonusReady(assets),false,"A fixture cannot satisfy the original illustrated guide checksum");
  assert.throws(()=>validateParentBonus({...grant,file:"../guide.pdf"}));assert.throws(()=>validateParentBonus({...grant,language:"ro"}));
  const paidService=async(id:string)=>{const session={...paid,id,payment_status:paymentValid?"paid":"unpaid"} as Stripe.Checkout.Session;validatePaidSession(session);return session;};
  const auth=await load("src/lib/commerce/download.ts",{"./stripe":{paidSession:paidService}});
  const routes=await load("src/app/api/shop/download/route.ts",{"@/lib/commerce/download":auth});
  const post=routes.POST as (request:Request)=>Promise<Response>,token=orderToken(order,commerceConfig().signing);
  const request=(value=token,asset:string|null="parent-guide",origin="https://moneyquesteducation.com")=>new Request("https://moneyquesteducation.com/api/shop/download",{method:"POST",headers:{origin,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({token:value,locale:"ro",...(asset===null?{}:{asset})})});
  const response=await post(request());assert.equal(response.status,200);assert.equal(response.headers.get("content-type"),"application/pdf");assert.equal(response.headers.get("cache-control"),"private, no-store");assert.equal(response.headers.get("x-robots-tag"),"noindex, nofollow");assert(response.headers.get("content-disposition")?.includes("Little_Minds_Smart_Money_Illustrated.pdf"));assert.deepEqual(Buffer.from(await response.arrayBuffer()),pdf);
  assert.deepEqual(Buffer.from(await (await post(request(token,null))).arrayBuffer()),zip,"Purchased product is unchanged");
  for(const value of ["",token+"x",orderToken({...order,expires:Date.now()-1000},commerceConfig().signing),orderToken({...order,sessionId:"cs_test_notpurchased12345"},commerceConfig().signing)])assert((await post(request(value))).status>=400);
  assert.equal((await post(request(token,"parent-guide","https://other.test"))).status,403);assert((await post(request(token,"../../guide.pdf"))).status>=400);
  paymentValid=false;assert((await post(request())).status>=400);assert((await post(request(token,null))).status>=400);paymentValid=true;
  const recovery=await load("src/app/api/shop/order/route.ts",{"@/lib/commerce/download":auth});
  const recover=recovery.POST as (request:Request)=>Promise<Response>;
  const recovered=await recover(new Request("https://moneyquesteducation.com/api/shop/order",{method:"POST",headers:{origin:"https://moneyquesteducation.com","Content-Type":"application/json"},body:JSON.stringify({token})}));assert.equal(recovered.status,200);assert.equal((await recovered.json()).bonusAvailable,true);
  const legacy={...order,sessionId:"cs_test_legacybonus123456",bonus:undefined};await saveOrderOnce(orders,legacy);const oldToken=orderToken(legacy,commerceConfig().signing);assert.equal((await post(request(oldToken,null))).status,200);assert((await post(request(oldToken))).status>=400,"Older purchases must not acquire an unrecorded bonus");
  await writeFile(path.join(assets,grant.file),Buffer.from("corrupt"));assert((await post(request())).status>=400);assert.equal((await post(request(token,null))).status,200);await rm(path.join(assets,grant.file));assert((await post(request())).status>=400);
  const exposed=path.join(publicRoot,"exposed.pdf");await writeFile(exposed,pdf);await symlink(exposed,path.join(assets,grant.file));await assert.rejects(verifyParentBonus(assets,grant));await rm(path.join(assets,grant.file));await writeFile(path.join(assets,grant.file),pdf);
  // Fulfil actual production orders using a Stripe SDK-shaped mock. Integrity
  // verification is injected; the original private PDF is intentionally not in Git.
  let checks=0;
  const client={checkout:{sessions:{retrieve:async(id:string)=>({...paid,id})}}} as unknown as Stripe;
  const verifyBonus=async(_directory:string,g:typeof grant=PARENT_BONUS)=>{checks++;assert.deepEqual(g,PARENT_BONUS);return pdf;};
  const id="cs_test_webhookbonus12345",[first,second]=await Promise.all([fulfillSession(id,{client,verifyBonus}),fulfillSession(id,{client,verifyBonus})]);assert.deepEqual(first,second);assert.deepEqual(first.bonus,PARENT_BONUS);assert.equal(checks,2);assert.deepEqual((await readOrder(orders,id))?.bonus,PARENT_BONUS);
  const signedClient=new Stripe("rk_test_signaturefixture"),event={id:"evt_fixture",object:"event",livemode:false,type:"checkout.session.completed",data:{object:{...paid,id}}};
  let fulfills=0;
  const webhook=await load("src/app/api/shop/webhook/route.ts",{"@/lib/commerce/stripe":{APP_ID,stripeClient:()=>signedClient,fulfillSession:async(value:string)=>{fulfills++;return fulfillSession(value,{client,verifyBonus});}}});
  const handle=webhook.POST as (request:Request)=>Promise<Response>;
  const sendEvent=async(value:unknown,wrong=false)=>{const payload=JSON.stringify(value),signature=signedClient.webhooks.generateTestHeaderString({payload,secret:wrong?"whsec_wrong":"whsec_fixture"});return handle(new Request("https://moneyquesteducation.com/api/shop/webhook",{method:"POST",headers:{"stripe-signature":signature},body:payload}));};
  assert.equal((await sendEvent(event,true)).status,400);assert.equal(fulfills,0);
  assert.equal((await sendEvent({...event,data:{object:{...event.data.object,payment_status:"unpaid"}}})).status,200);assert.equal(fulfills,0);
  for(const type of ["checkout.session.completed","checkout.session.completed","checkout.session.async_payment_succeeded"]){assert.equal((await sendEvent({...event,type})).status,200);}
  assert.equal(fulfills,3);assert.deepEqual(await readOrder(orders,id),first,"Webhook retries keep one immutable entitlement and expiry");
  const contract:Contract={id:"a".repeat(32),mode:"live",bonus:grant,accountId:"acct_fixture",productId:product.id,title:product.title,description:product.description,pages:product.pages,includes:[...product.includes],amount:product.price,currency:"gbp",priceId:process.env[product.priceEnv]!,termsVersion:SHOP_TERMS_VERSION,termsText:"Synthetic accepted terms. ".repeat(20),merchant:{name:"Fixture seller",address:"Synthetic test address",email:"support@merchant.test"},privacy:"Synthetic privacy. ".repeat(12),taxStatement:"Synthetic tax statement for tests only.",archive:{file:`${product.id}-${"a".repeat(64)}.zip`,sha256:"a".repeat(64),bytes:200},created:Date.now()};
  validateContract(contract);
  const liveOrder={...order,mode:"live" as const,sessionId:"cs_live_bonusmail1234567",contract};
  const text=confirmationText(liveOrder,"https://moneyquesteducation.com",commerceConfig().signing);assert(text.includes("Free bonus included at no extra cost: Little Minds, Smart Money"));assert(text.includes("English PDF only"));assert(text.includes("#token=cs_live_"));
  Object.assign(process.env,{MONEYQUEST_SMTP_HOST:"smtp.merchant.test",MONEYQUEST_SMTP_PORT:"465",MONEYQUEST_SMTP_USER:"fixture",MONEYQUEST_SMTP_PASSWORD:"not-a-real-password",MONEYQUEST_SMTP_FROM:"orders@merchant.test"});
  let emails=0;const send=async(mail:{text:string;to:string})=>{emails++;assert(mail.text.includes("Little Minds, Smart Money"));return {accepted:[mail.to],rejected:[]};};
  const config={...commerceConfig(),mode:"live" as const};
  await Promise.all([sendOrderConfirmation(config,liveOrder,"buyer@merchant.test",send),sendOrderConfirmation(config,liveOrder,"buyer@merchant.test",send)]);assert.equal(emails,1,"No duplicate bonus email on retry");
  const liveSession={...paid,id:liveOrder.sessionId,livemode:true,metadata:{...paid.metadata,...parentBonusMetadata(),bonus_sha256:grant.sha256,bonus_version:grant.version,contract_id:contract.id,account_id:contract.accountId,terms_accepted:"yes"}} as Stripe.Checkout.Session;
  validatePaidSession(liveSession,{mode:"live",contract});assert.throws(()=>validatePaidSession({...liveSession,metadata:{...liveSession.metadata,bonus_sha256:"f".repeat(64)}},{mode:"live",contract}));
  for(const locale of LOCALES){const copy=parentBonusCopy[locale];assert.deepEqual(Object.keys(copy),Object.keys(parentBonusCopy.en));for(const value of Object.values(copy)){assert(value.trim());assert(!value.includes("\uFFFD"));}
   const html=renderToStaticMarkup(React.createElement(ParentGuideBonus,{locale}));assert(html.includes(copy.englishOnly.replaceAll("&","&amp;").replaceAll("'","&#x27;")));assert(!html.includes('action="/api/shop/download"'));assert(!html.includes(PARENT_BONUS.sha256));
   const entitled=renderToStaticMarkup(React.createElement(ParentGuideBonus,{locale,token:"synthetic-token"}));assert(entitled.includes('value="parent-guide"'));assert(entitled.includes(copy.download.replaceAll("&","&amp;").replaceAll("'","&#x27;")));}
  console.log("PASS: paid-only product and PDF route bytes, invalid/missing/expired tokens, origin and asset restrictions, unpaid/revoked payments, missing/corrupt/public-symlink PDF refusal, legacy order preservation, recovery entitlement verification, concurrent/webhook-retry immutable grants, one confirmation email, nine-language bonus SSR and English-only disclosure. All transactions/mail mocked; no real charges or recipients.");
 }finally{for(const key of Object.keys(process.env))if(!(key in original))delete process.env[key];Object.assign(process.env,original);await rm(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
