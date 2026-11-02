import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {LOCALES} from "../../src/i18n/config";

for(const locale of LOCALES){
  test(`${locale}: settings and night-view labels follow the selected language`,async({page})=>{
    const {a11y}=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
    await page.goto(`/${locale}/museum`);
    const trigger=page.getByRole("button",{name:a11y.accessibilityMenuLabel,exact:true});
    await expect(trigger).toHaveText(a11y.settingsLabel);
    await trigger.click();
    const night=page.getByRole("checkbox",{name:a11y.nightViewLabel,exact:true});
    await expect(night).toBeVisible();
    await night.check();await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
    await night.uncheck();await expect(page.locator("html")).toHaveAttribute("data-night-view","false");
    await page.keyboard.press("Escape");await expect(trigger).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
