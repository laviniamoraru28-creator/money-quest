import {test, expect, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../../src/i18n/config';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {createDefaultState} from '../../src/lib/local-progress/state';
import {moneyExamplesCopy} from '../../src/content/money-examples-copy';

const images: Record<string, string> = {
 money_basics:'money-basics', needs_wants:'needs-wants', saving:'saving', digital_money:'digital-money',
 currencies:'currencies', scams:'scams', investing_basics:'investing', junior_isa:'junior-isa',
};
async function checkLayout(page: Page) {
 expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
 const illustration=page.locator('[data-lesson-illustration]');
 const box=await illustration.boundingBox();
 expect(box).not.toBeNull();
 expect(box!.x).toBeGreaterThanOrEqual(0);
 expect(box!.x+box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
 const heading=await page.locator('[data-lesson-section="lesson"] h1').boundingBox();
 expect(heading).not.toBeNull();
 // Stacked on phones, side by side on desktop; never overlap the reading text.
 expect(box!.y+box!.height<=heading!.y || box!.x+box!.width<=heading!.x).toBe(true);
 for(const image of await illustration.locator('img').all()) {
  await expect(image).toBeVisible();
  await expect.poll(()=>image.evaluate((node:HTMLImageElement)=>node.complete && node.naturalWidth>0)).toBe(true);
  await expect(image).toHaveCSS('object-fit','contain');
 }
}

for(const locale of LOCALES) for(const band of ['explorer','builder','strategist'] as const) {
 test(`${locale}/${band}: money sections unmount and reset on forward/back navigation`, async({page})=>{
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  const lesson=LESSON_STRUCTURES.find(item=>item.ageBand===band && item.topicId==='money_basics')!;
  const title=messages.curriculum[lesson.id].title;
  await page.addInitScript(state=>localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify(state)),{...createDefaultState(),ageBand:band});
  await page.goto(`/${locale}/play/world/${lesson.worldId}`);
  await expect(page.locator('#money-examples-heading')).toBeVisible();
  await page.locator(`a[href="/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}"]`).click();
  await expect(page.locator('[data-lesson-section="lesson"]')).toBeVisible();
  await expect(page.locator('#money-examples-heading')).toHaveCount(0);
  await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
  const forms=page.locator('[data-lesson-section="examples"]');
  await expect(forms).toBeVisible();
  if(locale==='en' && band==='explorer') await page.screenshot({path:test.info().outputPath('money-forms.png'),fullPage:true});
  await expect(page.locator('[data-lesson-section="lesson"]')).toHaveCount(0);
  const first=forms.getByRole('button',{name:moneyExamplesCopy[locale].coins,exact:true});
  const card=forms.locator('.grid').getByRole('button',{name:moneyExamplesCopy[locale].card,exact:true});
  await card.click();await expect(card).toHaveAttribute('aria-pressed','true');
  await forms.getByRole('group',{name:moneyExamplesCopy[locale].question,exact:true}).getByRole('button',{name:moneyExamplesCopy[locale].cardChoice,exact:true}).click();
  const advance=page.getByRole('button',{name:messages.lesson.continueToLesson.replace('{title}',title),exact:true});
  await advance.click();
  await expect(forms).toHaveCount(0);
  await expect(page.locator('#money-examples-heading')).toHaveCount(0);
  await expect(page.locator('img[src*="/money/"]')).toHaveCount(0);
  await expect(page.locator('[data-lesson-section="lesson"] h1')).toBeFocused();
  await checkLayout(page);
  const wrong=messages.curriculum[lesson.id].quiz.options.find((option:string)=>option!==messages.curriculum[lesson.id].quiz.correctAnswer);
  await page.getByRole('radio',{name:wrong,exact:true}).check();
  await page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true}).click();
  await expect(page.getByRole('button',{name:messages.common.tryAgain,exact:true})).toBeVisible();
  await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
  await expect(forms).toBeVisible();
  await expect(first).toHaveAttribute('aria-pressed','true');
  await expect(card).toHaveAttribute('aria-pressed','false');
  await expect(forms.getByRole('group',{name:moneyExamplesCopy[locale].question,exact:true}).getByRole('button',{name:moneyExamplesCopy[locale].cardChoice,exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('[data-lesson-illustration]')).toHaveCount(0);
  await advance.click();
  await expect(forms).toHaveCount(0);
  await expect(page.getByRole('button',{name:messages.common.tryAgain,exact:true})).toHaveCount(0);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true})).toBeDisabled();
  await expect(page.locator('[data-coin-award]')).toHaveCount(0);
 });

 test(`${locale}/${band}: original artwork loads for every lesson with minimal images and focus mode`, async({page})=>{
  test.setTimeout(120000);
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(state=>{
   localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify(state));
   localStorage.setItem('moneyquest_accessibility_prefs_v1',JSON.stringify({imageSize:'minimal',focusMode:true,reducedMotion:true}));
  },{...createDefaultState(),ageBand:band});
  for(const lesson of LESSON_STRUCTURES.filter(item=>item.ageBand===band)) {
   await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
   if(lesson.topicId==='money_basics') {
    await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
    await expect(page.locator('img[src*="/money/card.webp"]')).toBeVisible();
    await page.getByRole('button',{name:messages.lesson.continueToLesson.replace('{title}',messages.curriculum[lesson.id].title),exact:true}).click();
   }
   const illustration=page.locator(`[data-lesson-illustration="${lesson.topicId}"]`);
   await expect(illustration).toBeVisible();
   await expect(page.locator('html')).toHaveAttribute('data-image-size','minimal');
   await expect(page.locator('html')).toHaveAttribute('data-focus-mode','true');
   const asset=images[lesson.topicId];
   if(asset) await expect(illustration.locator('img')).toHaveAttribute('src',`/images/money-quest/lessons/${asset}.webp`);
   else await expect(illustration.locator('svg')).toBeVisible();
   await expect(illustration.getByRole('img')).toHaveAccessibleName(messages.curriculum[lesson.id].title);
   await checkLayout(page);
   if(locale==='en' && band==='explorer') await page.screenshot({path:test.info().outputPath(`${lesson.topicId}.png`),fullPage:true});
  }
  expect(errors).toEqual([]);
 });
}
