import {test,expect} from "@playwright/test";
import {WORLDS} from "../../src/content/worlds";
import {getWorldCatalog} from "../../src/content/catalog";
for(const ageBand of ["explorer","builder","strategist"] as const) test(`all worlds, lessons and games render for ${ageBand}`,async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(band=>localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify({ageBand:band,currencyCode:"GBP",xpTotal:0,walletBalanceMinorUnits:0,completedActivityIds:[],goals:[],earnedBadgeIds:[]})),ageBand);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 for(const world of WORLDS){
  await page.goto(`/en/play/world/${world.id}`);await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(`img[src="/images/money-quest/worlds/${world.id}.webp"]`)).toBeVisible();
  if(ageBand === "explorer") await page.screenshot({path:test.info().outputPath(`${world.id}.png`),fullPage:true});
  const catalog=getWorldCatalog(world.id,ageBand,key=>key);
  for(const entry of catalog){
   const type=entry.activityType==="lesson"?"lesson":"game";
   const response=await page.goto(`/en/play/world/${world.id}/${type}/${entry.id}`);expect(response?.status()).toBe(200);await expect(page.locator("main")).toBeVisible();
   await expect(page.getByText(/isn't available|Choose your learning level first/i)).toHaveCount(0);
   await expect(page.locator("main button").first()).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),entry.id).toBe(false);
  }
 }
 expect(errors).toEqual([]);
});
test("core lessons remain usable when storage is blocked",async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException("Blocked","SecurityError")};Storage.prototype.setItem=()=>{throw new DOMException("Blocked","SecurityError")}});
 await page.goto("/en/play");await page.getByRole("button",{name:/Explorer.*6-8/i}).click();
 await page.locator('a[href="/en/play/world/coin-cove"]').click();await expect(page.getByRole("heading",{name:"Meet money and ways to pay",exact:true})).toBeVisible();
 await page.locator('a[href*="/lesson/"]').first().click();await expect(page.getByRole("button",{name:"Check my answer",exact:true})).toBeVisible();
});

test("reset progress updates the world map immediately",async({page})=>{
 await page.goto("/en/play");await page.getByRole("button",{name:/Explorer.*6-8/i}).click();
 await expect(page.getByRole("heading",{name:"Your World Map",exact:true})).toBeVisible();page.on("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Reset Progress",exact:true}).click();await expect(page.getByRole("heading",{name:"Choose your learning level",exact:true})).toBeVisible();
});
