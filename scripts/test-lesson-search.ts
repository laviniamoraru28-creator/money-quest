import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {findLessons,normalizeSearch} from "../src/lib/lesson-search";
import {LESSON_STRUCTURES} from "../src/content/curriculum/structures";
for(const locale of ["en","ro","es","fr","de","it","pt","nl","pl"]){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 for(const lesson of LESSON_STRUCTURES){
  const copy=messages.curriculum[lesson.id];
  const results=findLessons(messages.curriculum,copy.title);
  assert(results.some(r=>r.id===lesson.id),`${locale}: title missing from search ${lesson.id}`);
  assert(results.every(r=>r.href.includes(`/world/${r.worldId}/lesson/${r.id}`)));
 }
 assert.equal(findLessons(messages.curriculum,"zzqqxxnotaword").length,0);
}
const ro=JSON.parse(readFileSync("messages/ro.json","utf8"));
for(const query of ["buget","nevoi","economisire"]){const results=findLessons(ro.curriculum,query);assert(results.length>0,`Missing keyword: ${query}`);}
assert.deepEqual(findLessons(ro.curriculum,"nevoi"),findLessons(ro.curriculum," NEVOI "));
assert.equal(normalizeSearch("Dorințe, Łódź"),"dorinte, lodz");
console.log("PASS: translated lesson titles, Romanian keywords, accents and real lesson routes across nine languages.");
