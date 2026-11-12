import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createDefaultState} from '../../src/lib/local-progress/state';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {LOCALES} from '../../src/i18n/config';

for(const locale of LOCALES)for(const band of ['explorer','builder','strategist'] as const)test(`${locale}/${band}: one inline reward, persisted once, translated guidance`,async({page})=>{
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 const lesson=LESSON_STRUCTURES.find(item=>item.ageBand===band)!;
 const initial={...createDefaultState(),ageBand:band};
 await page.addInitScript(state=>{if(!localStorage.getItem('moneyquest_local_progress_v1'))localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify(state));},initial);
 await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
 await expect(page.getByText(messages.activityGuide.lessonGoal.replace('{title}',messages.curriculum[lesson.id].title),{exact:true})).toBeVisible();
 if(band==='explorer') {
  // Explorer's money_basics lesson runs its own picture-first interactive
  // flow instead of a quiz radio (see ExplorerInteractiveLesson) — drive
  // it with locale-agnostic selectors since this test covers all 9 locales.
  const discover=page.locator('[data-explorer-discover] button[aria-pressed]');
  const discoverCount=await discover.count();
  for(let i=0;i<discoverCount;i++)await discover.nth(i).click();
  await page.locator('[data-explorer-discover] button:not([aria-pressed])').click();
  await page.locator('[data-explorer-coin-count] button').nth(2).click();
  await page.locator('[data-explorer-coin-count] button').nth(2).click();
  await page.locator('[data-explorer-coin-count] button').nth(2).click();
  await page.locator('[data-explorer-coin-count] button').last().click();
  await page.locator('[data-explorer-mini-shop] button').nth(3).click();
  // Paying shows a confirmation and waits for an explicit Continue click
  // before advancing (see ExplorerMiniShop's handleContinue) — button
  // index 4 is Continue, appearing right after the four shop buttons
  // (Listen, coins, banknote, card) once a payment method is chosen.
  await page.locator('[data-explorer-mini-shop] button').nth(4).click();
  await page.locator('[data-explorer-picture-choice] button[aria-pressed]').first().click();
  await page.locator('[data-explorer-picture-choice] button').last().click();
 } else {
  const answer=()=>page.getByRole('radio',{name:messages.curriculum[lesson.id].quiz.correctAnswer,exact:true}).check();
  await answer();await page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true}).click();
 }
 await expect(page.locator('[data-coin-award]')).toHaveCount(0);
 await expect(page.getByText(messages.activityGuide.lessonComplete,{exact:true})).toBeVisible();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!));
 const earned=await read();expect(earned.xpTotal).toBeGreaterThan(0);expect(earned.completedActivityIds.filter((id:string)=>id===lesson.id)).toHaveLength(1);
 await page.reload();expect(await read()).toEqual(earned);
 await expect(page.getByText(messages.lesson.alreadyCompleted,{exact:true})).toBeVisible();
 if(band!=='explorer')await expect(page.getByRole('radio').first()).toBeDisabled();
 await expect(page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
 await page.getByRole('button',{name:messages.lesson.continueToLesson.replace('{title}',messages.curriculum[lesson.id].title),exact:true}).click();
 expect(await read()).toEqual(earned);await expect(page.locator('[data-coin-award]')).toHaveCount(0);
});
