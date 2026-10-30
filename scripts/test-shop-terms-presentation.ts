import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import {ShopTerms} from "../src/components/ShopTerms";
import {shopTermsCopy} from "../src/content/shop-terms-copy";
import {shopTermsPresentation,publicParentLocale} from "../src/lib/i18n/parent-presentation";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {SHOP_TERMS_VERSION,shopProducts} from "../src/content/shop";
import manifest from "../src/content/translations/shop-terms.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.deepEqual(manifest.locales,LOCALES);
assert.equal(manifest.sourceHash,sourceFingerprint(shopTermsCopy.en));
assert.equal(manifest.consentVersion,SHOP_TERMS_VERSION);
assert.equal(manifest.stringsPerLocale,Object.keys(shopTermsCopy.en).length);
assert.equal(manifest.translatedStrings,manifest.stringsPerLocale*(LOCALES.length-1));
const escape=(text:string)=>text.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
for(const locale of LOCALES){
 const props=shopTermsPresentation(locale),copy=props.copy;
 assert.deepEqual(Object.keys(copy).sort(),Object.keys(shopTermsCopy.en).sort());
 for(const [key,value] of Object.entries(copy)){
  const source=shopTermsCopy.en[key as keyof typeof copy];
  assert(value.trim());assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(value));
  assert.deepEqual(value.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[]);
  if(locale!=="en")assert.notEqual(value,source);
 }
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(ShopTerms,props)}));
 for(const value of Object.values(copy))assert(html.includes(escape(value.replace("{version}",SHOP_TERMS_VERSION))),`${locale}: ${value}`);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<h2\b/g)||[]).length,6);
 assert(html.includes(`href="/${locale}/parents/shop"`));assert(html.includes(`href="/${locale}/privacy"`));
 assert(!html.includes("{version}"));assert(!html.includes("<form"));assert(!html.includes("<input"));
 for(const literal of ["PDF","ZIP"])assert(copy.body1.includes(literal));
 assert(copy.body4.includes("Stripe"));assert(copy.body5.includes("90"));
 assert.equal(publicParentLocale(locale),"en");
}
assert.equal(publicParentLocale("unknown"),"en");assert.deepEqual(ACTIVE_LOCALES,["en"]);
assert(shopProducts.every(p=>!p.releaseReady));assert.deepEqual(shopProducts.map(p=>p.price),[599,799]);
console.log("PASS: 144 digital-download terms strings and nine actual component SSR renders, English source/consent-version guards, six sections, locale links, format/90-day preservation and unchanged release gates. Legal adaptation, native editorial review and non-English browser QA remain pending.");
