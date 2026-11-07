import assert from "node:assert/strict";
import {museumRooms} from "../src/content/discovery";
import {LOCALES} from "../src/i18n/config";
import {draftDiscoveryPresentation} from "../src/lib/i18n/discovery-presentation";
import {draftLaboratoryPresentation} from "../src/lib/i18n/laboratory-presentation";
import {learningLabs} from "../src/content/learning-labs";
import {labTaskAtLevel} from "../src/content/lab-age-variants";

let museumCount=0,labCount=0;
for(const locale of LOCALES){
 for(const room of museumRooms){
  const view=draftDiscoveryPresentation("museum",locale,room.slug);
  const assessments=view.ageAssessments!;
  assert.equal(assessments.length,3);
  assert.equal(new Set(assessments.map(q=>q.question)).size,3,`${locale}/${room.slug}: distinct questions`);
  assert.equal(new Set(assessments.map(q=>JSON.stringify(q.answers))).size,3,`${locale}/${room.slug}: distinct choices`);
  assert.equal(new Set(assessments.map(q=>q.explanation)).size,3,`${locale}/${room.slug}: distinct feedback`);
  assert.deepEqual(assessments[0].answers,view.item!.quiz.answers,"Preserve the concrete Explorer question");
  for(const assessment of assessments){
   assert.equal(assessment.answers.length,3);
   assert.equal(new Set(assessment.answers).size,3);
   assert(Number.isInteger(assessment.correct)&&assessment.correct>=0&&assessment.correct<3);
   for(const text of [assessment.question,...assessment.answers,assessment.explanation]){
    assert(text.trim());assert.equal(text,text.normalize("NFC"));assert(!/[\uFFFD<>]/u.test(text));
   }
   museumCount++;
  }
  if(locale!=="en"){
   const english=draftDiscoveryPresentation("museum","en",room.slug).ageAssessments!;
   for(let level=0;level<3;level++)assert.notEqual(assessments[level]!.question,english[level]!.question);
  }
 }
 for(const lab of learningLabs){
  const view=draftLaboratoryPresentation(lab,locale);
  for(const task of view.lab.tasks){
   const readings=[0,1,2].map(level=>labTaskAtLevel(lab.slug,task,level,view.variants));
   assert.equal(new Set(readings.map(r=>r.situation)).size,3,`${locale}/${lab.slug}/${task.id}: distinct questions`);
   assert.equal(new Set(readings.map(r=>JSON.stringify(r.choices))).size,3);
   assert.equal(new Set(readings.map(r=>r.explanation)).size,3);
   labCount+=3;
  }
 }
}
assert.equal(museumCount,270);assert.equal(labCount,594);
console.log(`PASS: ${museumCount} museum and ${labCount} lab age editions across nine languages; distinct questions, answer sets and feedback; valid answer keys.`);
