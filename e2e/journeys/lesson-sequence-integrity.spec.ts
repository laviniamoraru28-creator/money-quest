import {test, expect} from '@playwright/test';

/**
 * Regression coverage for the money-quest learning-sequence audit:
 * money_basics' "Back to forms of money" toggle used to conditionally
 * mount/unmount the examples vs. lesson sections, which silently reset
 * whatever was in progress inside the lesson section every time a
 * child went to look at the money-forms reference and came back —
 * an Explorer child lost their place in the multi-stage interactive
 * flow, and a Builder/Strategist child lost their selected quiz
 * answer. Both sections now stay mounted and are only toggled with
 * `hidden`, so neither should happen any more.
 */
test('Explorer: visiting Money Forms and returning keeps lesson progress (no stale overlay)', async ({page}) => {
  await page.goto('/en/play');
  await page.getByRole('button', {name: /Explorer.*6-8/}).click();
  await page.goto('/en/play/world/coin-cove/lesson/explorer-money_basics-l1');
  for (const label of ['Coin', 'Banknote', 'Debit card']) await page.getByRole('button', {name: label}).click();
  await page.getByRole('button', {name: 'Continue'}).click();
  await expect(page.locator('[data-explorer-coin-count]')).toBeVisible();

  await page.getByRole('button', {name: 'Back to forms of money'}).click();
  await expect(page.locator('[data-lesson-section="examples"]')).toBeVisible();
  // The lesson section's own content must not still be showing underneath
  // (no stale overlay) while the examples section is the one in view.
  await expect(page.locator('[data-lesson-section="lesson"]')).toBeHidden();

  await page.getByRole('button', {name: /^Continue:/}).click();
  await expect(page.locator('[data-lesson-section="examples"]')).toBeHidden();
  // The exact stage the child left (coin counting), not reset to stage 0.
  await expect(page.locator('[data-explorer-coin-count]')).toBeVisible();
  await expect(page.locator('[data-explorer-discover]')).toHaveCount(0);
});

test('Builder: visiting Money Forms and returning keeps the selected quiz answer', async ({page}) => {
  await page.goto('/en/play');
  await page.getByRole('button', {name: /Builder.*9-11/}).click();
  await page.goto('/en/play/world/coin-cove/lesson/builder-money_basics-l1');
  const firstOption = page.getByRole('radio').first();
  await firstOption.check();
  await expect(firstOption).toBeChecked();

  await page.getByRole('button', {name: 'Back to forms of money'}).click();
  await page.getByRole('button', {name: /^Continue:/}).click();

  await expect(firstOption).toBeChecked();
});
