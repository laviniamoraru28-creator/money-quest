import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {biographyTranslationSource,draftTranslatedBiography,bookTranslationSource,draftTranslatedBook,assertTranslationShape} from "../src/lib/i18n/content-translations";
import {ACTIVE_LOCALES} from "../src/i18n/config";
const translations=JSON.parse(readFileSync("src/content/translations/people.ro.json","utf8"));
const manifest=JSON.parse(readFileSync("src/content/translations/people.ro.sources.json","utf8"));
assert.deepEqual(Object.keys(translations).sort(),libraryPeople.map(p=>p.slug).sort());
for(const person of libraryPeople){
 const result=draftTranslatedBiography(person,translations[person.slug],manifest.sources[person.slug]);
 for(const key of ["slug","name","image","source","sourceTitle","checked"] as const)assert.equal(result[key],person[key],`Preserve ${key}`);
 assert.notEqual(result.title,person.title);
 assert.equal(result.sections.length,person.sections.length);
 assert.equal(result.takeaways.length,person.takeaways.length);
 assert.throws(()=>draftTranslatedBiography({...person,title:person.title+" changed"},translations[person.slug],manifest.sources[person.slug]));
 assert.throws(()=>assertTranslationShape(biographyTranslationSource(person),{...translations[person.slug],source:"https://wrong.example"}));
}
const bookTranslations=JSON.parse(readFileSync("src/content/translations/books.ro.json","utf8"));
const bookManifest=JSON.parse(readFileSync("src/content/translations/books.ro.sources.json","utf8"));
assert.deepEqual(Object.keys(bookTranslations).sort(),originalBooks.map(book=>book.slug).sort());
for(const book of originalBooks){
 const translated=draftTranslatedBook(book,bookTranslations[book.slug],bookManifest.sources[book.slug]);
 assert.equal(translated.slug,book.slug);assert.equal(translated.cover,book.cover);assert.notEqual(translated.title,book.title);
 assert.equal(translated.chapters.length,book.chapters.length);
 book.chapters.forEach((chapter,index)=>{
  const next=translated.chapters[index]!;
  assert.equal(next.paragraphs.length,chapter.paragraphs.length);
  assert.equal(next.choices.findIndex(choice=>choice.correct),chapter.choices.findIndex(choice=>choice.correct));
  // Currency symbols and numerical amounts must survive translation unchanged.
  assert.deepEqual(JSON.stringify(next).match(/£[0-9]+/g),JSON.stringify(chapter).match(/£[0-9]+/g));
 });
 assert.throws(()=>draftTranslatedBook({...book,title:book.title+" changed"},bookTranslations[book.slug],bookManifest.sources[book.slug]));
 const tampered=structuredClone(bookTranslations[book.slug]);tampered.chapters[0].choices[0].correct=!tampered.chapters[0].choices[0].correct;
 assert.throws(()=>assertTranslationShape(bookTranslationSource(book),tampered));
}
assert.deepEqual(ACTIVE_LOCALES,["en"],"Do not activate incomplete site translations because one content group is ready");
console.log("PASS: all 10 Romanian books and 10 biography drafts preserve metadata, answer keys, amounts and structure, stale source text is rejected, and incomplete locale rollout stays blocked.");
