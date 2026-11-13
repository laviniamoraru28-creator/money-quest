import {test,expect} from '@playwright/test';
import {LOCALES} from '../../src/i18n/config';

const moneyBasics = '/play/world/coin-cove/lesson/explorer-money_basics-l1';

test('Money Basics explains money before practice and waits for the child after counting', async ({page}) => {
  await page.setViewportSize({width:375,height:812});
  await page.addInitScript(()=>localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify({ageBand:'explorer'})));
  await page.goto('/ro' + moneyBasics);
  const title = page.getByRole('heading',{name:'Ce sunt banii?',exact:true});
  const pictures = page.locator('[data-explorer-discover]');
  await expect(title).toBeVisible();
  await expect(page.getByText('Scopul tău este să descoperi ce sunt banii. Citește sau ascultă, apoi răspunde la întrebare. Lucrează în ritmul tău.',{exact:true})).toBeVisible();
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
  await page.addInitScript(()=>localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify({ageBand:'explorer'})));
  await page.goto(`/${locale}/play/world/market-town/lesson/explorer-needs_wants-l1`);
  const sort=page.locator('[data-explorer-picture-sort]');
  await expect(sort).toBeVisible();
  for(const width of [320,360,375,390]){
    await page.setViewportSize({width,height:812});
    const fits=await sort.evaluate(section=>{
      const labels=Array.from(section.querySelectorAll<HTMLElement>('.answer-label'));
      return document.documentElement.scrollWidth<=innerWidth && labels.length>0 && labels.every(label=>{
        const button=label.closest('button')!.getBoundingClientRect();
        const bounds=label.getBoundingClientRect();
        return bounds.left>=button.left-1 && bounds.right<=button.right+1 && label.scrollWidth<=label.clientWidth+1 && getComputedStyle(label,'::first-letter').textTransform==='uppercase';
      });
    });
    expect(fits,`${locale} at ${width}px`).toBe(true);
  }
});

test('Romanian savings jar shows its lid, preserves feedback, and continues on request',async({page},info)=>{
  await page.addInitScript(()=>localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify({ageBand:'explorer'})));
  await page.setViewportSize({width:360,height:812});
  await page.goto('/ro/play/world/golden-vault/lesson/explorer-saving-l1');
  const jar=page.locator('[data-explorer-saving-jar]');
  const container=jar.getByRole('img',{name:/Ai strâns/});
  await expect(container).toBeVisible();
  await expect(jar.locator('[data-savings-jar-lid]')).toBeVisible();
  await jar.screenshot({path:info.outputPath('explorer-savings-jar-ro.png')});
  const money=jar.locator('button[draggable]');
  await expect(money).toHaveCount(6);
  const banknote=jar.getByRole('button',{name:'Bancnotă 5 lei',exact:true});
  const coins=await jar.getByRole('button',{name:'Monedă 1 leu',exact:true}).all();
  expect(coins).toHaveLength(5);
  await banknote.click();
  for(const coin of coins.slice(0,4))await coin.click();
  await expect(jar.getByText('1 leu rămas',{exact:true})).toBeVisible();
  await coins[4]!.click();
  await expect(jar.getByRole('progressbar')).toHaveAttribute('aria-valuenow','10');
  await expect(jar.getByText('Bravo! Ai strâns bani pentru bicicletă!',{exact:true})).toBeVisible();
  await jar.getByRole('button',{name:'Continuă',exact:true}).click();
  await expect(page.locator('[data-explorer-picture-choice]')).toBeVisible();
});


test('Romanian Explorer prices and rewards use lei with a GBP wallet',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify({ageBand:'explorer',currencyCode:'GBP'})));
  await page.goto('/ro/play/world/market-town/game/game-explorer-smart-shopper');
  await expect(page.getByRole('button',{name:/Ghiozdan simplu, rezistent.*15,00 lei/})).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('GBP');

  await page.goto('/ro/play/world/sky-exchange/lesson/explorer-digital_money-l1');
  const question=page.locator('[data-explorer-picture-choice]');
  await question.getByRole('button',{name:'Nu, rămân mai puțini bani',exact:true}).click();
  await question.getByRole('button',{name:'Continuă',exact:true}).click();
  const reward=page.getByText('Monede virtuale câștigate',{exact:true}).locator('..');
  await expect(reward).toContainText('5,00 lei');
  await expect(page.getByRole('main')).not.toContainText('GBP');
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!));
  expect(progress.currencyCode).toBe('GBP');
});
