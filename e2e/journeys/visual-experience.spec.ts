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
 await page.getByRole("button",{name:"Night view",exact:true}).click();
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

test("three picture activities support examples, optional answers and no saved responses",async({page})=>{
 await page.goto("/en/explorer");
 const before=await page.evaluate(()=>JSON.stringify(localStorage));
 const titles=["What is money?","Choose and pay","Save for a goal"];
 for(let lesson=0;lesson<3;lesson++){
  await expect(page.getByRole("heading",{name:titles[lesson],level:2,exact:true})).toBeVisible();
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button",{name:"☝ Choose a picture",exact:true}).click();
  const choices=page.locator('main button[aria-pressed]').filter({has:page.locator('svg')});
  await expect(choices).toHaveCount(2);
  await choices.nth(lesson===2?0:1).click();await expect(page.getByRole("status").filter({hasText:"Try another picture"})).toBeVisible();
  await page.getByRole("button",{name:"↻ Show me",exact:true}).click();
  await page.getByRole("button",{name:"☝ Choose a picture",exact:true}).click();
  await choices.nth(lesson===2?1:0).click();await expect(page.getByRole("status").filter({hasText:"That fits."})).toBeVisible();
  await expect(page.getByRole("status").filter({hasText:"That fits."}).locator("[aria-hidden=true]")).toHaveText("✓");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({path:test.info().outputPath(`visual-activity-${lesson+1}.png`),fullPage:true});
  await page.getByRole("button",{name:lesson===2?"Finish →":"Next →",exact:true}).click();
 }
 await expect(page.getByText("You explored all three ideas.",{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
 await page.getByRole("button",{name:"↻ Show me again",exact:true}).click();
 await page.getByRole("button",{name:"Next →",exact:true}).click();
 await expect(page.getByRole("heading",{name:titles[1],level:2,exact:true})).toBeFocused();
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
 await page.getByRole("link").filter({has:page.getByRole("heading",{name:"The Library",exact:true})}).click();
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
