import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import DiscoveryExperience from "../src/components/DiscoveryExperience";
import {discoveryCopy,discoveryText} from "../src/content/discovery-copy";
import {museumRooms,libraryBooks} from "../src/content/discovery";
import {discoveryNotes} from "../src/content/discovery-notes";
import {museumMedia} from "../src/content/museum-media";
import {laboratoryCopy} from "../src/content/laboratory-copy";
import {readerCopy} from "../src/content/reader-copy";
import {draftDiscoveryPresentation,publicDiscoveryPresentation,type DiscoveryPresentation} from "../src/lib/i18n/discovery-presentation";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import {LOCALES,ACTIVE_LOCALES,REGIONAL_LOCALES,type Locale} from "../src/i18n/config";
import manifest from "../src/content/translations/discovery-interface.sources.json";

(globalThis as typeof globalThis & {React:typeof React}).React=React;
assert.equal(manifest.sourceHash,sourceFingerprint(discoveryCopy.en));
assert.deepEqual(manifest.locales,LOCALES);
assert.equal(Object.keys(discoveryCopy.en).length,manifest.stringsPerLocale);
assert.equal(manifest.translatedStrings,manifest.stringsPerLocale*8);
for(const locale of LOCALES){
 assert.deepEqual(Object.keys(discoveryCopy[locale]).sort(),Object.keys(discoveryCopy.en).sort());
 for(const [key,value] of Object.entries(discoveryCopy[locale])){
  assert(value.trim().length>0);assert.equal(value,value.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(value));
  const source=discoveryCopy.en[key as keyof typeof discoveryCopy.en];
  assert.deepEqual(value.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[],`${locale}/${key}: placeholder parity`);
  if(locale!=="en"&&!(key==="museum"&&["de","nl"].includes(locale)))assert.notEqual(value,source,`${locale}/${key}: translated UI`);
 }
 assert.equal(REGIONAL_LOCALES[locale].split("-")[0],locale);
 assert(!discoveryText(locale,"completed",{current:"…",total:10}).includes("{"));
 assert(!discoveryText(locale,"roomPosition",{current:2,total:10}).includes("{"));
}
assert.equal(discoveryText("ro","pagePosition",{current:2,total:3}),"Pagina 2 din 3");
assert.throws(()=>discoveryText("en","pagePosition",{current:1}),/Missing library placeholder/);
const escape=(value:string)=>value.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
let renders=0;
function render(presentation:DiscoveryPresentation){
 const locale=presentation.locale,messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const result=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(DiscoveryExperience,{presentation})}));
 renders++;return result;
}
function assertCards(presentation:DiscoveryPresentation,slugs:string[]){
 assert.deepEqual(presentation.entries.map(entry=>entry.slug),slugs);
 for(const entry of presentation.entries)assert.deepEqual(Object.keys(entry).sort(),["slug","summary","title"],"Do not serialize every detail story/quiz to the client");
}
for(const locale of LOCALES){
 for(const kind of ["museum","library"] as const){
  const publicHub=publicDiscoveryPresentation(kind,locale);assert.equal(publicHub.locale,"en");
  for(const source of kind==="museum"?museumRooms:libraryBooks){
   const publicDetail=publicDiscoveryPresentation(kind,locale,source.slug);assert.equal(publicDetail.locale,"en");assert.equal(publicDetail.item,source);
  }
 }
 const hub=draftDiscoveryPresentation("museum",locale),hubHtml=render(hub),ui=discoveryCopy[locale];
 assertCards(hub,museumRooms.map(room=>room.slug));assert.equal(hub.item,undefined);assert.equal(hub.note,undefined);assert.equal(hub.shelves,undefined);
 for(const text of [ui.museumTitle,ui.museumIntro,ui.museumGuide,laboratoryCopy[locale].hideGuide])assert(hubHtml.includes(escape(text)),`${locale}: museum hub ${text}`);
 for(const entry of hub.entries){assert(hubHtml.includes(escape(entry.title)));assert(hubHtml.includes(escape(entry.summary)));}
 for(const kind of ["museum","library"] as const){
  const sources=kind==="museum"?museumRooms:libraryBooks;
  for(const source of sources){
   const view=draftDiscoveryPresentation(kind,locale,source.slug),item=view.item!,note=view.note!,html=render(view);
   assertCards(view,sources.map(source=>source.slug));assert.equal(item.slug,source.slug);assert.equal(item.icon,source.icon);assert.equal(view.shelves,undefined);
   assert.equal(item.quiz.correct,source.quiz.correct);assert.equal(item.quiz.answers.length,3);assert.equal(new Set(item.quiz.answers).size,3);
   assert.deepEqual(note.sources,discoveryNotes[source.slug]!.sources,"Keep canonical bibliography and URLs");
   assert.equal(note.challenges.length,3);assert.equal(new Set(note.challenges).size,3);
   for(const text of [item.title,ui.allDiscoveries,ui.chooseChallenge,note.challenges[0],readerCopy[locale].larger,laboratoryCopy[locale].hideGuide])assert(html.includes(escape(text)),`${locale}/${source.slug}: ${text}`);
   assert(html.includes(`aria-label="${escape(ui.navigation)}"`));
   for(const label of ["Explorer","Builder","Strategist"])assert(html.includes(`>${label}</option>`));
   for(const citation of note.sources??[]){assert(html.includes(escape(citation.title)));assert(html.includes(escape(citation.url)));}
   if("story" in item){
    for(const text of [item.intro,item.story,item.explanation,item.activity,item.quiz.question,ui.communication])assert(html.includes(escape(text)));
    assert(html.includes(escape(museumMedia[item.slug]!.alt[locale])));
    assert(html.includes(`aria-label="${escape(ui.challenge)}"`));
   }else{
    assert.equal(item.pages.length,3);assert(html.includes(escape(item.pages[0]!.title)));assert(html.includes(escape(item.pages[0]!.text)));
    assert(html.includes(`aria-label="${escape(ui.bookPages)}"`));assert(!html.includes(`aria-label="${escape(ui.challenge)}"`),"Question remains on the final page");
   }
   if(locale!=="en")for(const phrase of ["Discovery navigation","Choose a practical challenge","Sources for grown-ups","Larger text","Read a page, then choose Next."])assert(!html.includes(phrase),`${locale}/${source.slug}: English interface leak`);
  }
 }
 if(locale==="en"||locale==="ro"){
  const library=draftDiscoveryPresentation("library",locale),html=render(library);
  assertCards(library,libraryBooks.map(book=>book.slug));assert.equal(library.shelves?.locale,locale);
  for(const text of [ui.libraryTitle,ui.libraryIntro,ui.libraryGuide,ui.shortHeading,ui.shortIntro])assert(html.includes(escape(text)));
  for(const book of library.shelves!.books)assert(html.includes(escape(book.title)));
 }else assert.throws(()=>draftDiscoveryPresentation("library",locale),/not ready/,"A full hub must not mix unfinished original-book content with translated short reads");
}
const hub=draftDiscoveryPresentation("library","en");
assert.throws(()=>render({...hub,shelves:undefined}),/complete shelf presentation/);
assert.throws(()=>draftDiscoveryPresentation("museum","ro","missing-room"),/Unknown museum/);
assert.throws(()=>draftDiscoveryPresentation("library","ro","missing-book"),/Unknown short-read/);
assert.equal(publicDiscoveryPresentation("museum","unknown").locale,"en");
const originalTitle=museumRooms[0]!.title;
try{museumRooms[0]!.title+=" changed";assert.throws(()=>draftDiscoveryPresentation("museum","ro",museumRooms[0]!.slug),/Stale translation/);}finally{museumRooms[0]!.title=originalTitle;}
const originalFeedback=discoveryNotes[libraryBooks[0]!.slug]!.feedback;
try{discoveryNotes[libraryBooks[0]!.slug]!.feedback+=" changed";assert.throws(()=>draftDiscoveryPresentation("library","ro",libraryBooks[0]!.slug),/Stale translation/);}finally{discoveryNotes[libraryBooks[0]!.slug]!.feedback=originalFeedback;}
assert.deepEqual(ACTIVE_LOCALES,["en"]);assert.equal(renders,173);
console.log("PASS: 351 discovery UI strings, 173 successful localized component SSR renders (18 details across nine locales, nine Museum hubs, EN/RO full Library hubs), lean cards/current detail, canonical identifiers/sources/answers, distinct age challenges, stale-source refusal and English-only gate. SSR covers the first short-read page; non-English browser interaction, global layout, actual voice quality and final editorial review remain pending.");
