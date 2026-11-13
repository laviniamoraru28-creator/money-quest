import {test,expect} from '@playwright/test';
import {LOCALES} from '../../src/i18n/config';

const moneyBasics = '/play/world/coin-cove/lesson/explorer-money_basics-l1';

test('Money Basics explains money before practice and waits for the child after counting', async ({page}) => {
  await page.setViewportSize({width:375,height:812});
  await page.goto('/ro' + moneyBasics);
  const title = page.getByRole('heading',{name:'Ce sunt banii?',exact:true});
  const pictures = page.locator('[data-explorer-discover]');
  await expect(title).toBeVisible();
  await expect(pictures.locator('img')).toHaveCount(3);
  expect(await title.evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('[data-explorer-discover]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  for (const picture of await pictures.locator('button[aria-pressed]').all()) await picture.click();
  await pictures.getByRole('button',{name:'Continuă',exact:true}).click();
  const count = page.locator('[data-explorer-coin-count]');
  for (let coin=0;coin<3;coin++) await count.getByRole('button',{name:'Adaugă'}).click();
  await count.getByRole('button',{name:'Verifică',exact:true}).click();
  await expect(count.getByRole('status')).toHaveText('Bravo!');
  await expect(page.locator('[data-explorer-mini-shop]')).toHaveCount(0);
  await count.getByRole('button',{name:'Continuă',exact:true}).press('Enter');
  await expect(page.locator('[data-explorer-mini-shop]')).toBeVisible();
});

for (const locale of LOCALES) test(`${locale}: sorting labels and answer controls fit narrow screens`,async({page},info)=>{
  test.skip(info.project.name==='desktop-chrome','checks narrow viewports in mobile projects');
  await page.goto(`/${locale}/play/world/market-town/lesson/explorer-needs_wants-l1`);
  const sort=page.locator('[data-explorer-picture-sort]');
  await expect(sort).toBeVisible();
  for(const width of [320,360,375,390]){
    await page.setViewportSize({width,height:812});
    const fits=await sort.evaluate(section=>{
      const labels=[...section.querySelectorAll<HTMLElement>('.answer-label')];
      return document.documentElement.scrollWidth<=innerWidth && labels.length>0 && labels.every(label=>{
        const button=label.closest('button')!.getBoundingClientRect();
        const bounds=label.getBoundingClientRect();
        return bounds.left>=button.left-1 && bounds.right<=button.right+1 && label.scrollWidth<=label.clientWidth+1 && getComputedStyle(label,'::first-letter').textTransform==='uppercase';
      });
    });
    expect(fits,`${locale} at ${width}px`).toBe(true);
  }
});
