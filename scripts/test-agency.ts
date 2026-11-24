import assert from "node:assert/strict";
import { initial, decide, costs } from "../src/lib/agency/engine";
for (const band of ["explorer", "builder", "strategist"] as const) {
  const start = initial(band);
  const next = decide(start, costs[0], 1);
  assert.equal(next.balance, start.balance - 4);
  assert.equal(next.impact, 2);
  assert.deepEqual(next.history, [1]);
  assert.deepEqual(start.history, []);
  assert.equal(decide(start, costs[0], 99), start);
  assert.equal(decide(start, [{cost: -1, impact: 0}], 0), start);
  assert.equal(decide(start, [{cost: start.balance + 1, impact: 0}], 0), start);
}
console.log("Agency engine tests passed");
