import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {PDFDocument} from "pdf-lib";
import manifest from "../content/printables/journal-original.json";
import {shopProducts} from "../src/content/shop";
import {shopCataloguePresentation} from "../src/lib/i18n/shop-catalogue-presentation";
import {LOCALES} from "../src/i18n/config";

async function main(){
 const product=shopProducts.find(p=>p.id===manifest.productId)!;
 assert(product);assert.equal(product.file,manifest.archive.file);assert.equal(product.releaseReady,false);
 assert.deepEqual(manifest.availableLocales,["en"]);assert.deepEqual(manifest.targetLocales,LOCALES);
 assert.equal(manifest.source.pages,44);assert.equal(manifest.source.dailyPages,30);
 assert.deepEqual(manifest.sample.sourcePages,[1,6,14]);
 const bytes=readFileSync(`public${manifest.sample.file}`);
 assert.equal(createHash("sha256").update(bytes).digest("hex"),manifest.sample.sha256);
 const pdf=await PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),3);
 for(const page of pdf.getPages()){assert(Math.abs(page.getWidth()-595.28)<1);assert(Math.abs(page.getHeight()-841.89)<1);}
 for(const locale of LOCALES){
  const p=shopCataloguePresentation(locale).products.find(p=>p.id===product.id)!;
  assert.equal(p.sample,manifest.sample.file);assert(p.pages.includes("44"));assert(p.description.includes("30"));
  assert(p.sampleLabel.includes("3"));assert(p.sampleLabel.includes("PDF"));
 }
 console.log("PASS: supplied 44-page journal contract, 30 daily pages, exact three-page A4 sample/hash and English-only sample in nine storefronts; live sales remain closed.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
