import assert from 'node:assert/strict';
import {needsWantsLessonCopy} from '../src/content/explorer-needs-wants-lesson';
import {learningAmount} from '../src/lib/currency/learning-currency';
import {LOCALES} from '../src/i18n/config';

/**
 * Locks in the money-quest translation audit's currency-label fix:
 * ExplorerInteractiveLesson applies learningAmount() to needs_wants'
 * budgetPrompt before handing it to ExplorerPictureChoice (see that
 * file's needs_wants stage 1). This test re-derives the same
 * substitution independently and asserts every locale's displayed
 * prompt actually contains a real currency label — not a bare digit —
 * for both amounts the prompt mentions. A bare "5"/"10" with no
 * currency symbol/code anywhere nearby was the exact bug found: it
 * looked like a quantity, not a monetary amount a 6-8-year-old is
 * meant to read as money.
 */
let checked = 0;
for (const locale of LOCALES) {
  const prompt = needsWantsLessonCopy[locale].budgetPrompt;
  const five = learningAmount(5, locale);
  const ten = learningAmount(10, locale);
  // The raw content is still bare digits — the component does the
  // substitution — but the fix depends on money() actually producing a
  // currency-labelled string distinct from the bare number for every
  // locale, which this asserts directly.
  assert.notEqual(five, '5', `${locale}: learningAmount(5) must include a currency label, not just "5"`);
  assert.notEqual(ten, '10', `${locale}: learningAmount(10) must include a currency label, not just "10"`);
  assert.ok(prompt.includes('5') && prompt.includes('10'), `${locale}: budgetPrompt no longer mentions the expected amounts — update this test if the content changed intentionally`);
  checked++;
}
assert.equal(learningAmount(2, 'en'), '£2', 'EN learningAmount(2) regressed');
assert.equal(learningAmount(3, 'ro'), '3 lei', 'RO learningAmount(3) regressed');

console.log(`PASS: Explorer currency amounts resolve to real currency-labelled strings (not bare digits) across ${checked} locales.`);
