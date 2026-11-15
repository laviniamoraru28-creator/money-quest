import {test, expect} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';

/**
 * The lesson/game header's Back / Back to the World / Home buttons must
 * stay on a single row at every supported mobile width, in every age
 * band and every locale — the label text is sr-only below the `sm`
 * breakpoint (icon-only on phones) specifically so a long translation
 * never forces a second row. See LessonPlayer.tsx and GameShell.tsx.
 */
const WIDTHS = [320, 360, 375, 390, 430] as const;
const LOCALES = ['en', 'ro', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl'] as const;

function progress(ageBand: string) {
  return {
    ageBand,
    currencyCode: 'GBP',
    xpTotal: 0,
    walletBalanceMinorUnits: 0,
    completedActivityIds: [`${ageBand}-money_basics-l1`],
    goals: [],
    earnedBadgeIds: [],
  };
}

function lessonWithPrevious(ageBand: string) {
  return LESSON_STRUCTURES.find((l) => l.ageBand === ageBand && l.topicId === 'needs_wants')!;
}

for (const width of WIDTHS) {
  for (const locale of LOCALES) {
    test(`${locale}/explorer at ${width}px: Back, Back to the World and Home stay on one row`, async ({page}) => {
      await page.setViewportSize({width, height: 844});
      await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
      const lesson = lessonWithPrevious('explorer');
      await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);

      const home = page.locator('button', {hasText: '🏠'});
      await expect(home).toBeVisible();
      const row = page.locator('button', {hasText: '🏠'}).locator('xpath=..');
      const buttons = row.locator('button');
      await expect(buttons).toHaveCount(3);
      const boxes = await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
      expect(new Set(boxes).size, `${locale} at ${width}px`).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
}

for (const band of ['builder', 'strategist'] as const) {
  test(`en/${band} at 320px: Back, Back to the World and Home stay on one row`, async ({page}) => {
    await page.setViewportSize({width: 320, height: 844});
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
    const lesson = lessonWithPrevious(band);
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    const row = page.locator('button', {hasText: '🏠'}).locator('xpath=..');
    const buttons = row.locator('button');
    await expect(buttons).toHaveCount(3);
    const boxes = await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(new Set(boxes).size).toBe(1);
  });
}

test('en/explorer at 320px: the accessible names survive moving the label into an sr-only span', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  const lesson = lessonWithPrevious('explorer');
  await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  await expect(page.getByRole('button', {name: 'Back', exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Back to the World', exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Home', exact: true})).toBeVisible();
});
