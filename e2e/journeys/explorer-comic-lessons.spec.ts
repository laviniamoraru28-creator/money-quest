import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {EXPLORER_COMIC_TOPICS} from '../../src/content/explorer-comic-topics';

/**
 * Regression coverage for replacing Explorer's text+illustration lesson
 * panel with the supplied English comic strips (see
 * ExplorerComicLesson). Scope: English Explorer only, across all 10
 * topics — every other locale/age band must render exactly as it did
 * before this change.
 */
const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const explorerLessons = LESSON_STRUCTURES.filter((l) => l.ageBand === 'explorer');

function lessonFor(topicId: string) {
  return explorerLessons.find((l) => l.topicId === topicId)!;
}

function progress(ageBand: string) {
  return {ageBand, currencyCode: 'GBP', xpTotal: 0, walletBalanceMinorUnits: 0, completedActivityIds: [], goals: [], earnedBadgeIds: []};
}

for (const topicId of EXPLORER_COMIC_TOPICS) {
  test(`en/explorer ${topicId}: shows its comic strip, not the old illustration, with activities intact after it`, async ({page}) => {
    const lesson = lessonFor(topicId);
    const title = en.curriculum[lesson.id].title;
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);

    const comic = page.locator(`[data-explorer-comic-lesson="${topicId}"]`);
    await expect(comic).toBeVisible();
    await expect(comic.locator('img')).toHaveAttribute('src', `/images/money-quest/lessons/comics/${topicId}.webp`);
    await expect.poll(() => comic.locator('img').evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
    // The old per-topic illustration and prose panel must not also be
    // rendered — no stacked/duplicate lesson screen.
    await expect(page.locator('[data-lesson-illustration]')).toHaveCount(0);
    await expect(page.getByText(en.lesson.newWords, {exact: true})).toHaveCount(0);

    // A real heading identifies which lesson this is (focus target, and
    // what a screen reader announces first), matching the title the
    // comic itself was mapped against.
    await expect(page.locator('[data-lesson-section="lesson"] h1')).toHaveText(title);

    // No autoplay: nothing has been read aloud until Listen is clicked.
    await page.addInitScript(() => {
      const calls: string[] = [];
      (window as unknown as {speechCalls: string[]}).speechCalls = calls;
      Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {cancel() {}, speak(u: {text: string}) {calls.push(u.text);}}});
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {configurable: true, value: class {text: string; constructor(t: string) {this.text = t;}}});
    });
    await page.reload();
    expect(await page.evaluate(() => (window as unknown as {speechCalls: string[]}).speechCalls)).toEqual([]);
    // Exactly one Listen control for the comic (no duplicate audio
    // controls stacked alongside it).
    const listenButtons = comic.getByRole('button', {name: 'Listen', exact: true});
    await expect(listenButtons).toHaveCount(1);
    await listenButtons.click();
    const spoken = await page.evaluate(() => (window as unknown as {speechCalls: string[]}).speechCalls);
    expect(spoken.length).toBeGreaterThan(0);

    // The lesson's own activities still follow directly after the
    // comic, in the same order, fully functional — not replaced or
    // removed.
    await expect(page.locator('[data-explorer-interactive-lesson]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test('en/explorer: title, then guide, then comic, then activities — in that order, for every comic topic', async ({page}) => {
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  for (const topicId of EXPLORER_COMIC_TOPICS) {
    const lesson = lessonFor(topicId);
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    const order = await page.evaluate(() => {
      const all = Array.from(document.querySelector('main')!.querySelectorAll('*'));
      return {
        h1: all.indexOf(document.querySelector('[data-lesson-section="lesson"] h1')!),
        guide: all.indexOf(document.querySelector('aside[aria-label="Your learning guides"]')!),
        comic: all.indexOf(document.querySelector('[data-explorer-comic-lesson]')!),
        activities: all.indexOf(document.querySelector('[data-explorer-interactive-lesson]')!),
      };
    });
    expect(order.h1, topicId).toBeGreaterThanOrEqual(0);
    expect(order.h1, topicId).toBeLessThan(order.guide);
    expect(order.guide, topicId).toBeLessThan(order.comic);
    expect(order.comic, topicId).toBeLessThan(order.activities);
  }
});

for (const band of ['builder', 'strategist'] as const) {
  test(`en/${band} money_basics: no comic, lesson presentation fully unchanged`, async ({page}) => {
    const lesson = LESSON_STRUCTURES.find((l) => l.ageBand === band && l.topicId === 'money_basics')!;
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    await expect(page.locator('[data-lesson-illustration="money_basics"]')).toBeVisible();
    await expect(page.locator('[data-explorer-comic-lesson]')).toHaveCount(0);
    await expect(page.locator('[data-lesson-section="lesson"] h1')).toHaveText(en.curriculum[lesson.id].title);
  });
}

