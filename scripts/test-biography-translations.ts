import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {libraryPeople} from "../src/content/people";
import {biographyTranslationSource,assertTranslationShape,sourceFingerprint} from "../src/lib/i18n/content-translations";
import {draftBiographyPresentation,publicLibraryLocale,draftShelfPresentation,draftReaderPresentation} from "../src/lib/i18n/library-presentation";
import {originalBooks} from "../src/content/library";
import BiographyProfile from "../src/components/BiographyProfile";
import {ACTIVE_LOCALES,type Locale} from "../src/i18n/config";
import manifest from "../src/content/translations/people.sources.json";
(globalThis as typeof globalThis & {React:typeof React}).React=React;
const escape=(s:string)=>s.replaceAll("&","&amp;").replaceAll("'","&#x27;").replaceAll('"',"&quot;");
function check(source:unknown,translation:unknown,path:string){
 if(typeof source==="string"){
  assert.equal(typeof translation,"string");const t=translation as string;assert(t.trim());assert.equal(t,t.normalize("NFC"));assert(!/[\uFFFD<>|]/u.test(t));assert.notEqual(t,source,path);
  assert.deepEqual(t.match(/\d+/g)||[],source.match(/\d+/g)||[],`${path}: numeric facts`);
  assert.deepEqual(t.match(/\{\w+\}/g)||[],source.match(/\{\w+\}/g)||[]);
 }else if(Array.isArray(source))source.forEach((s,i)=>check(s,(translation as unknown[])[i],`${path}/${i}`));
 else if(source&&typeof source==="object")for(const [k,v] of Object.entries(source))check(v,(translation as Record<string,unknown>)[k],`${path}/${k}`);
}
let renders=0;
for(const entry of manifest.locales){const locale=entry as Locale;const copies=JSON.parse(readFileSync(`src/content/translations/people.${locale}.json`,"utf8"));let strings=0;const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 assert.deepEqual(Object.keys(copies).sort(),libraryPeople.map(p=>p.slug).sort());
 for(const person of libraryPeople){const source=biographyTranslationSource(person),slug=person.slug as keyof typeof manifest.sources;
  assert.equal(sourceFingerprint(source),manifest.sources[slug]);strings+=assertTranslationShape(source,copies[slug],`${locale}/${slug}`);check(source,copies[slug],`${locale}/${slug}`);
  const presentation=draftBiographyPresentation(person,locale),p=presentation.person;
  for(const key of ["slug","name","image","source","sourceTitle","checked"] as const)assert.equal(p[key],person[key]);
  assert.equal(p.sections.length,3);assert.equal(p.takeaways.length,3);
  const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(BiographyProfile,presentation)}));renders++;
  for(const text of [p.title,p.topic,p.ages,p.alt,p.playful,...p.sections.flatMap(s=>[s.heading,s.text]),...p.takeaways])assert(html.includes(escape(text)),`${locale}: ${text}`);
  if(p.illustrationNote)assert(html.includes(escape(p.illustrationNote)));
  for(const level of ["Builder","Strategist"])assert(p.ages.includes(level));
  assert.throws(()=>draftBiographyPresentation({...person,sections:person.sections.map((s,i)=>i? s:{...s,text:s.text+" changed"})},locale),/Stale translation/);
 }
 assert.equal(strings,manifest.stringsPerLocale);assert.equal(publicLibraryLocale(locale),"en");
 if(locale!=="ro"){assert.throws(()=>draftShelfPresentation(locale),/not ready/);assert.throws(()=>draftReaderPresentation(originalBooks[0]!,locale),/not ready/);}
}
assert.equal(renders,manifest.locales.length*10);assert.deepEqual(ACTIVE_LOCALES,["en"]);
console.log(`PASS: ${manifest.locales.length*147} biography draft fragments and ${renders} actual complete profile SSR renders; numeric facts, source fingerprints, canonical metadata, real/thematic illustration disclosures, levels and unfinished book/hub/public-language gates preserved. Native-editor, voice and non-English browser review still pending.`);
