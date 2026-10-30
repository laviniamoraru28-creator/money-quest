import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import {ShopCatalogue} from "../src/components/ShopCatalogue";
import {shopCatalogueCopy} from "../src/content/shop-catalogue-copy";
import {shopCataloguePresentation,shopCatalogueProductSource} from "../src/lib/i18n/shop-catalogue-presentation";
import {publicParentLocale} from "../src/lib/i18n/parent-presentation";
import {sourceFingerprint,assertTranslationShape} from "../src/lib/i18n/content-translations";
import {shopProducts,SHOP_TERMS_VERSION} from "../src/content/shop";
import {LOCALES,ACTIVE_LOCALES,REGIONAL_LOCALES} from "../src/i18n/config";
import manifest from "../src/content/translations/shop-catalogue.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.deepEqual(manifest.locales,LOCALES);assert.equal(manifest.sourceHash,sourceFingerprint(shopCatalogueCopy.en));
assert.equal(manifest.translatedStrings,manifest.stringsPerLocale*(LOCALES.length-1));
const escape=(text:string)=>text.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
function checkStrings(source:unknown,value:unknown,locale:string,path="catalogue"){
 if(typeof source==="string"){
  assert.equal(typeof value,"string");const text=value as string;
  assert(text.trim());assert.equal(text,text.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(text));
  assert.deepEqual(text.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[]);
  if(locale!=="en")assert.notEqual(text,source,`${locale}/${path}`);
 }else if(Array.isArray(source)){assert(Array.isArray(value));source.forEach((item,i)=>checkStrings(item,value[i],locale,`${path}/${i}`));}
 else if(source&&typeof source==="object")for(const [key,item] of Object.entries(source))checkStrings(item,(value as Record<string,unknown>)[key],locale,`${path}/${key}`);
}
let renders=0;
for(const locale of LOCALES){
 const edition=shopCatalogueCopy[locale],presentation=shopCataloguePresentation(locale);
 assert.equal(assertTranslationShape(shopCatalogueCopy.en,edition,locale),manifest.stringsPerLocale);checkStrings(shopCatalogueCopy.en,edition,locale);
 for(const level of ["Explorer","Builder","Strategist"])assert(edition.copy.responseBody.includes(level));
 for(const text of ["A4","PDF","ZIP"])assert(edition.copy.format.includes(text));
 for(const text of ["CAST","3.0","EEF","MoneyHelper"])assert(edition.copy.evidence.includes(text));
 for(const [index,source] of shopProducts.entries()){
  const p=presentation.products[index]!,text=edition.products[source.id];
  assert.equal(manifest.products[source.id],sourceFingerprint(shopCatalogueProductSource(source)));
  const en=shopCatalogueCopy.en.products[source.id];assert.deepEqual({title:en.title,description:en.description,pages:en.pages,includes:en.includes},shopCatalogueProductSource(source));
  assert.equal(p.id,source.id);assert.equal(p.image,source.image);assert.equal(p.sample,source.sample);
  assert.deepEqual(Object.keys(p).sort(),["id","image","sample","title","description","pages","includes","imageAlt","sampleLabel","priceLabel"].sort());
  assert.equal(p.priceLabel,new Intl.NumberFormat(REGIONAL_LOCALES[locale],{style:"currency",currency:"GBP"}).format(source.price/100));
  assert(text.sampleLabel.includes("PDF"));
  if(source.id==="family-adventure-pack"){
   assert(text.description.includes("20"));assert(text.pages.includes("20"));assert(text.includes[1]!.includes("40"));
   if(locale!=="en"){assert(text.includes[2]!.includes("7"));}
   assert(text.sampleLabel.includes("3"));
  }else{assert(text.description.includes("12"));assert(text.pages.includes("39"));assert(text.pages.includes("A4"));assert(text.includes[1]!.includes("25 mm"));assert(text.includes[2]!.includes("12"));}
 }
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 for(const enabled of [false,true]){
  const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(ShopCatalogue,{...presentation,available:[enabled,enabled]})}));renders++;
  for(const text of Object.values(edition.copy))assert(html.includes(escape(text)),`${locale}: ${text}`);
  for(const product of presentation.products){
   for(const text of [product.title,product.description,product.pages,...product.includes,product.imageAlt,product.sampleLabel,product.priceLabel])assert(html.includes(escape(text)),`${locale}: ${text}`);
   assert(html.includes(`href="${product.sample}"`));assert(html.includes(`id="${product.id}"`));
  }
  assert.equal((html.match(/<article\b/g)||[]).length,2);assert.equal((html.match(/<details\b/g)||[]).length,4);
  assert(html.includes('href="#free-preview"'));assert(html.includes(`href="/${locale}/parents/shop/terms"`));
  assert(html.includes(escape(enabled?presentation.flowCopy.testOnly:presentation.flowCopy.notOpen)));
  const inputs=html.match(/<input\b[^>]*>/g)||[];assert.equal(inputs.length,enabled?6:0);
  for(const input of inputs)assert(!/\bchecked(?:=|\s|>)/.test(input));
 }
 assert.equal(publicParentLocale(locale),"en");
}
assert.equal(renders,18);
const title=shopCatalogueCopy.en.copy.title;
try{shopCatalogueCopy.en.copy.title="Changed source";assert.throws(()=>shopCataloguePresentation("ro"),/Stale shop catalogue/);}finally{shopCatalogueCopy.en.copy.title=title;}
const product=shopProducts[0],description=product.description;
try{Reflect.set(product,"description","Changed source");assert.throws(()=>shopCataloguePresentation("ro"),/Stale shop product/);}finally{Reflect.set(product,"description",description);}
const draft=shopCatalogueCopy.ro.products[product.id];
try{Object.defineProperty(draft,"price",{value:1,enumerable:true,configurable:true});assert.throws(()=>shopCataloguePresentation("ro"),/unexpected fields/);}finally{Reflect.deleteProperty(draft,"price");}
const missing=draft.includes.pop()!;
try{assert.throws(()=>shopCataloguePresentation("ro"),/array structure/);}finally{draft.includes.push(missing);}
assert.deepEqual(ACTIVE_LOCALES,["en"]);assert(shopProducts.every(p=>!p.releaseReady));assert.deepEqual(shopProducts.map(p=>p.price),[599,799]);assert.equal(SHOP_TERMS_VERSION,"2026-10-28-draft-v1");
console.log("PASS: 468 catalogue strings and 18 actual SSR renders across nine locales; source-staleness/shape/extra-commerce-field refusal, canonical product fields, quantities, regional GBP display, sample links, FAQ, image alt, closed/sandbox controls and public gates. Non-English browser/editorial review and translated PDFs remain pending.");
