import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {NextIntlClientProvider} from "next-intl";
import {readFileSync} from "node:fs";
import LearningLabExperience from "../src/components/LearningLabExperience";
import {learningLabs} from "../src/content/learning-labs";
import {labTaskAtLevel} from "../src/content/lab-age-variants";
import {laboratoryCopy,laboratoryPosition,laboratorySpeechLocales} from "../src/content/laboratory-copy";
import {draftLaboratoryPresentation,publicLaboratoryPresentation} from "../src/lib/i18n/laboratory-presentation";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {sourceFingerprint} from "../src/lib/i18n/content-translations";
import manifest from "../src/content/translations/laboratory-copy.sources.json";

// tsx follows this repository's JSX-preserve setting with the classic runtime.
// Next's production compiler provides its own JSX runtime; this is SSR test setup only.
(globalThis as typeof globalThis & {React:typeof React}).React=React;
const keys=Object.keys(laboratoryCopy.en).sort();
assert.equal(manifest.sourceHash,sourceFingerprint(laboratoryCopy.en),"English UI changed: review translated copy and record its source again");
assert.deepEqual(manifest.locales,LOCALES);
for(const locale of LOCALES){
 const copy=laboratoryCopy[locale];
 assert.deepEqual(Object.keys(copy).sort(),keys);
 for(const [key,value] of Object.entries(copy)){
  assert(value.trim().length>0,`${locale}/${key}`);
  assert.equal(value,value.normalize("NFC"));
  assert(!/[\uFFFD<>|]/u.test(value),`${locale}/${key}: valid plain text`);
  assert.deepEqual(value.match(/\{\w+\}/g)||[],laboratoryCopy.en[key as keyof typeof copy].match(/\{\w+\}/g)||[],`${locale}/${key}: template parity`);
  if(locale!=="en")assert.notEqual(value,laboratoryCopy.en[key as keyof typeof copy],`${locale}/${key}: translated prose`);
 }
 assert(copy.levels.includes("Explorer (6–8"));assert(copy.levels.includes("Builder (9–11"));assert(copy.levels.includes("Strategist (12–14"));
 assert.equal(laboratorySpeechLocales[locale].split("-")[0],locale);
 const position=laboratoryPosition(locale,2,8);assert(position.includes("2")&&position.includes("8"));assert(!position.includes("{"));
}
assert.equal(laboratoryPosition("ro",2,8),"Activitatea 2 din 8");
assert.equal(laboratorySpeechLocales.pt,"pt-PT");
assert.equal(laboratorySpeechLocales.en,"en-GB");
for(const lab of learningLabs){
 for(const locale of [...LOCALES,"unknown"]){
  const publicView=publicLaboratoryPresentation(lab,locale);
  assert.equal(publicView.locale,"en");assert.equal(publicView.lab,lab);
 }
 for(const locale of ["en","ro"] as const){
  const view=draftLaboratoryPresentation(lab,locale);
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
  const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:"Europe/London",children:React.createElement(LearningLabExperience,view)}));
  const copy=laboratoryCopy[locale];
  for(const visible of [view.lab.title,copy.home,copy.challenge,copy.guide,copy.hideGuide,copy.communication,copy.mark,laboratoryPosition(locale,1,lab.tasks.length)])assert(html.includes(visible),`${locale}/${lab.slug}: rendered ${visible}`);
  assert(html.includes(`aria-label="${copy.navigation}"`));assert(html.includes(`aria-label="${copy.guideLabel}"`));
  const first=labTaskAtLevel(lab.slug,view.lab.tasks[0]!,0,view.variants);
  assert(html.includes(first.idea));assert(html.includes(first.situation));
  if(locale==="ro"){
   assert(!html.includes(labTaskAtLevel(lab.slug,lab.tasks[0]!,0).idea),"No global English age-reading leak in Romanian SSR");
   for(const phrase of ["Learning navigation","Choose your challenge","Your learning guides","Mark as practised","Hide guide","Your practical challenge:"])assert(!html.includes(phrase),`Untranslated UI: ${phrase}`);
  }
 }
 for(const locale of LOCALES.filter(locale=>locale!=="en"&&locale!=="ro"))assert.throws(()=>draftLaboratoryPresentation(lab,locale),/not ready/);
 assert.throws(()=>draftLaboratoryPresentation({...lab,description:`${lab.description} changed`},"ro"),/Stale translation/);
}
assert.deepEqual(ACTIVE_LOCALES,["en"]);
console.log("PASS: 270 lab UI strings across nine locales, regional speech tags, template parity, actual EN/RO component SSR for all three labs, scoped age readings, stale-source rejection and English-only public gate. No browser/voice quality certification.");
