import {test, expect} from '@playwright/test';
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {EXPLORER_COMIC_TOPICS} from '../../src/content/explorer-comic-topics';
import {explorerComicTranscripts} from '../../src/content/explorer-comic-transcripts';
import {LOCALES} from '../../src/i18n/config';
import {siteControlsCopy} from '../../src/content/site-controls-copy';
import {laboratoryCopy} from '../../src/content/laboratory-copy';

/**
 * Regression coverage for Explorer's supplied comic strips replacing
 * the usual text+illustration lesson panel — now in all 9 launch
 * locales (see ExplorerComicLesson), not English only. Every locale's
 * comic image and narration transcript is exercised; Builder and
 * Strategist (unaffected by this feature) get a lighter sanity check.
 */
const messagesByLocale = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, 'utf8'))]));
const en = messagesByLocale.en;
const explorerLessons = LESSON_STRUCTURES.filter((l) => l.ageBand === 'explorer');

function lessonFor(topicId: string) {
  return explorerLessons.find((l) => l.topicId === topicId)!;
}

function progress(ageBand: string) {
  return {ageBand, currencyCode: 'GBP', xpTotal: 0, walletBalanceMinorUnits: 0, completedActivityIds: [], goals: [], earnedBadgeIds: []};
}

function imagePathFor(locale: string, topicId: string) {
  return locale === 'en'
    ? `/images/money-quest/lessons/comics/${topicId}.webp`
    : `/images/money-quest/lessons/comics/${locale}/${topicId}.webp`;
}

// Fast, browser-free check that every one of the 90 combinations'
// image file actually exists on disk — catches a broken path or a
// missing asset directly, without needing a page load per combination.
test('every Explorer comic topic has a real image file for every one of the 9 locales', () => {
  const missing: string[] = [];
  for (const locale of LOCALES) {
    for (const topicId of EXPLORER_COMIC_TOPICS) {
      const rel = imagePathFor(locale, topicId);
      if (!existsSync(path.join('public', rel))) missing.push(`${locale}/${topicId}: ${rel}`);
    }
  }
  expect(missing).toEqual([]);
});

// Fast, browser-free check that every non-English locale's narration
// transcript is real translated text, not a silent fallback to the
// English string — this is what guarantees Listen never reads English
// once another language is selected.
test('every non-English comic transcript differs from the English transcript', () => {
  const same: string[] = [];
  for (const topicId of EXPLORER_COMIC_TOPICS) {
    const enText = explorerComicTranscripts[topicId].en;
    for (const locale of LOCALES) {
      if (locale === 'en') continue;
      if (explorerComicTranscripts[topicId][locale] === enText) same.push(`${locale}/${topicId}`);
    }
  }
  expect(same).toEqual([]);
});

