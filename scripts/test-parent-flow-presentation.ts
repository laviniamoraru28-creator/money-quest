import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import {ParentResourceGuide} from "../src/components/ParentResourceGuide";
import {ShopCheckout} from "../src/components/ShopCheckout";
import {ShopOrder} from "../src/components/ShopOrder";
import {parentGuideCopy,PARENT_GUIDE_SOURCES,PARENT_GUIDE_CHECKED} from "../src/content/parent-guide-copy";
import {shopFlowCopy} from "../src/content/shop-flow-copy";
import {shopErrorKey,validatedCheckoutUrl} from "../src/lib/commerce/client-messages";
import {parentGuidePresentation,shopFlowPresentation,publicParentLocale} from "../src/lib/i18n/parent-presentation";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import {LOCALES,ACTIVE_LOCALES,type Locale} from "../src/i18n/config";
import {shopProducts,SHOP_TERMS_VERSION} from "../src/content/shop";
import manifest from "../src/content/translations/parent-flow.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.deepEqual(manifest.locales,LOCALES);
let strings=0;
for(const [name,copy] of [["guide",parentGuideCopy],["flow",shopFlowCopy]] as const){
 strings+=Object.keys(copy.en).length;assert.equal(manifest.sourceHashes[name],sourceFingerprint(copy.en));
 for(const locale of LOCALES){
  assert.deepEqual(Object.keys(copy[locale]).sort(),Object.keys(copy.en).sort());
  for(const [key,value] of Object.entries(copy[locale])){
   assert(value.trim().length>0);assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(value));
   const source=(copy.en as Record<string,string>)[key]!;
   assert.deepEqual(value.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[],`${locale}/${name}/${key}`);
   if(locale!=="en")assert.notEqual(value,source,`${locale}/${name}/${key}: translated copy`);
  }
 }
}
assert.equal(strings,manifest.stringsPerLocale);assert.equal(strings*8,manifest.translatedStrings);
const escape=(text:string)=>text.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
function render(locale:Locale,element:React.ReactElement){const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:element}));}
let renders=0;
for(const locale of LOCALES){
 const guide=parentGuidePresentation(locale),html=render(locale,React.createElement(ParentResourceGuide,guide)),copy=guide.copy;
 renders++;
 for(const text of [copy.title,copy.intro,copy.step3,copy.sendBody,copy.evidenceBody,copy.sampleBody,copy.activitySample,copy.journalSample,copy.freeBody])assert(html.includes(escape(text)),`${locale}: ${text}`);
 for(const level of ["Explorer","Builder","Strategist"])assert(copy.levelsBody.includes(level));
 assert(copy.printNote.includes("A4"));assert(copy.printNote.includes("100"));
 assert(html.includes('href="/resources/samples/free-family-sample-en.pdf"'));assert(html.includes('href="/resources/samples/free-journal-week-one-en.pdf"'));
 for(const source of PARENT_GUIDE_SOURCES){assert(html.includes(escape(source.title)));assert(html.includes(escape(source.url)));assert(html.includes(escape(copy[source.id])));}
 const flow=shopFlowPresentation(locale);
 for(const enabled of [false,true]){
  const markup=render(locale,React.createElement(ShopCheckout,{productId:"family-adventure-pack",enabled,...flow}));renders++;
  assert(markup.includes(escape(enabled?flow.copy.testOnly:flow.copy.notOpen)));
  assert(markup.includes(escape(enabled?flow.copy.continueTest:flow.copy.closedButton)));
  const inputs=markup.match(/<input\b[^>]*>/g)||[];assert.equal(inputs.length,enabled?3:0);
  for(const input of inputs){assert(input.includes('type="checkbox"'));assert(!/\bchecked(?:=|\s|>)/.test(input),"Consent boxes are separate and unchecked");}
  assert(markup.includes('disabled=""'),"No checkout until all required choices are affirmed");
  if(enabled)for(const text of [flow.copy.adult,flow.copy.instant,flow.copy.ack])assert(markup.includes(escape(text)));
 }
 for(const recovery of [false,true]){const markup=render(locale,React.createElement(ShopOrder,{recovery,...flow}));renders++;assert(markup.includes(escape(recovery?flow.copy.recoveryPending:flow.copy.checking)));assert(!markup.includes('name="token"'),"No token or download action before a browser-held reference is obtained");}
 assert.equal(publicParentLocale(locale),"en");
}
assert.equal(renders,45);assert.equal(PARENT_GUIDE_CHECKED,"2026-10-28");
assert.equal(publicParentLocale("unknown"),"en");assert.deepEqual(ACTIVE_LOCALES,["en"]);
for(const [code,key] of Object.entries({purchases_closed:"checkoutClosed",checkout_use_site:"checkoutUseSite",checkout_choices:"checkoutChoices",checkout_adult:"checkoutAdult",product_unavailable:"productUnavailable",checkout_unavailable:"checkoutUnavailable",order_use_site:"orderUseSite",order_not_ready:"orderNotReady"}))assert.equal(shopErrorKey({code,message:"RAW DIAGNOSTIC"},"checkoutUnavailable"),key);
assert.equal(shopErrorKey({message:"Purchases are not open yet. Free samples are available."},"checkoutUnavailable"),"checkoutClosed");
assert.equal(shopErrorKey({message:"Order not ready or this browser cannot verify it. Retry after payment completes; do not pay again."},"orderUnavailable"),"orderNotReady");
assert.equal(shopErrorKey({code:"toString",message:"RAW DIAGNOSTIC"},"orderUnavailable"),"orderUnavailable");assert.equal(shopErrorKey(null,"checkoutUnavailable"),"checkoutUnavailable");
assert.equal(validatedCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_fixture"),"https://checkout.stripe.com/c/pay/cs_test_fixture");
for(const url of [null,"bad","javascript:alert(1)","http://checkout.stripe.com/pay","https://checkout.stripe.com.evil.test/pay","https://checkout.stripe.com@evil.test/pay","https://user:password@checkout.stripe.com/pay","https://checkout.stripe.com:444/pay"])assert.throws(()=>validatedCheckoutUrl(url));
assert(shopProducts.every(product=>!product.releaseReady));assert.deepEqual(shopProducts.map(product=>product.price),[599,799]);assert.equal(SHOP_TERMS_VERSION,"2026-10-28-draft-v1");
console.log("PASS: 540 parent-guide/shop-flow UI strings and 45 actual component SSR renders across nine locales, source/PDF/level preservation, separate unchecked consents, sandbox/English-file disclosures, structured/legacy errors, hosted-checkout URL restrictions and public/release gates. Catalogue/terms/receipts/PDFs and non-English browser/legal/editorial review remain pending.");