test('ro/explorer money_basics: no English-only comic, existing Romanian lesson unchanged', async ({page}) => {
  const lesson = lessonFor('money_basics');
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  await page.goto(`/ro/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  await expect(page.locator('[data-lesson-illustration="money_basics"]')).toBeVisible();
  await expect(page.locator('[data-explorer-comic-lesson]')).toHaveCount(0);
  await expect(page.locator('[data-explorer-interactive-lesson]')).toBeVisible();
});

test('en/explorer money_basics: no leftover "Back to forms of money" button once the intro it pointed to is removed', async ({page}) => {
  const lesson = lessonFor('money_basics');
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  await expect(page.getByRole('button', {name: en.lesson.backToMoneyForms, exact: true})).toHaveCount(0);
  // Builder keeps it — its own intro section was never removed.
  const builderLesson = LESSON_STRUCTURES.find((l) => l.ageBand === 'builder' && l.topicId === 'money_basics')!;
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('builder'));
  await page.goto(`/en/play/world/${builderLesson.worldId}/lesson/${builderLesson.id}`);
  await expect(page.getByRole('button', {name: en.lesson.backToMoneyForms, exact: true})).toBeVisible();
});

test('en/explorer coin-cove world page no longer shows the money-forms intro before the first lesson', async ({page}) => {
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  await page.goto('/en/play/world/coin-cove');
  await expect(page.getByRole('heading', {name: en.play.chooseYourLevel})).toHaveCount(0);
  await expect(page.locator('#money-examples-heading')).toHaveCount(0);
  await expect(page.locator('[data-explorer-mini-shop]')).toHaveCount(0);
  // The first lesson link is reachable directly — nothing to click
  // through first.
  const lesson = lessonFor('money_basics');
  await expect(page.locator(`main a[href="/en/play/world/coin-cove/lesson/${lesson.id}"]`)).toBeVisible();
});

const introStillShown: readonly [string, string, boolean][] = [['en', 'builder', true], ['en', 'strategist', true], ['ro', 'explorer', true]];
for (const [locale, band, shouldShowIntro] of introStillShown) {
  test(`${locale}/${band} coin-cove world page keeps its money-forms intro`, async ({page}) => {
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
    await page.goto(`/${locale}/play/world/coin-cove`);
    await expect(page.locator('#money-examples-heading')).toBeVisible({visible: shouldShowIntro});
  });
}

test('en/explorer full money_basics journey: comic, then the exact same activities, then reward, with no duplicate screens', async ({page}) => {
  const lesson = lessonFor('money_basics');
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  await page.goto(`/en/play/world/coin-cove/lesson/${lesson.id}`);

  await expect(page.locator('[data-explorer-comic-lesson="money_basics"]')).toBeVisible();
  await expect(page.locator('[data-explorer-comic-lesson]')).toHaveCount(1);

  const discover = page.locator('[data-explorer-discover] button[aria-pressed]');
  await expect(discover).toHaveCount(3);
  for (let i = 0; i < 3; i++) await discover.nth(i).click();
  await page.locator('[data-explorer-discover] button:not([aria-pressed]):not([title])').click();

  await expect(page.locator('[data-explorer-coin-count]')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.locator('[data-explorer-coin-count] button:not([title])').nth(1).click();
  await page.locator('[data-explorer-coin-count] button').last().click();
  await page.locator('[data-explorer-coin-count] button').last().click();

  await expect(page.locator('[data-explorer-mini-shop]')).toBeVisible();
  await page.locator('[data-explorer-mini-shop] button[aria-pressed]').first().click();
  await page.locator('[data-explorer-mini-shop] button:not([aria-pressed]):not([title])').first().click();

  await expect(page.locator('[data-explorer-picture-choice]')).toBeVisible();
  // Comic must still be the only one on screen — the activity flow
  // never remounts or duplicates it.
  await expect(page.locator('[data-explorer-comic-lesson]')).toHaveCount(1);
});

test('en/explorer: exactly one Listen control per distinct piece of content, none duplicated, every comic topic', async ({page}) => {
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  for (const topicId of EXPLORER_COMIC_TOPICS) {
    const lesson = lessonFor(topicId);
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    // Exactly one Listen button each for: the sitewide page-read-aloud
    // toolbar, the instructional guide, and the comic itself. A
    // fourth (the first activity stage's own) is topic-dependent but
    // never more than one at a time, since ExplorerInteractiveLesson
    // only ever mounts a single stage.
    await expect(page.locator('aside[aria-label="Page read-aloud"]').getByRole('button', {name: 'Listen', exact: true})).toHaveCount(1);
    await expect(page.locator('aside[aria-label="Your learning guides"]').getByRole('button', {name: 'Listen', exact: true})).toHaveCount(1);
    await expect(page.locator('[data-explorer-comic-lesson]').getByRole('button', {name: 'Listen', exact: true})).toHaveCount(1);
    expect(await page.getByRole('button', {name: 'Listen', exact: true}).count(), topicId).toBe(4);
  }
});