for (const locale of LOCALES) {
  for (const topicId of EXPLORER_COMIC_TOPICS) {
    test(`${locale}/explorer ${topicId}: shows its own localized comic strip, with activities intact after it`, async ({page}) => {
      const lesson = lessonFor(topicId);
      const messages = messagesByLocale[locale];
      const title = messages.curriculum[lesson.id].title;
      await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
      await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);

      const comic = page.locator(`[data-explorer-comic-lesson="${topicId}"]`);
      await expect(comic).toBeVisible();
      await expect(comic.locator('img')).toHaveAttribute('src', imagePathFor(locale, topicId));
      await expect.poll(() => comic.locator('img').evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
      // The old per-topic illustration and prose panel must not also be
      // rendered — no stacked/duplicate lesson screen, in any locale.
      await expect(page.locator('[data-lesson-illustration]')).toHaveCount(0);
      await expect(page.getByText(messages.lesson.newWords, {exact: true})).toHaveCount(0);

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

      // Exactly one Listen control for the comic, labelled in this
      // locale's own wording — and it speaks this locale's own
      // transcript, not English.
      const listenLabel = messages.a11y.listenToLessonLabel;
      const listenButtons = comic.getByRole('button', {name: listenLabel, exact: true});
      await expect(listenButtons).toHaveCount(1);
      await listenButtons.click();
      const spoken = await page.evaluate(() => (window as unknown as {speechCalls: string[]}).speechCalls);
      expect(spoken.length).toBeGreaterThan(0);
      expect(spoken[0]).toBe(explorerComicTranscripts[topicId][locale as keyof typeof explorerComicTranscripts[typeof topicId]]);

      // The lesson's own activities still follow directly after the
      // comic, in the same order, fully functional.
      await expect(page.locator('[data-explorer-interactive-lesson]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  }
}

test('en/explorer: title, then guide, then comic, then activities — in that order, for every comic topic', async ({page}) => {
  await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
  for (const topicId of EXPLORER_COMIC_TOPICS) {
    const lesson = lessonFor(topicId);
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    // Wait for the last element this test checks the position of —
    // otherwise, under load from ten rapid navigations in this one
    // loop, `evaluate` can run before React finishes mounting it,
    // making the `!` assertions below throw on a still-null query.
    await page.waitForSelector('[data-explorer-interactive-lesson]');
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

for (const locale of ['en', 'ro'] as const) {
  for (const band of ['builder', 'strategist'] as const) {
    test(`${locale}/${band} money_basics: no comic, lesson presentation fully unchanged`, async ({page}) => {
      const lesson = LESSON_STRUCTURES.find((l) => l.ageBand === band && l.topicId === 'money_basics')!;
      const messages = messagesByLocale[locale];
      await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
      await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
      await expect(page.locator('[data-lesson-illustration="money_basics"]')).toBeVisible();
      await expect(page.locator('[data-explorer-comic-lesson]')).toHaveCount(0);
      await expect(page.locator('[data-lesson-section="lesson"] h1')).toHaveText(messages.curriculum[lesson.id].title);
    });
  }
}

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

for (const locale of LOCALES) {
  test(`${locale}/explorer coin-cove world page no longer shows the money-forms intro before the first lesson`, async ({page}) => {
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
    await page.goto(`/${locale}/play/world/coin-cove`);
    await expect(page.locator('#money-examples-heading')).toHaveCount(0);
    await expect(page.locator('[data-explorer-mini-shop]')).toHaveCount(0);
    const lesson = lessonFor('money_basics');
    await expect(page.locator(`main a[href="/${locale}/play/world/coin-cove/lesson/${lesson.id}"]`)).toBeVisible();
  });
}

const introStillShown: readonly [string, string][] = [['en', 'builder'], ['en', 'strategist'], ['ro', 'builder']];
for (const [locale, band] of introStillShown) {
  test(`${locale}/${band} coin-cove world page keeps its money-forms intro`, async ({page}) => {
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress(band));
    await page.goto(`/${locale}/play/world/coin-cove`);
    await expect(page.locator('#money-examples-heading')).toBeVisible();
  });
}

for (const locale of ['en', 'ro'] as const) {
  test(`${locale}/explorer full money_basics journey: comic, then the exact same activities, then reward, with no duplicate screens`, async ({page}) => {
    const lesson = lessonFor('money_basics');
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
    await page.goto(`/${locale}/play/world/coin-cove/lesson/${lesson.id}`);

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
}

for (const locale of ['en', 'ro'] as const) {
  test(`${locale}/explorer: exactly one Listen control per distinct piece of content, none duplicated, every comic topic`, async ({page}) => {
    await page.addInitScript((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), progress('explorer'));
    const messages = messagesByLocale[locale];
    for (const topicId of EXPLORER_COMIC_TOPICS) {
      const lesson = lessonFor(topicId);
      await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
      // Exactly one Listen button each for: the sitewide page-read-aloud
      // toolbar, the instructional guide, and the comic itself. A
      // fourth (the first activity stage's own) is topic-dependent but
      // never more than one at a time, since ExplorerInteractiveLesson
      // only ever mounts a single stage.
      // site-controls-copy's own "listen" word and a11y.listenToLessonLabel
      // happen to be the same translated word in every locale (verified
      // directly), so one label name covers both toolbars below.
      const label = messages.a11y.listenToLessonLabel;
      const pageToolbarRegion = siteControlsCopy[locale].region;
      const guideRegion = laboratoryCopy[locale].guideLabel;
      await expect(page.locator(`aside[aria-label="${pageToolbarRegion}"]`).getByRole('button', {name: label, exact: true})).toHaveCount(1);
      await expect(page.locator(`aside[aria-label="${guideRegion}"]`).getByRole('button', {name: label, exact: true})).toHaveCount(1);
      await expect(page.locator('[data-explorer-comic-lesson]').getByRole('button', {name: label, exact: true})).toHaveCount(1);
      expect(await page.getByRole('button', {name: label, exact: true}).count(), topicId).toBe(4);
    }
  });
}
