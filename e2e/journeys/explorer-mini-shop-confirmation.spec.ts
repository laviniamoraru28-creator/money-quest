import {test, expect, type Page} from '@playwright/test';
import {createDefaultState} from '../../src/lib/local-progress/state';
import {LOCALES, type Locale} from '../../src/i18n/config';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {learningAmount} from '../../src/lib/currency/learning-currency';

/**
 * Regression coverage for ExplorerMiniShop's payment-confirmation fix.
 *
 * Before this fix, choosing a payment method called the activity's
 * onComplete() synchronously in the same handler that set the "you paid"
 * feedback text. React 18 batches every setState call from one event
 * handler into a single render, so the parent advanced to the next
 * activity (unmounting the shop) in the very same pass that was meant to
 * show the confirmation — the spoken narration still fired (speechSynthesis
 * is an imperative API, independent of rendering), but the visual
 * confirmation never actually painted, and a bare "2"/"3" with no currency
 * symbol was all a child could have seen even if it had.
 *
 * The fix: paying shows a confirmation (with a localized currency label,
 * not a bare digit) and an explicit Continue button; onComplete only fires
 * once that button is clicked. Play Again still resets the shop for another
 * round, without advancing.
 */
const moneyBasicsExplorerLesson = LESSON_STRUCTURES.find((l) => l.topicId === 'money_basics' && l.ageBand === 'explorer')!;

async function driveToShop(page: Page, locale: Locale) {
  await page.addInitScript(
    (state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)),
    {...createDefaultState(), ageBand: 'explorer'},
  );
  await page.goto(`/${locale}/play/world/${moneyBasicsExplorerLesson.worldId}/lesson/${moneyBasicsExplorerLesson.id}`);
  const discover = page.locator('[data-explorer-discover] button[aria-pressed]');
  // `.count()` takes an immediate snapshot — it does not wait for the page
  // to finish hydrating. Reading it right after goto() risks a false "0"
  // under load (confirmed as the actual cause of three straight CI
  // failures, always at the exact same line below: the click loop ran 0
  // times, so the Continue button that only appears once all 3 are
  // discovered never showed up, and the subsequent wait hung for its full
  // timeout waiting on something that would never arrive). Asserting the
  // count first lets Playwright's own auto-retry wait out hydration.
  await expect(discover).toHaveCount(3);
  const discoverCount = await discover.count();
  for (let i = 0; i < discoverCount; i++) await discover.nth(i).click();
  await page.locator('[data-explorer-discover] button:not([aria-pressed]):not([title])').click();
  await page.locator('[data-explorer-coin-count] button:not([title])').nth(1).click();
  await page.locator('[data-explorer-coin-count] button:not([title])').nth(1).click();
  await page.locator('[data-explorer-coin-count] button:not([title])').nth(1).click();
  await page.locator('[data-explorer-coin-count] button').last().click();
  await page.locator('[data-explorer-coin-count] button').last().click();
}

