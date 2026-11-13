import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {LOCALES} from '../../src/i18n/config';
import {siteControlsCopy} from '../../src/content/site-controls-copy';
import {shopCatalogueCopy} from '../../src/content/shop-catalogue-copy';
import {reviewsCopy} from '../../src/content/reviews-copy';
import {moneyExamplesCopy} from '../../src/content/money-examples-copy';
for(const locale of LOCALES){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 test(`${locale}: menu-only destinations, original money pictures and lesson keyword search`,async({page})=>{
  await page.goto(`/${locale}`);
  const hero=page.locator('[data-homepage-hero] img');
  await expect(hero).toBeVisible();await expect.poll(()=>hero.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  await expect(page.locator('main').getByRole('heading',{name:reviewsCopy[locale].title,exact:true})).toHaveCount(0);
  await expect(page.locator('footer a[href$="/reviews"]')).toHaveCount(0);
  await page.getByRole('button',{name:messages.navMenu.openMenu,exact:true}).click();
  const menu=page.getByRole('dialog',{name:messages.navMenu.title,exact:true});
  for(const href of ['/play/goals','/play/simulator','/reviews','/brain-lab','/mind-lab'])await expect(menu.locator(`a[href="/${locale}${href}"]`)).toBeVisible();
  const search=menu.getByRole('searchbox');
  await search.fill(locale==='ro'?'nevoi':messages.curriculum['explorer-money_basics-l1'].title);
  const lesson=menu.locator('a[href*="/lesson/"]').first();
  await expect(lesson).toBeVisible();const selectedHref=await lesson.getAttribute("href");const band=selectedHref!.split("/").at(-1)!.split("-")[0];await lesson.click();
  await expect(page.locator('[data-lesson-section="lesson"]')).toBeVisible();
  await expect(menu).toBeHidden();
  await page.goto(`/${locale}/play/world/coin-cove/lesson/${band}-money_basics-l1`);
  await page.getByRole('button',{name:messages.lesson.backToMoneyForms,exact:true}).click();
  for(const kind of ['coins','banknote']){const image=page.locator(`[data-lesson-section="examples"] img[src="/images/money-quest/money/${kind}.webp"]`);await expect(image).toBeVisible();await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);}
  await expect(page.getByRole('button',{name:moneyExamplesCopy[locale].coins,exact:true})).toBeVisible();
  await page.goto(`/${locale}/play`);
  await expect(page.locator('main a[href$="/brain-lab"]')).toHaveCount(0);
  await expect(page.locator('main a[href$="/play/goals"]')).toHaveCount(0);
  await page.goto(`/${locale}/parents/shop`);
  await expect(page.getByRole('heading',{name:shopCatalogueCopy[locale].copy.previewTitle,exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:shopCatalogueCopy[locale].copy.includedTitle,exact:true})).toHaveCount(0);
 });
 for(const section of ['entrepreneur-quest','leadership-quest','real-life-quests'])test(`${locale}/${section}: one global settings toolbar`,async({page})=>{
  await page.goto(`/${locale}/${section}`);
  await expect(page.locator('[data-settings-trigger]')).toHaveCount(1);
  await expect(page.locator('[aria-label="Learning settings"]')).toHaveCount(0);
  await expect(page.locator('aside').getByRole('button',{name:siteControlsCopy[locale].listen,exact:true}).first()).toBeVisible();
 });
}
test('Romanian budget search returns a lesson without a preselected level',async({page})=>{
 await page.goto('/ro');await page.getByRole('button',{name:'Meniu',exact:true}).click();
 const menu=page.getByRole('dialog',{name:'Explorează Money Quest',exact:true});
 await menu.getByRole('searchbox').fill('buget');await expect(menu.locator('a[href*="/lesson/"]').first()).toBeVisible();
 await menu.locator('a[href*="/lesson/"]').first().click();await expect(page.locator('[data-lesson-section="lesson"]')).toBeVisible();
});

test('English homepage retains its approved hero with reduced decorative images',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('moneyquest_accessibility_prefs_v1',JSON.stringify({imageSize:'minimal',focusMode:true})));
 await page.goto('/en');const image=page.locator('[data-homepage-hero] img');await expect(image).toBeVisible();
 await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
});
