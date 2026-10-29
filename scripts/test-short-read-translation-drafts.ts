import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {libraryBooks} from "../src/content/discovery";
import {discoveryNotes} from "../src/content/discovery-notes";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {shortReadTranslationSource,draftTranslatedShortRead,assertTranslationShape} from "../src/lib/i18n/content-translations";
const manifest=JSON.parse(readFileSync("src/content/translations/short-reads.sources.json","utf8"));
const locales=LOCALES.filter(locale=>locale!=="en");
assert.deepEqual(manifest.locales,locales);
assert.deepEqual(Object.keys(manifest.sources).sort(),libraryBooks.map(book=>book.slug).sort());
function figures(value:unknown):string[]{return (JSON.stringify(value).match(/\d{1,3}(?:[.,\s\u00a0]\d{3})+|\d+/g)||[]).map(number=>number.replace(/\D/g,""));}
let strings=0;
for(const locale of locales){
 const translations=JSON.parse(readFileSync(`src/content/translations/short-reads.${locale}.json`,"utf8"));
 assert.deepEqual(Object.keys(translations).sort(),libraryBooks.map(book=>book.slug).sort());
 for(const book of libraryBooks){
  const note=discoveryNotes[book.slug];assert.ok(note);
  const source=shortReadTranslationSource(book,note),copy=translations[book.slug];
  strings+=assertTranslationShape(source,copy,`${locale}/${book.slug}`);
  const translated=draftTranslatedShortRead(book,note,copy,manifest.sources[book.slug]);
  assert.equal(translated.book.slug,book.slug);assert.equal(translated.book.icon,book.icon);
  assert.equal(translated.note.sources,note.sources);
  assert.notEqual(translated.book.title,book.title);assert.notEqual(translated.note.feedback,note.feedback);
  assert.equal(translated.book.pages.length,3);assert.equal(translated.book.quiz.correct,book.quiz.correct);
  assert.equal(new Set(translated.book.quiz.answers).size,3);
  assert.equal(new Set(translated.note.challenges).size,3);
  assert.deepEqual(figures(copy),figures(source),`${locale}/${book.slug}: preserve dates, quantities and amounts`);
  assert.deepEqual(JSON.stringify(copy).match(/£\d+/g),JSON.stringify(source).match(/£\d+/g));
  assert.throws(()=>draftTranslatedShortRead({...book,title:book.title+" changed"},note,copy,manifest.sources[book.slug]));
  assert.throws(()=>draftTranslatedShortRead(book,{...note,feedback:note.feedback+" changed"},copy,manifest.sources[book.slug]));
  const wrong=structuredClone(copy);wrong.book.quiz.correct=(book.quiz.correct+1)%3;
  assert.throws(()=>draftTranslatedShortRead(book,note,wrong,manifest.sources[book.slug]));
  const missing=structuredClone(copy);missing.book.pages.pop();
  assert.throws(()=>draftTranslatedShortRead(book,note,missing,manifest.sources[book.slug]));
  assert.throws(()=>draftTranslatedShortRead(book,note,{...copy,note:{...copy.note,sources:[]}},manifest.sources[book.slug]));
 }
}
assert.deepEqual(ACTIVE_LOCALES,["en"]);
console.log(`PASS: ${libraryBooks.length} short reads in ${locales.length} languages (${strings} draft fragments), three pages, age challenges, quiz flags, metadata, amounts and stale-source guards.`);
