import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {PDFDocument} from "pdf-lib";
import manifest from "../content/printables/journal-original.json";
import {shopProducts} from "../src/content/shop";
import {shopCataloguePresentation} from "../src/lib/i18n/shop-catalogue-presentation";
import {LOCALES} from "../src/i18n/config";

async function main(){
 const product=shopProducts.find(p=>p.id===manifest.productId)!;
 assert(product);assert.equal(product.file,manifest.archive.file);assert.equal(product.releaseReady,true);
 assert.deepEqual(product.releaseArchive,{sha256:manifest.archive.sha256,bytes:manifest.archive.bytes});
 assert.equal(manifest.ready,true);assert.equal(manifest.commerceReady,false);
 assert.deepEqual(manifest.availableLocales,LOCALES);assert.deepEqual(manifest.targetLocales,LOCALES);
 assert.equal(manifest.source.pages,44);assert.equal(manifest.source.dailyPages,30);
 assert.deepEqual(manifest.sample.sourcePages,[1,6,14]);
 for(const locale of LOCALES){
  const sample=manifest.samples[locale],edition=manifest.editions[locale];
  const bytes=readFileSync(`public${sample.file}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),sample.sha256);
  assert.equal(bytes.length,sample.bytes);assert.equal(edition.pages,45);
  assert.deepEqual(sample.sourcePages,[1,6,14]);
  const pdf=await PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),3);
  for(const page of pdf.getPages()){assert(Math.abs(page.getWidth()-595.28)<1);assert(Math.abs(page.getHeight()-841.89)<1);}
  const image=readFileSync(`public${manifest.images[locale].file}`);
  assert.equal(createHash("sha256").update(image).digest("hex"),manifest.images[locale].sha256);
  const displayed=shopCataloguePresentation(locale).products.find(candidate=>candidate.id==="adventure-journal");
  assert(displayed);
  assert.equal(displayed.sample,sample.file);assert.equal(displayed.image,manifest.images[locale].file);
  assert(displayed.pages.includes("45"));assert(displayed.description.includes("30"));assert(displayed.includes[3]!.includes("9"));
  assert(displayed.sampleLabel.includes("3"));assert(displayed.sampleLabel.includes("PDF"));
 }
 for(const file of ["scripts/test-journal-samples.py","scripts/test-journal-multilingual.py","scripts/test-journal-habit-trackers.py"]){const r=spawnSync("python3",[file],{stdio:"inherit"});assert.equal(r.status,0);}
 console.log("PASS: nine 45-page journal editions, localized three-page A4 samples/covers, private archive contract and source tamper guards; actual host payment setup remains separate.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
