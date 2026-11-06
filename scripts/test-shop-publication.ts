import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import {ShopCatalogue} from "../src/components/ShopCatalogue";
import {shopCataloguePresentation} from "../src/lib/i18n/shop-catalogue-presentation";
import {shopProducts} from "../src/content/shop";
import {publiclyListedProductIds} from "../src/content/shop-publication";
import {LOCALES} from "../src/i18n/config";
(globalThis as typeof globalThis & {React:typeof React}).React=React;

assert.equal(shopProducts.length,2,"Both products stay defined in code for a future release");
assert.deepEqual([...publiclyListedProductIds],["adventure-journal"],"Only the completed journal is publicly listed this release");

for(const locale of LOCALES){
 const presentation=shopCataloguePresentation(locale);
 const visible=shopProducts.map((product,index)=>publiclyListedProductIds.has(product.id)?index:-1).filter(index=>index>=0);
 const products=visible.map(index=>presentation.products[index]!);
 assert.equal(products.length,1);assert.equal(products[0]!.id,"adventure-journal");
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(ShopCatalogue,{...presentation,products,available:[false]})}));
 assert(!html.includes("family-adventure-pack"),`${locale}: unpublished product id leaked into markup`);
 assert(!html.includes("free-academy-activities-en.pdf"),`${locale}: unpublished product's sample link leaked into markup`);
 assert(html.includes('id="adventure-journal"'));
}
console.log("PASS: only the completed journal reaches the public shop catalogue; the Academy Activity Pack's code, copy and translations stay defined but unrendered.");
