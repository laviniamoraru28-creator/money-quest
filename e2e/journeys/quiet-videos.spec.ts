import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("real videos load only after a choice, play locally and keep accessible controls",async({page},testInfo)=>{
  const media:string[]=[];const external:string[]=[];
  page.on("request",request=>{const url=new URL(request.url());if(url.pathname.endsWith(".mp4"))media.push(url.pathname);if(url.hostname!=="localhost"&&url.hostname!=="127.0.0.1")external.push(url.hostname);});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:320,height:900});
  await page.goto("/en/quiet-corner");
  await expect(page.locator("video")).toHaveCount(0);expect(media).toEqual([]);
  await page.getByText("Real nature videos",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Watch video",exact:true})).toBeEnabled();
  expect(media).toEqual([]);
  for(const title of ["Ocean water","Rain on a window","Aquarium fish"]){
    await page.getByRole("button",{name:title,exact:true}).click();
    await expect(page.locator("video")).toHaveCount(0);
    await page.getByRole("button",{name:"Watch video",exact:true}).click();
    const video=page.getByLabel(title,{exact:true});
    await expect.poll(()=>video.evaluate((node:HTMLVideoElement)=>!node.paused&&node.currentTime>0.1)).toBe(true);
    expect(await video.evaluate((node:HTMLVideoElement)=>({autoplay:node.autoplay,muted:node.muted,loop:node.loop,controls:node.controls}))).toEqual({autoplay:false,muted:true,loop:false,controls:true});
    await page.getByRole("button",{name:"Close video",exact:true}).click();
  }
  expect(external).toEqual([]);expect(media.length).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
  await page.screenshot({path:testInfo.outputPath("quiet-videos-320px.png"),fullPage:true});
});

test("video stops on stop-all, closing, speech and reduced motion without restarting",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto("/en/quiet-corner");
  const summary=page.getByText("Real nature videos",{exact:true});await summary.click();
  const watch=page.getByRole("button",{name:"Watch video",exact:true});
  await watch.click();await expect(page.locator("video")).toBeVisible();
  await page.getByRole("checkbox",{name:"Repeat video",exact:true}).check();
  expect(await page.locator("video").evaluate((node:HTMLVideoElement)=>node.loop)).toBe(true);
  await page.getByRole("button",{name:"Stop everything",exact:true}).click();await expect(page.locator("video")).toHaveCount(0);
  await watch.click();await expect(page.locator("video")).toBeVisible();
  await page.getByRole("button",{name:"Listen",exact:true}).click();await expect(page.locator("video")).toHaveCount(0);
  await watch.click();await expect(page.locator("video")).toBeVisible();
  await page.emulateMedia({reducedMotion:"reduce"});await expect(page.locator("video")).toHaveCount(0);await expect(watch).toBeDisabled();
  await page.emulateMedia({reducedMotion:"no-preference"});await expect(watch).toBeEnabled();await expect(page.locator("video")).toHaveCount(0);
  await watch.click();await expect(page.locator("video")).toBeVisible();await summary.click();await expect(page.locator("video")).toHaveCount(0);
  await summary.click();await expect(page.locator("video")).toHaveCount(0);
});

test("a failed video leaves still pictures and communication available",async({page})=>{
  await page.route("**/media/quiet/*.mp4",route=>route.abort());
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto("/en/quiet-corner");
  await page.getByText("Real nature videos",{exact:true}).click();await page.getByRole("button",{name:"Watch video",exact:true}).click();
  await expect(page.getByText("This video could not play. You can use the still pictures above.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"I need help",exact:true}).click();await expect(page.getByRole("dialog")).toBeVisible();await expect(page.locator("video")).toHaveCount(0);
});
