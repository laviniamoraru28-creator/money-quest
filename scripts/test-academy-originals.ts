import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import manifest from "../content/printables/academy-originals.json";
import {shopProducts} from "../src/content/shop";
import {shopCatalogueCopy} from "../src/content/shop-catalogue-copy";
import {shopCataloguePresentation} from "../src/lib/i18n/shop-catalogue-presentation";
import {LOCALES} from "../src/i18n/config";
const product=shopProducts[0];
assert.equal(product.id,manifest.productId);
assert.equal(product.file,manifest.archive.file);
assert.equal(product.releaseReady,false);
assert.deepEqual(manifest.targetLocales,LOCALES);
assert.deepEqual(manifest.availableLocales,["en"]);
assert.equal(manifest.worksheets.reduce((sum,item)=>sum+item.pages,0),60);
for(const locale of LOCALES){
 const p=shopCataloguePresentation(locale).products[0]!;
 assert.equal(p.sample,manifest.sample.file,"Do not serve an old translated sample for the replacement pack");
 assert.equal(p.description,shopCatalogueCopy[locale].products[product.id].description);
 assert(p.description.includes("60"));assert(p.pages.includes("60"));
}
const test=spawnSync("python3",["scripts/test-academy-originals.py"],{stdio:"inherit"});
assert.equal(test.status,0);
console.log("PASS: unchanged private source packaging, deterministic verified archive, tamper and public-path refusal, nine honest storefront descriptions and English replacement sample.");
