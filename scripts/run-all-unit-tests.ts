#!/usr/bin/env node
/**
 * Runs every pure-logic unit test script in this directory and reports
 * one clear pass/fail summary — `npm run test:unit`. This replaces
 * manually listing all 20 scripts in an ad-hoc shell loop each time
 * (the pattern used throughout this project's development so far),
 * which is exactly the kind of thing that silently misses a newly
 * added script if someone forgets to add it to the list by hand.
 *
 * Auto-discovers every `test-*.ts` and `validate-*.ts` file in this
 * directory (excluding itself) rather than hardcoding a list, so a
 * new test script is picked up automatically the next time this runs
 * — no separate "register it here too" step to forget.
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const scriptsDir = __dirname;
const testFiles = readdirSync(scriptsDir)
  .filter((f) => (f.startsWith("test-") || f.startsWith("validate-")) && f.endsWith(".ts"))
  .filter((f) => f !== path.basename(__filename))
  .sort();

if (testFiles.length === 0) {
  console.error("No test-*.ts or validate-*.ts scripts found in scripts/ — nothing to run.");
  process.exit(1);
}

console.log(`Running ${testFiles.length} unit test suites...\n`);

const results: { file: string; passed: boolean; durationMs: number }[] = [];

for (const file of testFiles) {
  const start = Date.now();
  const result = spawnSync("npx", ["tsx", path.join(scriptsDir, file)], {
    stdio: "inherit",
    env: process.env,
  });
  const durationMs = Date.now() - start;
  const passed = result.status === 0;
  results.push({ file, passed, durationMs });
  console.log(""); // spacer between suites' own output
}

console.log("=".repeat(60));
console.log("Summary");
console.log("=".repeat(60));
for (const r of results) {
  const status = r.passed ? "PASS" : "FAIL";
  console.log(`${status}  ${r.file}  (${r.durationMs}ms)`);
}

const failures = results.filter((r) => !r.passed);
const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);
console.log("=".repeat(60));
console.log(`${results.length - failures.length}/${results.length} suites passed (${totalMs}ms total)`);

if (failures.length > 0) {
  console.log(`\nFailed: ${failures.map((f) => f.file).join(", ")}`);
  process.exit(1);
}

process.exit(0);
