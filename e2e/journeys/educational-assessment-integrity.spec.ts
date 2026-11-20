import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const messages = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const lessonId = 'builder-money_basics-l1';
const lesson = messages.curriculum[lessonId];
const storageKey = 'moneyquest_local_progress_v1';

function freshProgress() {
  return {ageBand: 'builder', currencyCode: 'GBP', xpTotal: 0, walletBalanceMinorUnits: 0,
    completedActivityIds: [], goals: [], earnedBadgeIds: []};
}

test('educational assessment: incorrect Builder answer explains and does not award progress', async ({page}) => {
  await page.goto('/en/play/world/coin-cove/lesson/' + lessonId);
  await page.evaluate((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), freshProgress());
  await page.reload();
  await expect(page.getByText(lesson.quiz.question, {exact: true})).toBeVisible();

  const wrong = lesson.quiz.options.find((option: string) => option !== lesson.quiz.correctAnswer);
  expect(wrong).toBeTruthy();
  await page.getByRole('radio', {name: wrong, exact: true}).check();
  await page.getByRole('button', {name: messages.lesson.checkMyAnswer}).click();

  await expect(page.getByText(lesson.quiz.explanation, {exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: messages.common.tryAgain})).toBeVisible();
  await expect.poll(async () => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    return {completed: (state.completedActivityIds || []).includes('builder-money_basics-l1'), xp: state.xpTotal || 0};
  }, storageKey)).toEqual({completed: false, xp: 0});

  await page.getByRole('button', {name: messages.common.tryAgain}).click();
  await page.getByRole('radio', {name: lesson.quiz.correctAnswer, exact: true}).check();
  await page.getByRole('button', {name: messages.lesson.checkMyAnswer}).click();

  await expect.poll(async () => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    return {completed: (state.completedActivityIds || []).includes('builder-money_basics-l1'), xp: state.xpTotal || 0};
  }, storageKey)).toEqual({completed: true, xp: 20});

  await page.reload();
  await expect.poll(async () => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    return {count: (state.completedActivityIds || []).filter((id: string) => id === 'builder-money_basics-l1').length, xp: state.xpTotal || 0};
  }, storageKey)).toEqual({count: 1, xp: 20});
});

test('educational transparency: Builder interactiveActivity text is a suggestion, not an executable exercise', async ({page}) => {
  await page.goto('/en/play/world/coin-cove/lesson/' + lessonId);
  await page.evaluate((state) => localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state)), freshProgress());
  await page.reload();
  const details = page.locator('details').filter({has: page.getByText(messages.lesson.interactiveActivityLabel, {exact: true})});
  await expect(details).toHaveCount(1);
  await details.locator('summary').click();
  await expect(details.getByText(lesson.interactiveActivity, {exact: true})).toBeVisible();
  await expect(details.locator('input, button, select, textarea')).toHaveCount(0);
});
