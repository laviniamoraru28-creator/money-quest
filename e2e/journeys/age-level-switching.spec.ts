import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {GAME_STRUCTURES} from '../../src/game-engine/structures';

const messages = JSON.parse(readFileSync('messages/en.json', 'utf8'));

/**
 * Regression coverage for the age-band redirect: both the lesson page
 * and the game page bake the currently-selected age band into their
 * own URL (`{band}-{topic}-l1`, `game-{band}-{key}`). If a child
 * switches levels (via /play's "Change level") while an activity for
 * the OLD band is still open in the page, that stale URL must redirect
 * to the SAME topic/game under the NEW band — not keep rendering the
 * old band's content under the new band's "Your level" label. The
 * lesson page had this fix already (see fix/lesson-age-band-routing);
 * the game page's own equivalent gap is what this file locks in.
 */
async function chooseLevel(page: import('@playwright/test').Page, label: RegExp) {
  await page.goto('/en/play');
  const changeLevel = page.getByRole('button', {name: messages.play.changeLevel, exact: true});
  if (await changeLevel.isVisible().catch(() => false)) await changeLevel.click();
  await page.getByRole('button', {name: label}).click();
}

test('switching from Builder to Strategist redirects an open lesson to the new band', async ({page}) => {
  const lesson = LESSON_STRUCTURES.find((l) => l.topicId === 'money_basics' && l.ageBand === 'builder')!;
  await chooseLevel(page, /Builder.*9-11/);
  await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  await expect(page.locator('[data-lesson-section] h1')).toHaveText(messages.curriculum[lesson.id].title);

  await chooseLevel(page, /Strategist.*12-14/);
  // Revisit the now-stale Builder lesson URL directly.
  await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  const strategistLesson = LESSON_STRUCTURES.find((l) => l.topicId === 'money_basics' && l.ageBand === 'strategist')!;
  await expect(page).toHaveURL(new RegExp(`/lesson/${strategistLesson.id}$`));
  await expect(page.locator('[data-lesson-section] h1')).toHaveText(messages.curriculum[strategistLesson.id].title);
});

test('switching from Builder to Strategist redirects an open game to the new band', async ({page}) => {
  const game = GAME_STRUCTURES.find((g) => g.key === 'needs-or-wants')!;
  await chooseLevel(page, /Builder.*9-11/);
  const builderHref = `/en/play/world/${game.worldId}/game/game-builder-${game.key}`;
  await page.goto(builderHref);
  await expect(page.getByText(/YOUR LEVEL/i)).toContainText('Builder');

  await chooseLevel(page, /Strategist.*12-14/);
  // Revisit the now-stale Builder game URL directly.
  await page.goto(builderHref);
  await expect(page).toHaveURL(new RegExp(`/game/game-strategist-${game.key}$`));
  await expect(page.getByText(/YOUR LEVEL/i)).toContainText('Strategist');
  // The rendered round must be the Strategist variant's own content, not a
  // leftover Builder round under the new label.
  const strategistVariant = game.variants.find((v) => v.ageBand === 'strategist')!;
  const strategistRounds = messages.games[game.key].variants.find((v: {ageBand: string}) => v.ageBand === 'strategist').rounds;
  await expect(page.getByText(strategistRounds[0].prompt, {exact: false})).toBeVisible();
  void strategistVariant;
});

test('switching to a band with no variant for the open game shows "not available", not stale content', async ({page}) => {
  // bank-builder only has explorer variants — switching away from Explorer
  // while it is open must not keep rendering it under the wrong label.
  const game = GAME_STRUCTURES.find((g) => g.key === 'bank-builder')!;
  await page.goto('/en/play');
  await page.getByRole('button', {name: /Explorer.*6-8/}).click();
  const explorerHref = `/en/play/world/${game.worldId}/game/game-explorer-${game.key}`;
  await page.goto(explorerHref);
  await expect(page.getByText(/YOUR LEVEL/i)).toContainText('Explorer');

  await chooseLevel(page, /Builder.*9-11/);
  await page.goto(explorerHref);
  await expect(page).toHaveURL(new RegExp(`/game/game-explorer-${game.key}$`));
  await expect(page.getByText(messages.play.gameNotAvailable, {exact: true})).toBeVisible();
});
