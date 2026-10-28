import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {libraryPeople} from "../src/content/people";
import {biographyTranslationSource,draftTranslatedBiography,assertTranslationShape} from "../src/lib/i18n/content-translations";
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
assert.deepEqual(ACTIVE_LOCALES,["en"],"Do not activate incomplete site translations because one content group is ready");
console.log("PASS: all 10 Romanian biography drafts preserve source metadata and structure, stale source text is rejected, and incomplete locale rollout stays blocked.");
