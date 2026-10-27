import {test,expect} from "@playwright/test";
// English-only launch. Translation data remains covered by unit validation.
for (const locale of ["ro","es","de"]) {
 test(`legacy /${locale} redirects to English without losing the page`,async({page})=>{
  await page.goto(`/${locale}/parent-info?from=language`);
  await expect(page).toHaveURL(/\/en\/parent-info\?from=language$/);
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByRole("button",{name:/change language|select language/i})).toHaveCount(0);
 });
}
test("English launch stays English for another browser language",async({browser})=>{
 const context=await browser.newContext({locale:"ro-RO"});const page=await context.newPage();
 await page.goto("/");await expect(page).toHaveURL(/\/en$/);await expect(page.locator("html")).toHaveAttribute("lang","en");await context.close();
});
