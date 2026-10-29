import assert from "node:assert/strict";
import {existsSync,statSync} from "node:fs";
import {experienceCopy} from "../src/content/experience-copy";
import {visualCopy} from "../src/content/visual-learning";
import {museumMedia} from "../src/content/museum-media";
import {museumRooms} from "../src/content/discovery";
import {LOCALES} from "../src/i18n/config";
for(const locale of LOCALES) {
 for(const group of [experienceCopy,visualCopy]) {
  assert.deepEqual(Object.keys(group[locale]).sort(),Object.keys(group.en).sort());
  for(const value of Object.values(group[locale]))assert(typeof value==="string"&&value.trim().length>0);
 }
 // Amounts survive translation: a £1 price and two more £1 coins towards £3.
 assert(visualCopy[locale].payPrompt.includes("£1"));
 assert(visualCopy[locale].savePrompt.includes("£1")&&visualCopy[locale].savePrompt.includes("£3"));
 for(const room of museumRooms)assert((museumMedia[room.slug]?.alt[locale]?.length??0)>20,`${room.slug}/${locale}`);
}
assert.deepEqual(Object.keys(museumMedia).sort(),museumRooms.map(room=>room.slug).sort());
for(const media of Object.values(museumMedia))for(const src of [media.src,media.thumb]) {
 assert(existsSync(`public${src}`));assert(statSync(`public${src}`).size<200_000,"Museum illustration must stay lightweight");
}
console.log("PASS: nine-language visual activity, controls and meaningful Museum image alternatives; ten matching lightweight room assets.");
