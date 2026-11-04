import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {museumMedia} from "../../src/content/museum-media";
import {museumRooms} from "../../src/content/discovery";

test("illustrated shelf covers open and close books with keyboard and reduced motion",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/en/library");
 const shelf=page.locator("#money-quest-books");
 await expect(shelf.locator(".library-cover")).toHaveCount(10);
 await page.screenshot({path:test.info().outputPath("illustrated-library-shelves.png"),fullPage:true});
 await shelf.locator(".library-cover").first().focus();await page.keyboard.press("Enter");
 await expect(page.getByRole("button",{name:"Open book",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Open book",exact:true}).click();
 await expect(page.getByRole("region",{name:"Illustrated book pages"})).toBeVisible();
 expect(await page.locator(".book-opening").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
 await page.getByRole("button",{name:"Next page →",exact:true}).click();
 await page.getByRole("button",{name:"Close book",exact:true}).click();
 await expect(page.getByRole("button",{name:"Open book",exact:true})).toBeFocused();
 await page.getByRole("button",{name:"Open book",exact:true}).click();
 await expect(page.getByText(/^Spread 2 of /)).toBeVisible();
 await expect(page.getByRole("heading",{level:2}).first()).toBeFocused();
 await page.screenshot({path:test.info().outputPath("open-illustrated-book.png"),fullPage:true});
 await page.getByRole("button",{name:"Close book",exact:true}).click();
 // Night view now lives inside the consolidated Global Settings panel.
 await page.locator("summary",{hasText:"Settings"}).click();
 await page.getByRole("checkbox",{name:"Night view",exact:true}).check();
 await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
 await expect(page.locator(".library-cover > span").first()).toHaveCSS("color","rgb(255, 255, 255)");
 await page.screenshot({path:test.info().outputPath("closed-book-night-view.png"),fullPage:true});
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 await expect(page.getByRole("button",{name:"Open book",exact:true})).toBeVisible();
});

test("every Museum room has a representative image and generation disclosure",async({page})=>{
 for(const room of museumRooms){
  await page.goto(`/en/museum/${room.slug}`);
  const image=page.getByRole("img",{name:museumMedia[room.slug]!.alt.en,exact:true});
  await image.scrollIntoViewIfNeeded();
  await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  await expect(page.locator("figcaption")).toContainText("AI-generated illustration");
  await expect(page.getByRole("heading",{name:"Discovery challenge",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
 await page.screenshot({path:test.info().outputPath("museum-realistic-illustration.png"),fullPage:true});
});

test("retired picture learning is absent while Inclusive Learning remains available",async({page,request})=>{
 const sitemap=await request.get("/sitemap.xml");
 expect(sitemap.ok()).toBe(true);
 expect(await sitemap.text()).not.toContain("/explorer");
 for(const locale of ["en","ro","es","fr","de","it","pt","nl","pl"]){
  await page.goto(`/${locale}`);
  await expect(page.locator('a[href$="/explorer"]')).toHaveCount(0);
  await expect(page.locator(`a[href="/${locale}/inclusive-learning"]`)).toBeVisible();
  const retired=await request.get(`/${locale}/explorer`);
  expect(retired.status()).toBe(404);
  const inclusive=await page.goto(`/${locale}/inclusive-learning`);
  expect(inclusive?.ok()).toBe(true);
  await expect(page.locator("main")).toBeVisible();
 }
});

test("background audio stays silent initially, persists between pages and stops for narration or page hide",async({page})=>{
 await page.addInitScript(()=>{
  const Original=window.AudioContext;
  const contexts:AudioContext[]=[];
  Object.assign(window,{mqTestContexts:contexts});
  window.AudioContext=class extends Original {constructor(options?:AudioContextOptions){super(options);contexts.push(this);}};
 });
 await page.goto("/en");
 const states=()=>page.evaluate(()=>((window as unknown as {mqTestContexts:AudioContext[]}).mqTestContexts).map(ctx=>ctx.state));
 expect(await states()).toEqual([]);
 await page.getByText("Background sound",{exact:true}).first().click();
 await page.getByRole("button",{name:"Play sound",exact:true}).click();
 await expect.poll(states).toEqual(["running"]);
 await page.getByRole("link").filter({has:page.getByRole("heading",{name:"Money Quest Library",exact:true})}).click();
 await expect(page.getByRole("heading",{name:"Money Quest Library",exact:true})).toBeVisible();
 expect(await states()).toEqual(["running"]);
 await page.getByRole("button",{name:"Listen",exact:true}).first().click();
 await expect.poll(states).toEqual(["closed"]);
 await page.getByRole("button",{name:"Play sound",exact:true}).click();
 await expect.poll(states).toEqual(["closed","running"]);
 await page.evaluate(()=>window.dispatchEvent(new Event("pagehide")));
 await expect.poll(states).toEqual(["closed","closed"]);
 await page.reload();expect(await states()).toEqual([]);
});
