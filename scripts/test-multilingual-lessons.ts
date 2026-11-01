import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../src/i18n/config';
import {LESSON_STRUCTURES} from '../src/content/curriculum/structures';
const source=JSON.parse(readFileSync('messages/en.json','utf8'));
let lessons=0;
for(const locale of LOCALES){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 assert.deepEqual(Object.keys(messages.curriculum).sort(),LESSON_STRUCTURES.map(lesson=>lesson.id).sort());
 for(const structure of LESSON_STRUCTURES){
  const lesson=messages.curriculum[structure.id],quiz=lesson.quiz,english=source.curriculum[structure.id].quiz;
  assert.ok(quiz.options.includes(quiz.correctAnswer),`${locale}/${structure.id}: missing correct answer`);
  assert.equal(new Set(quiz.options).size,quiz.options.length,`${locale}/${structure.id}: duplicate options`);
  assert.equal(quiz.options.indexOf(quiz.correctAnswer),english.options.indexOf(english.correctAnswer),`${locale}/${structure.id}: changed answer position`);
  for(const field of ['story','explanation','learningObjective','parentNote'])assert.ok(lesson[field].trim(),`${locale}/${structure.id}: empty ${field}`);
  lessons++;
 }
 for(const topic of new Set(LESSON_STRUCTURES.map(lesson=>lesson.topicId))){
  const variants=LESSON_STRUCTURES.filter(lesson=>lesson.topicId===topic).map(lesson=>messages.curriculum[lesson.id]);
  assert.equal(new Set(variants.map(lesson=>lesson.story)).size,3,`${locale}/${topic}: reused age-level story`);
  assert.equal(new Set(variants.map(lesson=>lesson.explanation)).size,3,`${locale}/${topic}: reused age-level explanation`);
 }
 // This checks disclosure coverage, not legal certification or translation quality.
 assert.ok(messages.parentInfo.q2Body.includes('Stripe'),`${locale}: parent information must disclose optional payments`);
 assert.ok(messages.privacyPage.section1Body.includes('Stripe'),`${locale}: privacy summary must disclose optional payments`);
 assert.ok(!/no personal data collected, ever|collects \(none\)|No location data of any kind/.test(JSON.stringify(messages)));
}
console.log(`PASS: ${lessons} lesson editions preserve quiz answers, distinct age stories/explanations and reviewed privacy disclosure coverage in nine languages.`);
