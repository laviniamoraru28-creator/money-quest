import {test,expect} from "@playwright/test";
for (const locale of ["ro","es","de"]) {
 test(`/${locale} preserves its selected language and page`,async({page})=>{
  await page.goto(`/${locale}/parent-info?from=language`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/parent-info\\?from=language$`));
  await expect(page.locator("html")).toHaveAttribute("lang",locale);
  const selector=page.locator('select').first();await expect(selector).toHaveValue(locale);await expect(selector.locator('option')).toHaveCount(9);
  await selector.selectOption('en');await expect(page).toHaveURL(/\/en\/parent-info\?from=language$/);
 });
}
test("default launch language is stable for another browser language",async({browser})=>{
 const context=await browser.newContext({locale:"ro-RO"});const page=await context.newPage();
 await page.goto("/");await expect(page).toHaveURL(/\/en$/);await expect(page.locator("html")).toHaveAttribute("lang","en");await context.close();
});
