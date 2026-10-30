import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,cp,copyFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {spawnSync} from "node:child_process";
import Stripe from "stripe";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {validateRelease,validateContract,archiveName,verifyArchive,saveContract,readContract,type Release,type Contract} from "../src/lib/commerce/release";
import {commerceConfig,privateDirectory,canCheckout} from "../src/lib/commerce/config";
import {APP_ID,validatePaidSession,verifyLiveStripeConfiguration,fulfillSession} from "../src/lib/commerce/stripe";
import {saveOrderOnce,readOrder,orderToken,parseOrderToken,validSessionId,type Order} from "../src/lib/commerce/orders";
import {confirmationText,sendOrderConfirmation,confirmationSent} from "../src/lib/commerce/confirmation";
import {shopProducts} from "../src/content/shop";
import {storefrontCatalogue,storefrontFlow} from "../src/lib/commerce/storefront";
import {orderErrorHtml,orderErrorCopy,publicOrderErrorLocale} from "../src/lib/commerce/order-error";
import {LOCALES} from "../src/i18n/config";
import {siteDescriptions} from "../src/content/seo-descriptions";
import {ShopCatalogue} from "../src/components/ShopCatalogue";
import {LiveShopTerms,LiveShopPrivacy} from "../src/components/ShopMerchant";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
async function main(){
 const original={...process.env},root=await mkdtemp(path.join(tmpdir(),"mq-live-fixture-"));
 const orders=path.join(root,"orders"),assets=path.join(root,"assets"),publicRoot=path.join(root,"public");await Promise.all([orders,assets,publicRoot].map(p=>mkdir(p)));
 const bytes=Buffer.from("UEsDBBQAAAAAAJRMXl392CNyQgAAAEIAAAANAAAAVEVTVC1PTkxZLnR4dFN5bnRoZXRpYyBhcmNoaXZlIGZvciBsb2NhbCB0ZXN0cyBvbmx5LiBOb3QgYSBNb25leSBRdWVzdCBwcm9kdWN0LlBLAQIUAxQAAAAAAJRMXl392CNyQgAAAEIAAAANAAAAAAAAAAAAAACAAQAAAABURVNULU9OTFkudHh0UEsFBgAAAAABAAEAOwAAAG0AAAAAAA==","base64"),hash=createHash("sha256").update(bytes).digest("hex");
 const release:Release={schema:1,accountId:"acct_fixture",merchant:{name:"Synthetic fixture merchant",address:"Synthetic test address, not an actual seller",email:"support@merchant.test"},terms:{version:"2026-10-30-v1",text:"Fixture terms, not for public use. ".repeat(12)},privacy:"Synthetic policy for local integration checks only. ".repeat(5),taxStatement:"Synthetic inclusive-price decision, not a tax assessment.",products:{"family-adventure-pack":{sha256:hash,bytes:bytes.length},"adventure-journal":{sha256:hash,bytes:bytes.length}}};
 const releasePath=path.join(root,"release.json");await writeFile(releasePath,JSON.stringify(release));
 Object.assign(process.env,{MONEYQUEST_COMMERCE_MODE:"live",MONEYQUEST_STRIPE_KEY:"rk_live_fixtureonly",MONEYQUEST_STRIPE_WEBHOOK_SECRET:"whsec_fixtureonly",MONEYQUEST_ORDER_SIGNING_SECRET:"unit-fixture-signing-secret-only-1234567890",MONEYQUEST_ORDER_DIRECTORY:orders,MONEYQUEST_DOWNLOAD_DIRECTORY:assets,MONEYQUEST_DOCUMENT_ROOT:publicRoot,MONEYQUEST_LIVE_RELEASE_FILE:releasePath,MONEYQUEST_SMTP_HOST:"smtp.merchant.test",MONEYQUEST_SMTP_PORT:"465",MONEYQUEST_SMTP_USER:"fixture",MONEYQUEST_SMTP_PASSWORD:"fixture-not-a-real-password",MONEYQUEST_SMTP_FROM:"orders@merchant.test",MONEYQUEST_STRIPE_FAMILY_PRICE_ID:"price_fixture_family",MONEYQUEST_STRIPE_JOURNAL_PRICE_ID:"price_fixture_journal",NEXT_PUBLIC_SITE_URL:"https://moneyquesteducation.com"});
 const config=commerceConfig(),product=shopProducts[0];
 const contract:Contract={id:"a".repeat(32),mode:"live",accountId:release.accountId,productId:product.id,title:product.title,description:product.description,pages:product.pages,includes:[...product.includes],amount:599,currency:"gbp",priceId:"price_fixture_family",termsVersion:release.terms.version,termsText:release.terms.text,merchant:release.merchant,privacy:release.privacy,taxStatement:release.taxStatement,archive:{file:archiveName(product,hash),sha256:hash,bytes:bytes.length},created:Date.now()};
 let session={id:"cs_live_fixture1234567890",livemode:true,mode:"payment",status:"complete",payment_status:"paid",currency:"gbp",amount_total:599,metadata:{app:APP_ID,product_id:product.id,locale:"en",instant_supply:"yes",cancellation_ack:"yes",terms_version:contract.termsVersion,contract_id:contract.id,account_id:release.accountId,terms_accepted:"yes"},line_items:{data:[{quantity:1,price:{id:contract.priceId}}],has_more:false},customer_details:{email:"buyer@merchant.test"},payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:false}}};
 let account={id:release.accountId,charges_enabled:true,payouts_enabled:true},price={id:contract.priceId,livemode:true,active:true,type:"one_time",currency:"gbp",unit_amount:599,tax_behavior:"inclusive"};
 const requests:string[]=[];
 const server=createServer((req,res)=>{requests.push(req.url??"");res.setHeader("Content-Type","application/json");if(req.url==="/v1/account")res.end(JSON.stringify(account));else if(req.url?.startsWith("/v1/prices/"))res.end(JSON.stringify(price));else if(req.url?.startsWith("/v1/checkout/sessions/"))res.end(JSON.stringify(session));else{res.statusCode=404;res.end("{}");}});
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));const address=server.address();assert(address&&typeof address!=="string");
 const client=new Stripe("rk_test_loopbackfixture",{host:"127.0.0.1",port:address.port,protocol:"http",maxNetworkRetries:0});
 try{
  assert.equal(config.mode,"live");assert.equal(config.orders,path.join(orders,"live"));
  assert.throws(()=>validateRelease({...release,merchant:{...release.merchant,email:"seller@example.invalid"}}));assert.throws(()=>validateRelease({...release,terms:{...release.terms,version:"draft-v1"}}));
  assert.throws(()=>validateRelease({...release,products:{}}));assert.throws(()=>privateDirectory(path.join(publicRoot,"paid")));
  const link=path.join(root,"public-link");await symlink(publicRoot,link);assert.throws(()=>privateDirectory(link));
  await symlink(publicRoot,path.join(orders,"live"));assert.throws(()=>commerceConfig());await rm(path.join(orders,"live"));
  const publicArchive=path.join(publicRoot,"public-fixture.zip");await writeFile(publicArchive,bytes);const archiveLink=path.join(assets,archiveName(product,hash));await symlink(publicArchive,archiveLink);assert.equal(await canCheckout(product),false);await rm(archiveLink);
  for(const key of ["sk_live_fake","rk_test_fake"]){process.env.MONEYQUEST_STRIPE_KEY=key;assert.throws(()=>commerceConfig());}process.env.MONEYQUEST_STRIPE_KEY="rk_live_fixtureonly";
  assert.equal(await canCheckout(product),false);for(const p of shopProducts)await writeFile(path.join(assets,archiveName(p,hash)),bytes);assert.equal(await canCheckout(product),true);
  assert.deepEqual(await verifyArchive(assets,contract.archive.file,contract.archive),bytes);
  await assert.rejects(verifyArchive(assets,"../private.zip",contract.archive));await assert.rejects(verifyArchive(assets,contract.archive.file,{...contract.archive,sha256:"0".repeat(64)}));
  await saveContract(config.orders,contract);assert.deepEqual(await readContract(config.orders,contract.id),contract);await assert.rejects(saveContract(config.orders,contract));assert.throws(()=>validateContract({...contract,archive:{...contract.archive,file:"../bad.zip"}}));
  await verifyLiveStripeConfiguration(config,product.id,client);
  account={...account,payouts_enabled:false};await assert.rejects(verifyLiveStripeConfiguration(config,product.id,client));account={...account,payouts_enabled:true};
  price={...price,unit_amount:1};await assert.rejects(verifyLiveStripeConfiguration(config,product.id,client));price={...price,unit_amount:599};
  price={...price,tax_behavior:"exclusive"};await assert.rejects(verifyLiveStripeConfiguration(config,product.id,client));price={...price,tax_behavior:"inclusive"};
  const validate=(v:unknown)=>validatePaidSession(v as Stripe.Checkout.Session,{mode:"live",contract});assert.equal(validate(session).id,product.id);
  assert.throws(()=>validatePaidSession(session as unknown as Stripe.Checkout.Session));
  for(const change of [{livemode:false},{id:"cs_test_fixture1234567890"},{amount_total:1},{currency:"eur"},{payment_status:"unpaid"},{metadata:{...session.metadata,terms_accepted:"no"}},{metadata:{...session.metadata,contract_id:"b".repeat(32)}},{payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:1,disputed:false}}},{payment_intent:{status:"succeeded",latest_charge:{refunded:false,amount_refunded:0,disputed:true}}}])assert.throws(()=>validate({...session,...change}));
  let sent=0,lastText="";
  const send=async(mail:{text:string;messageId:string;to:string})=>{sent++;lastText=mail.text;assert.equal(mail.to,"buyer@merchant.test");assert(mail.messageId.startsWith("<mq-"));return {accepted:[mail.to],rejected:[]};};
  // A webhook-driven fulfilment does not need a returning browser or cookie.
  const order=await fulfillSession(session.id,{client,send});assert.equal(sent,1);assert.equal(order.mode,"live");assert(await confirmationSent(config.orders,order.sessionId));
  assert(lastText.includes(contract.termsText));assert(lastText.includes(contract.privacy));assert(lastText.includes(contract.merchant.address));assert(lastText.includes("£5.99 GBP"));assert(lastText.includes("#token=cs_live_"));assert(!lastText.includes("SANDBOX"));
  await fulfillSession(session.id,{client,send});assert.equal(sent,1,"Duplicate event must not send another confirmation");assert.deepEqual(await readOrder(config.orders,order.sessionId),order);
  const token=orderToken(order,config.signing);assert.equal(parseOrderToken(token,config.signing).id,order.sessionId);assert(!validSessionId(order.sessionId,"sandbox"));assert.throws(()=>parseOrderToken(token+"bad",config.signing));
  // Concurrent duplicate events must converge to one original order and one email.
  const duplicate={...order,sessionId:"cs_live_concurrent12345678"};const [left,right]=await Promise.all([saveOrderOnce(config.orders,duplicate),saveOrderOnce(config.orders,{...duplicate,created:duplicate.created+1})]);assert.deepEqual(left,right);
  await Promise.all([sendOrderConfirmation(config,duplicate,"buyer@merchant.test",send),sendOrderConfirmation(config,duplicate,"buyer@merchant.test",send)]);assert.equal(sent,2);
  const retry:Order={...order,sessionId:"cs_live_retryfixture123456"};await saveOrderOnce(config.orders,retry);
  await assert.rejects(sendOrderConfirmation(config,retry,"buyer@merchant.test",async()=>{throw new Error("fixture SMTP failure");}));assert.equal(await confirmationSent(config.orders,retry.sessionId),false);
  await sendOrderConfirmation(config,retry,"buyer@merchant.test",send);assert(await confirmationSent(config.orders,retry.sessionId));assert.equal(sent,3);
  await assert.rejects(sendOrderConfirmation(config,{...retry,sessionId:"cs_live_rejected123456789"},"buyer@merchant.test",async()=>({accepted:[],rejected:["buyer@merchant.test"]})));
  const stored=await readFile(path.join(config.orders,order.sessionId+".json"),"utf8");assert(!stored.includes("buyer@merchant.test"));assert(!stored.includes(process.env.MONEYQUEST_SMTP_PASSWORD!));assert(!confirmationText(order,config.origin,config.signing).includes(process.env.MONEYQUEST_STRIPE_KEY!));
  for(const locale of LOCALES){
   const texts=orderErrorCopy[locale];assert.deepEqual(Object.keys(texts),Object.keys(orderErrorCopy.en));
   for(const kind of ["download","receipt"] as const){const h=orderErrorHtml(locale,kind,"support@merchant.test");assert(h.includes(`lang="${locale}"`));assert(h.includes(texts[kind]));assert(h.includes(`href="/${locale}/parents/shop"`));assert(!h.includes("<script"));assert(!h.includes("cs_live_"));assert(h.includes("noindex,nofollow"));}
   for(const value of Object.values(texts)){assert(value.trim());assert.equal(value,value.normalize("NFC"));}
   assert.equal(publicOrderErrorLocale(locale),"en");assert(siteDescriptions[locale].trim());assert(!siteDescriptions[locale].includes("ever"));
  }
  const injected=orderErrorHtml("en","download",'bad"><script>alert(1)</script>');assert(!injected.includes("<script>"));assert(injected.includes("&lt;script&gt;"));
  // Later release text cannot rewrite the contract attached to an existing order.
  release.terms.text="Changed later. ".repeat(30);await writeFile(releasePath,JSON.stringify(release));assert(confirmationText(order,config.origin,config.signing).includes(contract.termsText));
  const messages=JSON.parse(await readFile("messages/en.json","utf8"));const render=(children:React.ReactElement)=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:"en",messages,timeZone:"Europe/London",children}));
  const p=storefrontCatalogue("en",true),html=render(React.createElement(ShopCatalogue,{...p,available:[true,true]}));assert(html.includes("Continue to secure payment"));assert(!html.includes("Continue to test card payment"));assert(!html.includes("Prices below are proposed"));assert.equal((html.match(/<input\b/g)||[]).length,8);assert(!/\bchecked=""/.test(html));assert(html.includes("digital download terms (opens a new tab)"));
  for(const component of [LiveShopTerms,LiveShopPrivacy]){const h=render(React.createElement(component,{release}));assert(h.includes(release.merchant.name));assert(h.includes(release.merchant.email));}
  assert(!storefrontFlow("en",true).copy.verified.includes("Sandbox"));assert.throws(()=>storefrontFlow("ro",true),/not released/);
  // Revalidation revokes a later refunded payment before it can be fulfilled again.
  session={...session,payment_intent:{status:"succeeded",latest_charge:{refunded:true,amount_refunded:599,disputed:false}}};await assert.rejects(fulfillSession(session.id,{client,send}));assert.equal(sent,3);
  // Rehearse the exact source subset included with the Namecheap admin commands.
  const pack=path.join(root,"package");await mkdir(path.join(pack,"src","lib"),{recursive:true});await mkdir(path.join(pack,"src","content"));await mkdir(path.join(pack,"scripts"));
  await cp("src/i18n",path.join(pack,"src","i18n"),{recursive:true});await cp("src/lib/commerce",path.join(pack,"src","lib","commerce"),{recursive:true});await copyFile("src/content/shop.ts",path.join(pack,"src","content","shop.ts"));
  await copyFile("scripts/shop-preflight.ts",path.join(pack,"scripts","shop-preflight.ts"));await copyFile("tsconfig.json",path.join(pack,"tsconfig.json"));await copyFile("package.json",path.join(pack,"package.json"));await symlink(path.join(process.cwd(),"node_modules"),path.join(pack,"node_modules"));
  const packageJson=JSON.parse(await readFile("package.json","utf8"));assert(packageJson.dependencies.tsx,"Host commands require tsx in production dependencies");
  const check=spawnSync(process.execPath,["--import","tsx","scripts/shop-preflight.ts"],{cwd:pack,env:{...process.env,MONEYQUEST_COMMERCE_MODE:"off"},encoding:"utf8"});assert.equal(check.status,1);assert(check.stdout.includes("BLOCKED: mode-matched private merchant configuration"));assert(!check.stdout.includes("rk_live_"));assert(!check.stdout.includes("fixture-not-a-real-password"));
  assert(requests.some(p=>p.startsWith("/v1/checkout/sessions/")));assert(requests.includes("/v1/account"));
  console.log("PASS: live/test separation, restricted-key and private/symlink paths, final-release parsing, content-addressed ZIP integrity, immutable contracts, actual Stripe SDK loopback account/price/paid/refund checks, webhook-style no-browser fulfilment, retry/concurrent/idempotent confirmation, no email in order JSON, tokens and actual live storefront/terms/privacy SSR. Synthetic only; no real Stripe payment, SMTP recipient or live account validation.");
 }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));for(const k of Object.keys(process.env))if(!(k in original))delete process.env[k];Object.assign(process.env,original);await rm(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1});
