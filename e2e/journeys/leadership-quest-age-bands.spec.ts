import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createDefaultState as createLocalProgressDefault} from '../../src/lib/local-progress/state';
import {LQ_TEAM_CONFLICT_SPOT_ITEM_IDS,LQ_PRESSURE_TEST_ITEMS,LQ_PRESSURE_TEST_BUCKET_KEYS} from '../../src/content/leadership-quest/structures';
const messages=JSON.parse(readFileSync('messages/en.json','utf8'));

/** Explorer (6-8) sees fewer simultaneous options in Leadership Quest's
 * branching missions than Builder/Strategist - same existing choices/
 * items/text, just fewer of them at once (brief: "avoid abstract...
 * children should learn through actions", minimal complexity for this
 * band). Builder/Strategist are unaffected (see leadership-retry.spec.ts,
 * which never sets an ageBand and so exercises the unchanged default path). */
test('Explorer sees only 2 of the 4 existing choices in a mission-choice event', async ({page}) => {
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: 'explorer'});
 await page.goto('/en/leadership-quest/missions/everyone-has-an-idea');
 const choices = messages.leadershipQuest.missions['everyone-has-an-idea'].events['everyone-has-an-idea-choice'].choices as {key: string; label: string}[];
 expect(choices.length).toBeGreaterThanOrEqual(4);
 await expect(page.getByRole('button', {name: choices[0]!.label, exact: true})).toBeVisible();
 await expect(page.getByRole('button', {name: choices[1]!.label, exact: true})).toBeVisible();
 await expect(page.getByRole('button', {name: choices[2]!.label, exact: true})).toHaveCount(0);
 await expect(page.getByRole('button', {name: choices[3]!.label, exact: true})).toHaveCount(0);
});

test('Explorer skips the missing-task investigate step and goes straight to the decision', async ({page}) => {
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: 'explorer'});
 await page.goto('/en/leadership-quest/missions/missing-task');
 await expect(page.getByText(messages.leadershipQuest.missions['missing-task'].investigateLabel, {exact: true})).toHaveCount(0);
 const choices = messages.leadershipQuest.missions['missing-task'].events['missing-task-choice'].choices as {key: string; label: string}[];
 await expect(page.getByRole('button', {name: choices[0]!.label, exact: true})).toBeVisible();
});

test('Explorer sees 3 of the 5 existing items for Spot the Problem (both true answers kept)', async ({page}) => {
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: 'explorer'});
 await page.goto('/en/leadership-quest/missions/team-conflict');
 const items = messages.leadershipQuest.spotItems.teamConflict;
 const suspicious = LQ_TEAM_CONFLICT_SPOT_ITEM_IDS.filter((item) => item.isSuspicious);
 for (const item of suspicious) await expect(page.getByRole('button', {name: items[item.id], exact: true})).toBeVisible();
 const neutralShown = LQ_TEAM_CONFLICT_SPOT_ITEM_IDS.filter((item) => !item.isSuspicious);
 let visibleNeutralCount = 0;
 for (const item of neutralShown) if (await page.getByRole('button', {name: items[item.id], exact: true}).count() > 0) visibleNeutralCount++;
 expect(visibleNeutralCount).toBe(1);
 for (const item of suspicious) await page.getByRole('button', {name: items[item.id], exact: true}).click();
 await page.getByRole('button', {name: messages.game.checkWhatIFound, exact: true}).click();
 await expect(page.getByRole('button', {name: 'Continue', exact: true})).toBeVisible();
});

test('Explorer sees 1 item per bucket for Put It in Order (3 of the 5 existing items)', async ({page}) => {
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: 'explorer'});
 await page.goto('/en/leadership-quest/missions/pressure-test');
 const copy = messages.leadershipQuest.missions['pressure-test'];
 const group = page.getByRole('group', {name: messages.game.itemsToSort, exact: true});
 for (const bucketKey of LQ_PRESSURE_TEST_BUCKET_KEYS) {
  const item = LQ_PRESSURE_TEST_ITEMS.find((candidate) => candidate.correctBucketKey === bucketKey)!;
  await group.getByRole('button', {name: copy.problems[item.id], exact: true}).click();
  await page.getByRole('button', {name: copy.buckets[item.correctBucketKey], exact: true}).click();
 }
 await page.getByRole('button', {name: messages.game.checkMySorting, exact: true}).click();
 await expect(page.getByRole('button', {name: 'Continue', exact: true})).toBeVisible();
});

test('Explorer\'s reduced mission-choice view has no accessibility violations and fits a 320px mobile screen', async ({page}) => {
 await page.setViewportSize({width: 320, height: 760});
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: 'explorer'});
 await page.goto('/en/leadership-quest/missions/everyone-has-an-idea');
 const choices = messages.leadershipQuest.missions['everyone-has-an-idea'].events['everyone-has-an-idea-choice'].choices as {key: string; label: string}[];
 await expect(page.getByRole('button', {name: choices[0]!.label, exact: true})).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
 const accessibility = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
 expect(accessibility.violations).toEqual([]);
 const firstChoice = page.getByRole('button', {name: choices[0]!.label, exact: true});
 await firstChoice.focus();
 await expect(firstChoice).toBeFocused();
});
