import {expect,test} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {cinematicCopy} from "../../src/content/cinematic-copy";
import {type Locale} from "../../src/i18n/config";
for(const [index,locale] of (Object.keys(cinematicCopy) as Locale[]).entries()){
 test(`cinematic journey in ${locale} preserves progress`,async({page},info)=>{
 const band=["explorer","builder","strategist"][index%3]!,copy=cinematicCopy[locale];
 await page.addInitScript(()=>{if(!localStorage.getItem("moneyquest_local_progress_v1"))localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify({xpTotal:123,completedActivityIds:["prior-lesson"]}));});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto(`/${locale}`);
 await expect(page.locator(".mq-cinematic-hero video")).toHaveCount(0);
 await page.locator(".mq-hero-cta").click();
 await page.locator(`.mq-age-portal[href*="band=${band}"]`).click();
 const avatar=page.getByRole("button",{name:`Avatar ${index%6+1}`,exact:true});
 await avatar.click();await expect(avatar).toHaveAttribute("aria-pressed","true");
 await expect(page.getByRole("button",{name:/^Avatar \d$/})).toHaveCount(6);
 if(locale==="ro"){
 await info.attach("avatar-picker",{body:await page.screenshot(),contentType:"image/png"});
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 }
 await page.getByRole("button",{name:copy[1],exact:true}).click();
 await page.getByRole("button",{name:copy[2],exact:true}).click();
 await page.getByRole("button",{name:"AI Quest",exact:true}).click();
 await page.getByRole("link",{name:copy[3],exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`/${locale}/ai-quest$`));
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!));
 expect(progress).toMatchObject({ageBand:band,xpTotal:123,completedActivityIds:["prior-lesson"]});
 });
}
