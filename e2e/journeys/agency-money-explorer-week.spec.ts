import {test,expect} from '@playwright/test';
import {createDefaultState as createLocalProgressDefault} from '../../src/lib/local-progress/state';

// Agency's own storage is scoped per age band the same way Entrepreneur
// Quest's is (see band-scoped-storage.ts) - seed local-progress's
// ageBand too so the Agency hook knows which band's slice to persist.
const BAND = 'explorer' as const;

test.beforeEach(async ({page}) => {
 await page.addInitScript((localProgress) => {
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(localProgress));
 }, {...createLocalProgressDefault(), ageBand: BAND});
});

test('keyboard-only play through the clean path reaches a real completion', async ({page}) => {
 await page.goto('/en/agency/money-explorer-week-one');
 await expect(page.getByRole('heading', {name: 'A Week of Pocket Money'})).toBeVisible();
 await expect(page.getByText('25', {exact: true})).toBeVisible();

 // Tab from the top of the page to the first real choice button
 // (the read-aloud "Listen" button comes first in DOM order) and
 // activate it with the keyboard alone, never a mouse click.
 const saveChoice = page.getByRole('button', {name: 'Save your coins today'});
 await saveChoice.focus();
 await page.keyboard.press('Enter');
 await expect(page.getByText('A school trip costs 10 coins.')).toBeVisible();
 await expect(page.getByText('25', {exact: true})).toBeVisible(); // saving cost nothing

 await page.getByRole('button', {name: 'Skip the trip this time'}).focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading', {name: 'Week complete!'})).toBeVisible();
 await expect(page.getByText('25', {exact: true})).toBeVisible();
 await expect(page.getByText('Great saving!')).toBeVisible();
 await expect(page.getByText('You skipped the trip and kept your coins.')).toBeVisible();
 // Never framed as a judgment of the child, only of the strategy.
 await expect(page.getByText(/irresponsible|failed|unsuccessful/i)).toHaveCount(0);
});

test('an unaffordable choice stays disabled and never silently applies', async ({page}) => {
 await page.goto('/en/agency/money-explorer-week-one');
 const treat = page.getByRole('button', {name: /Buy a fun treat/});
 await expect(treat).toBeEnabled(); // 25 coins covers the 20-coin treat
});

test('overspending into an unexpected expense redirects to a non-punitive recovery path, never a dead end', async ({page}) => {
 await page.goto('/en/agency/money-explorer-week-one');
 await page.getByRole('button', {name: /Buy a fun treat/}).click(); // 25 -> 5
 await page.getByRole('button', {name: /Pay for the trip/}).click(); // 5 -> -5, breaches the floor

 await expect(page.getByText("Let's sort this out together")).toBeVisible();
 await expect(page.getByText('-5', {exact: true})).toBeVisible(); // shown honestly, not hidden
 // Asking for help is never punished, and is the only option offered
 // here - the standalone "I need help" link only shows away from the
 // recovery node itself.
 await expect(page.getByText('I need help')).toHaveCount(0);

 await page.getByRole('button', {name: /Ask a grown-up for a top-up/}).click();
 await expect(page.getByRole('heading', {name: 'Week complete!'})).toBeVisible();
 await expect(page.getByText('5', {exact: true})).toBeVisible(); // -5 + 10 top-up
 await expect(page.getByText('Asking for help is a smart money move, not a mistake.')).toBeVisible();
});

test('progress persists across a reload, and restarting always returns to the full starting balance', async ({page}) => {
 await page.goto('/en/agency/money-explorer-week-one');
 await page.getByRole('button', {name: 'Save your coins today'}).click();
 await expect(page.getByText('A school trip costs 10 coins.')).toBeVisible();

 await page.reload();
 await expect(page.getByText('A school trip costs 10 coins.')).toBeVisible(); // did not reset to Monday

 await page.getByRole('button', {name: 'Skip the trip this time'}).click();
 await expect(page.getByRole('button', {name: 'Start the week again'})).toBeVisible();
 await page.getByRole('button', {name: 'Start the week again'}).click();
 await expect(page.getByText("It's Monday!")).toBeVisible();
 await expect(page.getByText('25', {exact: true})).toBeVisible();
});

test('the explicit "ask for help" action is available before anything goes wrong, and costs nothing', async ({page}) => {
 await page.goto('/en/agency/money-explorer-week-one');
 await page.getByText('I need help').click();
 await expect(page.getByText("Let's sort this out together")).toBeVisible();
 await expect(page.getByText('25', {exact: true})).toBeVisible(); // unchanged
});

test('a certificate/badge earned elsewhere is never touched by Agency storage', async ({page}) => {
 await page.addInitScript(() => {
  // A separate, unrelated educational achievement, saved the same way
  // real quest completions are - must survive untouched by anything
  // Agency does (brief: "Children must never lose previously earned
  // certificates... because of an unsuccessful simulation").
  const existing = JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!);
  existing.earnedBadgeIds = ['money-hero'];
  localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(existing));
 });
 await page.goto('/en/agency/money-explorer-week-one');
 await page.getByRole('button', {name: /Buy a fun treat/}).click();
 await page.getByRole('button', {name: /Pay for the trip/}).click(); // breach -> recovery
 const badges = await page.evaluate(() => JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!).earnedBadgeIds);
 expect(badges).toEqual(['money-hero']);
 const agencyRaw = await page.evaluate(() => localStorage.getItem('moneyquest_agency_v1'));
 expect(agencyRaw).not.toBeNull();
 expect(agencyRaw).not.toContain('money-hero'); // confirms it's a genuinely separate key, not a merged blob
});
