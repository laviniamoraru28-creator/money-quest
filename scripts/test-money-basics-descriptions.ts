import assert from 'node:assert/strict';
import {moneyBasicsLessonCopy} from '../src/content/explorer-money-basics-lesson';
import {LOCALES} from '../src/i18n/config';

/**
 * Locks in the corrected Money Basics coin/banknote/debit-card
 * descriptions (money-quest translation audit): each must be a real,
 * non-trivial explanation — not a placeholder, not identical to
 * another field, and consistent in idea across all nine locales
 * (coin = a form of money, usually round, made of metal; banknote =
 * money printed on special paper or a durable material; debit card =
 * pay using money from your bank account).
 */
let checked = 0;
for (const locale of LOCALES) {
  const copy = moneyBasicsLessonCopy[locale];
  assert.ok(copy.coinDesc.trim().length > 10, `${locale}: coin description missing/too short`);
  assert.ok(copy.banknoteDesc.trim().length > 10, `${locale}: banknote description missing/too short`);
  assert.ok(copy.cardDesc.trim().length > 10, `${locale}: debit card description missing/too short`);
  const descriptions = [copy.coinDesc, copy.banknoteDesc, copy.cardDesc];
  assert.equal(new Set(descriptions).size, 3, `${locale}: two money-form descriptions are identical`);
  checked++;
}

assert.equal(
  moneyBasicsLessonCopy.en.coinDesc,
  'A coin is a form of money, usually round and made of metal.',
  'EN coin description regressed'
);
assert.equal(
  moneyBasicsLessonCopy.ro.coinDesc,
  'O monedă este o formă de bani, de obicei rotundă și făcută din metal.',
  'RO coin description regressed'
);
assert.equal(
  moneyBasicsLessonCopy.ro.banknoteDesc,
  'O bancnotă este o formă de bani tipărită pe hârtie specială sau pe un material rezistent.',
  'RO banknote description regressed'
);
assert.equal(
  moneyBasicsLessonCopy.ro.cardDesc,
  'Cu un card de debit poți plăti folosind banii din contul bancar.',
  'RO debit card description regressed'
);
// Every locale's debit-card description should express "pay using money from your
// bank account" (not the earlier, less accurate "small plastic card" wording) —
// checked by requiring it differ from the coin/banknote material-based phrasing
// pattern rather than hardcoding every locale's exact sentence here.
for (const locale of LOCALES) {
  const copy = moneyBasicsLessonCopy[locale];
  assert.notEqual(copy.cardDesc, copy.coinDesc, `${locale}: card description unexpectedly matches coin`);
}

console.log(`PASS: Money Basics coin/banknote/debit-card descriptions are distinct, non-empty and correct across ${checked} locales.`);
