import assert from "node:assert/strict";
import {learningLabs} from "../src/content/learning-labs";
import {labTaskAtLevel,labAgeVariants} from "../src/content/lab-age-variants";
const fields=["idea","situation","explanation"] as const;
for(const lab of learningLabs)for(const task of lab.tasks){
  assert.ok(labAgeVariants[`${lab.slug}:${task.id}`],`No authored variants for ${lab.slug}/${task.id}`);
  const versions=[0,1,2].map(level=>labTaskAtLevel(lab.slug,task,level));
  for(const field of fields)assert.equal(new Set(versions.map(item=>item[field])).size,3,`${lab.slug}/${task.id}: repeated ${field}`);
  assert.equal(new Set(versions.map(item=>JSON.stringify(item.choices))).size,3,`${lab.slug}/${task.id}: repeated answer wording`);
  for(const item of versions){assert.ok(item.choices[item.correct]);assert.equal(new Set(item.choices).size,3);}
}
console.log("PASS: all 22 lab tasks have 3 distinct ideas, scenarios, answer sets and explanations, not only different practical challenges.");
