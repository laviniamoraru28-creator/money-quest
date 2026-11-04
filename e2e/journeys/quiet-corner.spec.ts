import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("quiet corner keeps original videos, sound and accessible mobile layout", async ({page}, testInfo) => {
  await page.goto("/en/quiet-corner");
  await expect(page.getByText("Real nature videos",{exact:true})).toBeVisible();
  await expect(page.locator("#quiet-pictures")).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath("quiet-corner-default.png"),fullPage:true});
  await page.setViewportSize({width:320,height:900});
  await page.goto("/en/quiet-corner");
  await expect(page.getByRole("heading", {name:"Quiet corner",exact:true})).toBeVisible();
  await expect(page.getByRole("button", {name:"Play sound",exact:true})).toBeVisible();
  await expect(page.locator(".quiet-picture-moving")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const result = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",/\/en\/quiet-corner$/);
  await page.screenshot({path:testInfo.outputPath("quiet-corner-320px.png"),fullPage:true});
  // Night view now lives inside the consolidated Global Settings panel.
  await page.getByRole("button",{name:/Settings/}).click();
  await page.getByRole("checkbox",{name:"Night view",exact:true}).check();
  await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
});

test("communication cards support keyboard focus and do not create stored responses", async ({page}) => {
  await page.goto("/en/quiet-corner");
  const before = await page.evaluate(() => JSON.stringify({...localStorage}));
  const help = page.getByRole("button",{name:"I need help",exact:true});
  await help.click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("I need help");
  await expect(page.getByRole("button",{name:"Close card",exact:true})).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button",{name:"Close card",exact:true})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(help).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify({...localStorage}))).toBe(before);
});

test("audio starts only on request and closes on speech, stop and navigation", async ({page}) => {
  await page.addInitScript(() => {
    const Base = window.AudioContext;
    const stats = {created:0,closed:0};
    Object.assign(window,{quietAudioStats:stats});
    window.AudioContext = class extends Base {
      constructor() {super(); stats.created++;}
      override close() {stats.closed++; return super.close();}
    };
  });
  const stats = () => page.evaluate(() => (window as unknown as {quietAudioStats:{created:number;closed:number}}).quietAudioStats);
  await page.goto("/en/quiet-corner");
  expect(await stats()).toEqual({created:0,closed:0});
  await page.getByRole("button",{name:"Play sound",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop sound",exact:true})).toBeVisible();
  await expect.poll(async () => (await stats()).created).toBe(1);
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(page.getByRole("button",{name:"Play sound",exact:true})).toBeVisible();
  await expect.poll(async () => (await stats()).closed).toBe(1);
  await page.getByRole("button",{name:"Play sound",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop sound",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Stop everything",exact:true}).click();
  await expect(page.getByRole("button",{name:"Play sound",exact:true})).toBeVisible();
  await expect.poll(async () => (await stats()).closed).toBe(2);
  await page.getByRole("button",{name:"Play sound",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop sound",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Mind Lab",exact:true}).click();
  await expect(page).toHaveURL(/\/en\/mind-lab$/);
  await expect.poll(async () => (await stats()).closed).toBe(3);
});

test("quiet corner remains usable when Web Audio is unavailable", async ({page}) => {
  await page.addInitScript(() => {Object.defineProperty(window,"AudioContext",{value:undefined,configurable:true});});
  await page.goto("/en/quiet-corner");
  await page.getByRole("button",{name:"Play sound",exact:true}).click();
  await expect(page.getByText("Sound could not start. You can stay in silence.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"I need quiet",exact:true}).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
