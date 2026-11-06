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
 const answer=()=>page.getByRole('radio',{name:messages.curriculum[lesson.id].quiz.correctAnswer,exact:true}).check();
 await answer();await page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true}).click();
 await expect(page.locator('[data-coin-award]')).toHaveCount(0);
 await expect(page.getByText(messages.activityGuide.lessonComplete,{exact:true})).toBeVisible();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!));
 const earned=await read();expect(earned.xpTotal).toBeGreaterThan(0);expect(earned.completedActivityIds.filter((id:string)=>id===lesson.id)).toHaveLength(1);
 await page.reload();expect(await read()).toEqual(earned);
 await expect(page.getByText(messages.lesson.alreadyCompleted,{exact:true})).toBeVisible();
 await expect(page.getByRole('radio').first()).toBeDisabled();
 await expect(page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
 await page.getByRole('button',{name:messages.lesson.continueToLesson.replace('{title}',messages.curriculum[lesson.id].title),exact:true}).click();
 expect(await read()).toEqual(earned);await expect(page.locator('[data-coin-award]')).toHaveCount(0);
});
