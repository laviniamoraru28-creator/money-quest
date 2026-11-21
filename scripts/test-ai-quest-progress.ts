import assert from "node:assert/strict";
import {parseAIQuestProgress, safeAIMissionIds, isAIQuestComplete} from "../src/lib/ai-quest/progress";

assert.deepEqual(safeAIMissionIds([0,1,1,2,3,4,5,-1,"2",null,2.5]),[0,1,2,3,4]);
assert.deepEqual(safeAIMissionIds(null),[]);
assert.deepEqual(parseAIQuestProgress(null),{explorer:[],builder:[],strategist:[]});
assert.deepEqual(parseAIQuestProgress({explorer:[0,1,2,3,4],builder:[0,1],strategist:"invalid"}),{
  explorer:[0,1,2,3,4],builder:[0,1],strategist:[]
});
const progress=parseAIQuestProgress({explorer:[0,1,2,3,4],builder:[0,1,2,3,4],strategist:[0,1,2,3]});
assert.equal(isAIQuestComplete(progress,"explorer"),true);
assert.equal(isAIQuestComplete(progress,"builder"),true);
assert.equal(isAIQuestComplete(progress,"strategist"),false);
console.log("AI Quest progress validation: passed");
