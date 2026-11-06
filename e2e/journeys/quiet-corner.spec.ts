import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("quiet corner keeps original videos, sound and accessible mobile layout", async ({page}, testInfo) => {
  await page.goto("/en/quiet-corner");
  await expect(page.getByRole("region",{name:"Real nature videos",exact:true})).toBeVisible();
  await expect(page.locator("#quiet-pictures")).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath("quiet-corner-default.png"),fullPage:true});
  await page.setViewportSize({width:320,height:900});
  await page.goto("/en/quiet-corner");
  await expect(page.getByRole("heading", {name:"Quiet corner",exact:true})).toBeVisible();
  await expect(page.getByRole("button", {name:"Watch video",exact:true})).toBeVisible();
  await expect(page.locator(".quiet-picture-moving")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const result = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",/\/en\/quiet-corner$/);
  await page.screenshot({path:testInfo.outputPath("quiet-corner-320px.png"),fullPage:true});
  // Night view now lives inside the consolidated Global Settings panel.
  await page.locator('button[data-settings-trigger][aria-label="Settings"]').click();
  await page.getByRole("checkbox",{name:"Night view",exact:true}).check();
  await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
});
