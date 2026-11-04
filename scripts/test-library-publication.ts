import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {publicOriginalBooks,publicShortReads,publicLibraryStorySlugs} from "../src/content/library-publication";
import {originalBooks} from "../src/content/library";
import {libraryBooks} from "../src/content/discovery";
import {bookPageArt} from "../src/content/book-page-art";
import inventory from "../docs/library-illustration-inventory.json";
import sitemap from "../src/app/sitemap";
import {LOCALES} from "../src/i18n/config";
import {draftReaderPresentation,draftShelfPresentation} from "../src/lib/i18n/library-presentation";
assert(publicOriginalBooks.length>0,"Do not ship an empty storybook shelf");
let pages=0,reviewed=0;
for(const book of publicOriginalBooks){
 assert(existsSync(`public${book.cover}`));
 book.chapters.forEach((chapter,c)=>{
  const per=book.audience.startsWith("Explorer")?1:2;
  for(let p=0;p<Math.ceil(chapter.paragraphs.length/per);p++){
   pages++;const art=bookPageArt(book.slug,c,p);
   if(!art){assert.equal(inventory.find(row=>row.book===book.slug&&row.chapter===c&&row.part===p)?.status,"pending");continue;}
   reviewed++;
   const row=inventory.find(row=>row.book===book.slug&&row.chapter===c&&row.part===p);assert(row);
   assert.equal(row.status,"generated-visually-reviewed");assert.equal(row.image,art.src);
   assert.equal(row.sha256,createHash("sha256").update(readFileSync(`public${art.src}`)).digest("hex"));
   if(art.reusedFrom)assert("reuseReason" in row&&row.reuseReason,"Reused story art needs a recorded contextual review");
  }
 });
 for(const locale of LOCALES){
  const translated=draftReaderPresentation(book,locale).book;
  assert.equal(translated.chapters.length,book.chapters.length);
  translated.chapters.forEach((chapter,c)=>assert.equal(chapter.paragraphs.length,book.chapters[c]!.paragraphs.length));
 }
}
const paths=new Set(sitemap().map(entry=>new URL(entry.url).pathname));
for(const locale of LOCALES){
 assert.deepEqual(draftShelfPresentation(locale).books.map(book=>book.slug),publicOriginalBooks.map(book=>book.slug));
 for(const book of [...originalBooks,...libraryBooks])assert.equal(paths.has(`/${locale}/library/${book.slug}`),publicLibraryStorySlugs.has(book.slug));
}
assert.equal(originalBooks.length,10);assert.equal(libraryBooks.length,8);
assert.equal(publicOriginalBooks.length,originalBooks.length,"Retain all previously published original texts");
assert.equal(publicShortReads.length,libraryBooks.length,"Retain previously published short reads");
console.log(`PASS: ${publicOriginalBooks.length} original texts and ${publicShortReads.length} short reads retained in nine languages; ${reviewed}/${pages} original-page mappings verified. Full artwork completeness is a separate mandatory CI release check.`);
