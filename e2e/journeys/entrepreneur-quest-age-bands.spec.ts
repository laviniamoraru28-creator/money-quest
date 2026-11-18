import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createDefaultState as createLocalProgressDefault} from '../../src/lib/local-progress/state';
import {createDefaultState} from '../../src/lib/entrepreneur-quest/state';
import {EQ_STAGES} from '../../src/content/entrepreneur-quest/structures';

/** Explorer (6-8) gets a tap-only coin stepper for the numeric Build
 * stages instead of a typed decimal input - a child who cannot yet
 * read independently cannot type a price and read back a currency
 * symbol. Builder and Strategist keep the existing typed input
 * (see business-save-and-simulate.spec.ts for Builder's own coverage
 * of that), since nothing in the brief asks for anything other than
 * Explorer to drop typed numeric entry. */

async function seedAtStage(page: Page, band: 'explorer'|'builder'|'strategist', stageOrder: number) {
 const eq = createDefaultState();
 eq.completedStageIds = EQ_STAGES.filter(stage => stage.order < stageOrder).map(stage => stage.id);
 await page.addInitScript(([localProgress, eqState]) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
  localStorage.setItem('moneyquest_entrepreneur_quest_v1', JSON.stringify(eqState));
 }, [{...createLocalProgressDefault(), ageBand: band}, {byBand: {[band]: eq}}]);
}

test('Explorer sees a tap-only coin stepper for Understand Costs, not a typed field', async ({page}) => {
 await seedAtStage(page, 'explorer', 9);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading', {name: 'Understand Costs', exact: true})).toBeVisible();
 await expect(page.getByRole('spinbutton')).toHaveCount(0);
 const increase = page.getByRole('button', {name: /Increase/i});
 const decrease = page.getByRole('button', {name: /Decrease/i});
 await expect(increase).toBeVisible();
 await expect(decrease).toBeVisible();
 await expect(page.getByText('£2.00', {exact: true})).toBeVisible();
 await increase.click();await increase.click();await increase.click();
 await expect(page.getByText('£5.00', {exact: true})).toBeVisible();
 await decrease.click();
 await expect(page.getByText('£4.00', {exact: true})).toBeVisible();
 await page.getByRole('button', {name: 'Save and Continue', exact: true}).click();
 await expect(page.getByRole('heading', {name: 'Set Your Price', exact: true})).toBeVisible();
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).byBand.explorer.business.costPerUnitMinorUnits);
 expect(saved).toBe(400);
});

test('Explorer coin stepper never goes below 1 coin or above the 50-coin cap', async ({page}) => {
 test.setTimeout(60000);
 await seedAtStage(page, 'explorer', 9);
 await page.goto('/en/entrepreneur-quest/build');
 const decrease = page.getByRole('button', {name: /Decrease/i});
 const increase = page.getByRole('button', {name: /Increase/i});
 // starts at the default cost (2 coins) - one tap reaches the 1-coin floor
 await decrease.click();
 await expect(page.getByText('£1.00', {exact: true})).toBeVisible();
 await expect(decrease).toBeDisabled();
 for (let i = 0; i < 49; i++) await increase.click();
 await expect(page.getByText('£50.00', {exact: true})).toBeVisible();
 await expect(increase).toBeDisabled();
});

test('Explorer sees money-in/money-out coin piles for Calculate Your Profit, not a bare subtraction', async ({page}) => {
 const eq = createDefaultState();
 eq.completedStageIds = EQ_STAGES.filter(stage => stage.order < 13).map(stage => stage.id);
 eq.latestSimulatorRun = {
  startingMoneyMinorUnits: 5000, materialsMinorUnits: 0, packagingMinorUnits: 0, advertisingMinorUnits: 0, savedAsideMinorUnits: 0,
  unitsMade: 10, unitsSold: 8, salesMinorUnits: 1600, costsMinorUnits: 800, profitMinorUnits: 800, remainingMoneyMinorUnits: 5800,
 };
 await page.addInitScript(([localProgress, eqState]) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
  localStorage.setItem('moneyquest_entrepreneur_quest_v1', JSON.stringify(eqState));
 }, [{...createLocalProgressDefault(), ageBand: 'explorer'}, {byBand: {explorer: eq}}]);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading', {name: 'Calculate Your Profit', exact: true})).toBeVisible();
 await expect(page.getByText('Money coming in', {exact: true})).toBeVisible();
 await expect(page.getByText('Money going out', {exact: true})).toBeVisible();
 await expect(page.getByText('£16.00', {exact: true})).toBeVisible();
 await expect(page.getByText('£8.00', {exact: true})).toBeVisible();
 await expect(page.getByText("What's left: £8.00", {exact: true})).toBeVisible();
});

test('Explorer coin stepper has no accessibility violations and fits a 320px mobile screen', async ({page}) => {
 await page.setViewportSize({width: 320, height: 760});
 await seedAtStage(page, 'explorer', 9);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading', {name: 'Understand Costs', exact: true})).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
 const accessibility = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
 expect(accessibility.violations).toEqual([]);
 // tap-only: keyboard focus reaches both stepper buttons, same as any other button
 const increase = page.getByRole('button', {name: /Increase/i});
 await increase.focus();
 await expect(increase).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.getByText('£3.00', {exact: true})).toBeVisible();
});

for (const band of ['builder', 'strategist'] as const) test(`${band} keeps the existing typed field for Understand Costs (regression)`, async ({page}) => {
 await seedAtStage(page, band, 9);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading', {name: 'Understand Costs', exact: true})).toBeVisible();
 await expect(page.getByRole('spinbutton')).toBeVisible();
 await expect(page.getByRole('button', {name: /Increase/i})).toHaveCount(0);
});
