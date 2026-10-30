import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {authorBooks} from "../src/content/author-books";
import {draftPublishedBook,draftShelfPresentation,publicLibraryLocale} from "../src/lib/i18n/library-presentation";
import {externalBookTranslationSource,sourceFingerprint,assertTranslationShape,draftTranslatedExternalBook} from "../src/lib/i18n/content-translations";
import {LibraryShelves} from "../src/components/LibraryShelves";
import {libraryShelfCopy} from "../src/content/library-shelf-copy";
import {LOCALES,ACTIVE_LOCALES,REGIONAL_LOCALES,type Locale} from "../src/i18n/config";
import manifest from "../src/content/translations/author-books.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
const escape=(s:string)=>s.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
function check(source:unknown,value:unknown,path:string){
 if(typeof source==="string"){assert.equal(typeof value,"string");const s=value as string;assert(s.trim());assert.equal(s,s.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(s));if(!/\/topics\/\d+$/.test(path))assert.notEqual(s,source,path);assert.deepEqual(s.match(/\d+/g)||[],source.match(/\d+/g)||[],path+": numeric guidance");}
 else if(Array.isArray(source))source.forEach((item,i)=>check(item,(value as unknown[])[i],path+"/"+i));
 else if(source&&typeof source==="object")for(const [k,item] of Object.entries(source))check(item,(value as Record<string,unknown>)[k],path+"/"+k);
}
assert.deepEqual(manifest.locales,LOCALES.filter(l=>l!=="en"));
let cards=0,renders=0;
for(const locale of LOCALES){
 const messages=JSON.parse(readFileSync("messages/"+locale+".json","utf8"));
 const translations=locale==="en"?null:JSON.parse(readFileSync("src/content/translations/author-books."+locale+".json","utf8"));let strings=0;
 if(translations)assert.deepEqual(Object.keys(translations).sort(),authorBooks.map(b=>b.id).sort());
 const published=authorBooks.map(book=>{
  const result=draftPublishedBook(book,locale),source=externalBookTranslationSource(book),id=book.id as keyof typeof manifest.sources;
  assert.equal(sourceFingerprint(source),manifest.sources[id]);
  for(const field of ["id","title","authors","illustrator","publisher","url","checked"] as const)assert.equal(result[field],book[field]);
  assert.equal(result.ideas.length,3);assert.equal(result.topics.length,book.topics.length);
  if(translations){strings+=assertTranslationShape(source,translations[id],locale+"/"+id);check(source,translations[id],locale+"/"+id);assert.throws(()=>draftPublishedBook({...book,description:book.description+" changed"},locale),/Stale translation/);assert.throws(()=>draftTranslatedExternalBook(book,{...translations[id],url:"https://wrong.invalid"},manifest.sources[id]),/unexpected fields/);}
  return result;
 });
 if(translations)assert.equal(strings,manifest.stringsPerLocale);
 const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(LibraryShelves,{presentation:{locale,books:[],people:[],published}})}));renders++;
 for(const book of published){for(const text of [book.title,book.authors,book.publisher,book.age,book.description,...book.ideas,book.discussion,book.access,book.url,...book.topics])assert(html.includes(escape(text)),locale+": "+text);cards++;}
 for(const value of [libraryShelfCopy[locale].guidance,libraryShelfCopy[locale].leave,libraryShelfCopy[locale].find])assert(html.includes(escape(value)));
 const sorted=Array.from(new Set(published.flatMap(b=>b.topics))).sort((a,b)=>a.localeCompare(b,REGIONAL_LOCALES[locale]));
 const options=Array.from(html.matchAll(/<option\b[^>]*>(.*?)<\/option>/g),m=>m[1]);assert.deepEqual(options,[escape(libraryShelfCopy[locale].allTopics),...sorted.map(escape)]);
 const money=published.find(b=>b.id==="money-for-beginners")!.topics[0];assert.equal(published.find(b=>b.id==="why-money-matters")!.topics[0],money);assert.equal(published.find(b=>b.id==="dosh")!.topics[1],money);
 assert.equal(publicLibraryLocale(locale),"en");
 if(locale!=="en"&&locale!=="ro")assert.throws(()=>draftShelfPresentation(locale),/not ready/);
}
assert.equal(cards,108);assert.equal(renders,9);assert.deepEqual(ACTIVE_LOCALES,["en"]);
console.log("PASS: 888 translated external-book introduction fragments, nine isolated author-shelf SSR renders and 108 cards; canonical titles/credits/links/dates, attributed numeric age guidance, ideas/discussion/access, localized topic sorting and unfinished full-hub/public-language gates. No localized book editions, stock, price, clinical outcome or fresh all-source check claimed. Native-editor/non-English browser/voice review remains pending.");
