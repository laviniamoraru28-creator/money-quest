import {test, expect} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';

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

for (const band of ['explorer', 'builder', 'strategist']) {
  for (const locale of band === 'explorer' ? LOCALES : ['en']) {
    for (const width of band === 'explorer' ? WIDTHS : [320]) {
      test(`${locale}/${band} at ${width}px has one activity navigation bar`, async ({page}) => {
        await page.setViewportSize({width, height: 844});
        await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
        const lesson = lessonWithPrevious(band);
        await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
        const hud = page.locator('[data-hud-band] nav');
        await expect(hud).toBeVisible();
        await expect(hud.locator('a').first()).toHaveAccessibleName(/.+/);
        await expect(hud.locator('select').nth(1)).toHaveValue(band);
        await expect(page.locator('main button', {hasText: '🏠'})).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    }
  }
}
