import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync} from 'node:fs';

async function unlock(page: Page) {
  await expect(page.getByRole('radio')).toHaveCount(0);
  const challenge = page.locator('#adult-challenge');
  await expect(challenge).toContainText('×');
  const numbers = (await challenge.innerText()).match(/\d+/g)!.map(Number);
  await page.locator('#adult-answer').fill(String(numbers[0]! * numbers[1]!));
  await page.getByRole('checkbox').check();
  await page.locator('form button').click();
  await expect(page.getByRole('radio')).toHaveCount(4);
}

for(const locale of ['en','ro','es','fr','de','it','pt','nl','pl']) {
  test(`support page ${locale} stays optional and fits the viewport`,async({page})=>{
    await page.goto(`/${locale}/support`);
    await expect(page.locator('h1')).toBeVisible();
    await unlock(page);
    await expect(page.getByRole('radio')).toHaveCount(4);
    await page.getByRole('radio').nth(3).check();
    await page.locator('#support-amount').fill('2,50');
    await expect(page.locator('form')).toContainText('£2.50 GBP');
    await expect(page.getByRole('button',{name:/payment|plata|pago|paiement|Zahlung|pagamento|betalen|płatności/i})).toBeDisabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  });
}
test('support links, cancellation, unverified success and shop pause',async({page,request})=>{
  await page.goto('/en');await page.getByRole('link',{name:'Support Money Quest',exact:true}).click();await expect(page).toHaveURL(/\/en\/support$/);await unlock(page);
  await page.goto('/en/parents/resources');await expect(page.getByRole('link',{name:'Support Money Quest',exact:true})).toBeVisible();
  await page.goto('/en/support?cancelled=1');await expect(page.getByRole('status').filter({hasText:'No payment is confirmed'})).toBeVisible();
  await page.goto('/en/support/success?session_id=cs_test_fake');await expect(page.getByRole('status')).toContainText('cannot confirm');await expect(page.getByText('Your payment has been verified.',{exact:false})).toHaveCount(0);
  const shop=await request.post('/api/shop/checkout',{data:{}});expect(shop.status()).toBe(503);
  const support=await request.post('/api/support/checkout',{data:{}});expect(support.status()).toBe(503);
  await page.goto('/en/play');await expect(page.getByRole('link',{name:'Support Money Quest',exact:true})).toHaveCount(0);
});
test('support accessibility, keyboard and review screenshots',async({page},info)=>{
  await page.goto('/en/support');
  const gateResults=await new AxeBuilder({page}).include('#main-content').analyze();expect(gateResults.violations).toEqual([]);
  await unlock(page);
  await page.getByRole('radio').first().focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio').nth(1)).toBeChecked();
  const results=await new AxeBuilder({page}).include('#main-content').analyze();expect(results.violations).toEqual([]);
  mkdirSync('docs/support/screenshots',{recursive:true});
  await page.screenshot({path:`docs/support/screenshots/${info.project.name}.png`,fullPage:true});
});

test('adult gate rejects wrong answers and expires before checkout', async ({page}) => {
  await page.goto('/en/support');
  await expect(page.locator('#adult-challenge')).toContainText('×');
  await page.locator('#adult-answer').fill('0');
  await page.getByRole('checkbox').check();
  await page.locator('form button').click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await unlock(page);
  await page.context().clearCookies();
  await page.reload();
  await expect(page.locator('#adult-answer')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
});
