import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import OriginalBookReader from "../src/components/OriginalBookReader";
import BiographyProfile from "../src/components/BiographyProfile";
import {LibraryShelves} from "../src/components/LibraryShelves";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {authorBooks} from "../src/content/author-books";
import {readerCopy,readerText,librarySourceDate} from "../src/content/reader-copy";
import {libraryShelfCopy,shelfText} from "../src/content/library-shelf-copy";
import {draftReaderPresentation,draftBiographyPresentation,draftShelfPresentation,publicLibraryLocale} from "../src/lib/i18n/library-presentation";
import {LOCALES,ACTIVE_LOCALES,REGIONAL_LOCALES,type Locale} from "../src/i18n/config";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import manifest from "../src/content/translations/library-interface.sources.json";

(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.deepEqual(manifest.locales,LOCALES);
let fragments=0;
for(const [name,copy] of [["reader",readerCopy],["shelves",libraryShelfCopy]] as const){
 assert.equal(manifest.sourceHashes[name],sourceFingerprint(copy.en),`${name}: review translated copy when its English source changes`);
 fragments+=Object.keys(copy.en).length;
 for(const locale of LOCALES){
  assert.deepEqual(Object.keys(copy[locale]).sort(),Object.keys(copy.en).sort());
  for(const [key,value] of Object.entries(copy[locale])){
   assert(value.trim().length>0);assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(value));
   const source=(copy.en as Record<string,string>)[key]!;
   assert.deepEqual(value.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[],`${locale}/${name}/${key}: placeholders`);
   if(locale!=="en")assert.notEqual(value,source,`${locale}/${name}/${key}: translated copy`);
  }
 }
}
assert.equal(fragments,manifest.stringsPerLocale);assert.equal(fragments*8,manifest.translatedStrings);
assert.equal(readerText("ro","chapter",{current:2,total:8}),"Capitolul 2 din 8");
assert.equal(shelfText("ro","shownMany",{count:12}),"Cărți afișate: 12");
assert.equal(shelfText("pl","shownMany",{count:3}),"Wyświetlone książki: 3");
assert.throws(()=>readerText("en","chapter",{current:1}),/Missing library placeholder/);
assert.equal(librarySourceDate("en","2026-10-28"),"28 Oct 2026");
assert.equal(librarySourceDate("ro","2026-10-28"),"28 oct. 2026");
for(const invalid of ["2026-02-30","2026-10-28T12:00:00Z","bad","2026-1-2"])assert.throws(()=>librarySourceDate("en",invalid),/Invalid library source date/);
for(const locale of LOCALES){
 assert.equal(REGIONAL_LOCALES[locale].split("-")[0],locale);
 const date=librarySourceDate(locale,"2026-10-28");assert(date.includes("2026")&&date.includes("28"));
 assert.equal(publicLibraryLocale(locale),"en");
}
assert.equal(publicLibraryLocale("unknown"),"en");assert.deepEqual(ACTIVE_LOCALES,["en"]);
function render(locale:Locale,element:React.ReactElement){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:element}));
}
const escape=(value:string)=>value.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
for(const book of originalBooks){
 const en=draftReaderPresentation(book,"en"),ro=draftReaderPresentation(book,"ro");
 assert.equal(en.book,book);assert.equal(ro.paragraphsPerPage,en.paragraphsPerPage,"Localized prose must not change pagination");
 assert.equal(ro.book.slug,book.slug);assert.equal(ro.book.cover,book.cover);
 assert.deepEqual(ro.book.chapters.map(chapter=>chapter.paragraphs.length),book.chapters.map(chapter=>chapter.paragraphs.length));
 assert.deepEqual(ro.book.chapters.map(chapter=>chapter.choices.map(choice=>choice.correct)),book.chapters.map(chapter=>chapter.choices.map(choice=>choice.correct)));
 for(const [locale,view] of [["en",en],["ro",ro]] as const){
  const html=render(locale,React.createElement(OriginalBookReader,view));
  for(const text of [view.book.title,view.book.subtitle,view.book.coverAlt,readerCopy[locale].contents,readerCopy[locale].editorial,readerCopy[locale].words,readerCopy[locale].backLibrary])assert(html.includes(escape(text)),`${locale}/${book.slug}: ${text}`);
  assert(html.includes(`aria-label="${escape(readerCopy[locale].bookNav)}"`));
  for(const chapter of view.book.chapters)assert(html.includes(escape(chapter.title)),"Every chapter remains directly available in Contents");
  if(locale==="ro")for(const text of ["Book navigation","Contents: choose any chapter","Back to Library"])assert(!html.includes(text));
 }
 assert.throws(()=>draftReaderPresentation({...book,subtitle:book.subtitle+" changed"},"ro"),/Stale translation/);
}
for(const person of libraryPeople){
 const ro=draftBiographyPresentation(person,"ro");
 for(const field of ["slug","name","source","sourceTitle","checked","image"] as const)assert.equal(ro.person[field],person[field]);
 for(const locale of ["en","ro"] as const){
  const view=draftBiographyPresentation(person,locale),html=render(locale,React.createElement(BiographyProfile,view));
  for(const text of [view.person.title,view.person.playful,readerCopy[locale].sources,readerCopy[locale].sourceNote,readerText(locale,"sourceChecked",{date:librarySourceDate(locale,person.checked)})])assert(html.includes(escape(text)),`${locale}/${person.slug}: ${text}`);
  for(const section of view.person.sections){assert(html.includes(escape(section.heading)));assert(html.includes(escape(section.text)));}
  assert(html.includes(escape(person.source)));assert(html.includes(escape(person.sourceTitle)));
  if(locale==="ro")for(const text of ["Biography navigation","Ideas to keep questioning","Factual source and notes for grown-ups"])assert(!html.includes(text));
 }
 assert.throws(()=>draftBiographyPresentation({...person,topic:person.topic+" changed"},"ro"),/Stale translation/);
}
for(const locale of ["en","ro"] as const){
 const presentation=draftShelfPresentation(locale),html=render(locale,React.createElement(LibraryShelves,{presentation}));
 assert.equal(presentation.books.length,10);assert.equal(presentation.people.length,10);assert.equal(presentation.published.length,12);
 for(const book of presentation.books)assert(html.includes(escape(book.title)));
 for(const person of presentation.people)assert(html.includes(escape(person.topic)));
 presentation.published.forEach((book,index)=>{
  for(const field of ["id","title","authors","illustrator","publisher","url","checked"] as const)assert.equal(book[field],authorBooks[index]![field]);
  assert(html.includes(escape(book.title)));assert(html.includes(escape(book.description)));assert(html.includes(escape(book.url)));
 });
 assert(html.includes(escape(libraryShelfCopy[locale].topic)));assert(html.includes(escape(libraryShelfCopy[locale].allTopics)));
 if(locale==="ro")for(const phrase of ["Library shelves","Choose a topic","Books by other authors","For grown-ups: where to find this book"])assert(!html.includes(phrase));
}
for(const locale of LOCALES.filter(locale=>locale!=="en"&&locale!=="ro")){
 assert.throws(()=>draftReaderPresentation(originalBooks[0]!,locale),/not ready/);

 assert.throws(()=>draftShelfPresentation(locale),/not ready/);
}
console.log("PASS: 675 reader/biography/shelf UI strings across nine locales, EN/RO component SSR for 10 books, 10 biographies and both shelf editions, canonical metadata, pagination and answer preservation, calendar dates, stale-source refusal and English-only activation. Open Romanian reader interaction and real voice quality remain unverified.");
