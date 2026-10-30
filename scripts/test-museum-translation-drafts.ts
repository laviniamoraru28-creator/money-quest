import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {museumRooms} from "../src/content/discovery";
import {discoveryNotes} from "../src/content/discovery-notes";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {museumTranslationSource,draftTranslatedMuseum,assertTranslationShape} from "../src/lib/i18n/content-translations";
const manifest=JSON.parse(readFileSync("src/content/translations/museum.sources.json","utf8"));
const locales=LOCALES.filter(locale=>locale!=="en");
assert.deepEqual(manifest.locales,locales);
assert.deepEqual(Object.keys(manifest.sources).sort(),museumRooms.map(room=>room.slug).sort());
// Thousands separators vary by locale; numerical values and GBP must not change.
function figures(value:unknown):string[]{return (JSON.stringify(value).match(/\d{1,3}(?:[.,\s\u00a0]\d{3})+|\d+/g)||[]).map(number=>number.replace(/\D/g,""));}
let strings=0;
for(const locale of locales){
 const translations=JSON.parse(readFileSync(`src/content/translations/museum.${locale}.json`,"utf8"));
 assert.deepEqual(Object.keys(translations).sort(),museumRooms.map(room=>room.slug).sort());
 for(const room of museumRooms){
  const note=discoveryNotes[room.slug];assert.ok(note);
  const source=museumTranslationSource(room,note),copy=translations[room.slug];
  strings+=assertTranslationShape(source,copy,`${locale}/${room.slug}`);
  const translated=draftTranslatedMuseum(room,note,copy,manifest.sources[room.slug]);
  assert.equal(translated.room.slug,room.slug);assert.equal(translated.room.icon,room.icon);
  assert.equal(translated.note.sources,note.sources,"Preserve canonical bibliography titles and URLs");
  assert.notEqual(translated.room.title,room.title);assert.notEqual(translated.note.feedback,note.feedback);
  assert.equal(translated.room.quiz.correct,room.quiz.correct);
  assert.equal(new Set(translated.room.quiz.answers).size,3);
  assert.equal(new Set(translated.note.challenges).size,3,"All three authored age challenges must remain distinct");
  assert.deepEqual(figures(copy),figures(source),`${locale}/${room.slug}: preserve dates, quantities and exchange examples`);
  assert.deepEqual(JSON.stringify(copy).match(/£\d+/g),JSON.stringify(source).match(/£\d+/g));
  assert.throws(()=>draftTranslatedMuseum({...room,title:room.title+" changed"},note,copy,manifest.sources[room.slug]));
  assert.throws(()=>draftTranslatedMuseum(room,{...note,feedback:note.feedback+" changed"},copy,manifest.sources[room.slug]));
  const wrong=structuredClone(copy);wrong.room.quiz.correct=(room.quiz.correct+1)%3;
  assert.throws(()=>draftTranslatedMuseum(room,note,wrong,manifest.sources[room.slug]));
  const missing=structuredClone(copy);missing.note.challenges.pop();
  assert.throws(()=>draftTranslatedMuseum(room,note,missing,manifest.sources[room.slug]));
  assert.throws(()=>draftTranslatedMuseum(room,note,{...copy,note:{...copy.note,sources:[]}},manifest.sources[room.slug]));
 }
}
assert.deepEqual(ACTIVE_LOCALES,["en"],"A translated content group must not activate incomplete site locales");
console.log(`PASS: ${museumRooms.length} Museum rooms in ${locales.length} language drafts (${strings} text fragments), three age challenges, answer flags, figures, metadata and stale-source guards.`);