test('EN: payment confirmation is visible with a localized amount before advancing, and audio matches', async ({page}) => {
  // CI runs with --workers=2 on a single-CPU runner; this test's own steps
  // are fast, but it can land in the same window as another worker's
  // heaviest test (e.g. world-content.spec.ts's full-site render pass,
  // 25-30s on its own) and lose enough wall-clock time to the resource
  // contention to blow the 30s default — confirmed by two CI runs failing
  // at the same click with no other evidence of a real hang.
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const calls: string[] = [];
    (window as unknown as {speechCalls: string[]}).speechCalls = calls;
    Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {cancel() {}, speak(utterance: {text: string}) {calls.push(utterance.text);}}});
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {configurable: true, value: class {text: string; constructor(text: string) {this.text = text;}}});
  });
  await driveToShop(page, 'en');

  const shop = page.locator('[data-explorer-mini-shop]');
  await expect(shop).toBeVisible();
  const feedback = shop.locator('[role="status"]');
  await expect(feedback).toHaveText('');

  // Pay with "Coins" (shop button index 1: Listen, Coins, Banknote, Card).
  await shop.locator('button[aria-pressed]').first().click();

  // Requirement 1: the confirmation is visible, and the activity has NOT
  // advanced yet — the next stage's own marker must not exist.
  await expect(feedback).toBeVisible();
  await expect(feedback).not.toHaveText('');
  await expect(page.locator('[data-explorer-picture-choice]')).toHaveCount(0);
  await expect(shop).toBeVisible();

  // Requirement 3: a real currency label, not a bare digit.
  const paidText = await feedback.textContent();
  expect(paidText).toContain(learningAmount(2, 'en'));
  expect(paidText).toContain(learningAmount(3, 'en'));
  expect(paidText).not.toBe('You paid 2. You have 3 left.');

  // Requirement 2: the spoken narration says the same localized amounts
  // (not merely that *some* speech fired).
  expect(await page.evaluate(() => (window as unknown as {speechCalls: string[]}).speechCalls)).toEqual([]);
  await shop.getByRole('button',{name:'Listen',exact:true}).click();
  const spoken = await page.evaluate(() => (window as unknown as {speechCalls: string[]}).speechCalls);
  expect(spoken.some((text) => text.includes(learningAmount(2, 'en')) && text.includes(learningAmount(3, 'en')))).toBe(true);

  // The balance display itself also reflects the new amount, visibly —
  // scoped past the feedback paragraph above, which also now mentions the
  // same amount and would otherwise make this an ambiguous match.
  await expect(shop.locator('.my-5').getByText(learningAmount(3, 'en'))).toBeVisible();

  // Requirement 4: a clear Continue control, distinct from Play Again.
  const continueButton = shop.locator('button:not([aria-pressed]):not([title])').first();
  const playAgainButton = shop.locator('button:not([aria-pressed]):not([title])').last();
  await expect(continueButton).toBeVisible();
  await expect(playAgainButton).toBeVisible();

  // Requirement 6: Play Again resets the shop for another round without
  // advancing — existing navigation/replay is preserved.
  await playAgainButton.click();
  await expect(feedback).toHaveText('');
  await expect(shop.locator('.my-5').getByText(learningAmount(5, 'en'))).toBeVisible();
  await expect(page.locator('[data-explorer-picture-choice]')).toHaveCount(0);
  await expect(shop.locator('button[aria-pressed="true"]')).toHaveCount(0);

  // Pay again, then actually advance via Continue.
  await shop.locator('button[aria-pressed]').first().click();
  await expect(feedback).not.toHaveText('');
  await continueButton.click();

  // Requirement 1 (completed): advancing happens exactly once, only after
  // Continue, leaving the shop behind for the next activity.
  await expect(shop).toHaveCount(0);
  await expect(page.locator('[data-explorer-picture-choice]')).toBeVisible();
});

for (const locale of LOCALES) test(`${locale}: paid amount and remaining balance carry a real currency label`, async ({page}, info) => {
  // This checks text content only, not rendering, so (like
  // multilingual-release.spec.ts's equivalent check) it only needs one
  // browser project — halving its CI footprint and its exposure to the
  // single-CPU --workers=2 resource contention that caused a stray 60s
  // timeout here even after the first fix (see the EN test above).
  test.skip(info.project.name !== 'desktop-chrome', 'currency-label text check only needs one browser project');
  await driveToShop(page, locale);
  const shop = page.locator('[data-explorer-mini-shop]');
  await shop.locator('button[aria-pressed]').first().click();
  const feedback = shop.locator('[role="status"]');
  const paidText = await feedback.textContent();
  const price = learningAmount(2, locale);
  const remaining = learningAmount(3, locale);
  expect(price).not.toBe('2');
  expect(remaining).not.toBe('3');
  expect(paidText).toContain(price);
  expect(paidText).toContain(remaining);
  // Still hasn't advanced — the same guarantee holds in every locale.
  await expect(page.locator('[data-explorer-picture-choice]')).toHaveCount(0);
});
