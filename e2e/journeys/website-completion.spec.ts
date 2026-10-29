import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {museumRooms,libraryBooks} from "../../src/content/discovery";
import {labTaskAtLevel} from "../../src/content/lab-age-variants";
import {learningLabs} from "../../src/content/learning-labs";
const pages=["/en","/en/play","/en/museum","/en/library","/en/brain-lab","/en/mind-lab","/en/future-skills","/en/inclusive-learning","/en/play/simulator","/en/play/investing-lab","/en/play/goals","/en/play/money-personality","/en/entrepreneur-quest","/en/leadership-quest","/en/real-life-quests"];
for(const path of pages) test(`page, images, hydration and accessibility: ${path}`,async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",message=>{if(message.type()==="error"&&/hydration|did not match|server rendered/i.test(message.text()))errors.push(message.text())});
 if(path.startsWith("/en/play/")) await page.addInitScript(()=>localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify({ageBand:"explorer"})));
 const response=await page.goto(path);expect(response?.status()).toBe(200);await expect(page.locator("main")).toBeVisible();
 await expect(page.locator('a[href="#main-content"]')).toHaveCount(1);
 // Scroll every lazy image into view before checking its decoded size.
 for(const image of await page.locator("main img").all()) {await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
 await page.screenshot({path:test.info().outputPath("page.png"),fullPage:true});
 const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);expect(errors).toEqual([]);
});
test("all museum and library detail routes have correct canonical metadata",async({page})=>{
 for(const [kind,entries] of [["museum",museumRooms],["library",libraryBooks]] as const) for(const item of entries){
  const path=`/en/${kind}/${item.slug}`;const response=await page.goto(path);expect(response?.status()).toBe(200);await expect(page.getByRole("heading",{name:item.title,exact:true,level:1})).toBeVisible();await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",`https://moneyquesteducation.com${path}`);
 }
});
test("book page navigation, retry, saved progress and reload",async({page})=>{
 await page.goto("/en/library/the-saving-seed");await page.getByRole("button",{name:"Next",exact:true}).click();await expect(page.getByText("Page 2 of 3",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Next",exact:true}).click();
 await page.getByRole("button",{name:"Buying sweets daily",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Look back"})).toBeVisible();
 await page.getByRole("button",{name:"Saving little by little",exact:true}).click();await page.getByRole("button",{name:"Mark as discovered",exact:true}).click();await expect(page.getByRole("button",{name:"Saved on this device",exact:true})).toBeVisible();
 await page.reload();await page.getByRole("button",{name:"Next",exact:true}).click();await page.getByRole("button",{name:"Next",exact:true}).click();await page.getByRole("button",{name:"Saving little by little",exact:true}).click();await expect(page.getByRole("button",{name:"Saved on this device",exact:true})).toBeVisible();
});
for(const lab of learningLabs) test(`${lab.title} covers every task and three challenges`,async({page})=>{
 await page.goto(`/en/${lab.slug}`);
 for(let i=0;i<lab.tasks.length;i++){
  const item=lab.tasks[i]!;await expect(page.getByRole("heading",{name:item.title,exact:true})).toBeVisible();
  for(const [level,index] of [["Explorer",0],["Builder",1],["Strategist",2]] as const){await page.getByRole("button",{name:level,exact:true}).click();await expect(page.getByText(item.tryIt[index],{exact:true})).toBeVisible()}
  await page.getByRole("button",{name:labTaskAtLevel(lab.slug,item,2).choices[item.correct]!,exact:true}).click();await expect(page.getByRole("status").filter({hasText:"That fits."})).toBeVisible();
  if(i<lab.tasks.length-1)await page.getByRole("button",{name:"Next",exact:true}).click();
 }
});
for(const lab of learningLabs)test(`${lab.title} keeps draft language gated and guide narration in English`,async({page})=>{
 await page.addInitScript(()=>{
  const calls:{text:string;lang:string}[]=[];
  (window as unknown as {labSpeech:typeof calls}).labSpeech=calls;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},speak(utterance:{text:string;lang:string;onstart?:()=>void}){calls.push({text:utterance.text,lang:utterance.lang});utterance.onstart?.();}}});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{text:string;lang="";constructor(text:string){this.text=text;}}});
 });
 await page.goto(`/ro/${lab.slug}`);
 await expect(page).toHaveURL(new RegExp(`/en/${lab.slug}$`));
 await expect(page.getByRole("heading",{level:1,name:lab.title,exact:true})).toBeVisible();
 const guide=page.getByRole("complementary",{name:"Your learning guides",exact:true});
 await guide.getByRole("button",{name:"Hide guide",exact:true}).click();await expect(guide).toHaveCount(0);
 const show=page.getByRole("button",{name:"Show guide",exact:true});await show.focus();await page.keyboard.press("Enter");await expect(guide).toBeVisible();
 await guide.getByRole("button",{name:"Listen",exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {labSpeech:{lang:string}[]}).labSpeech.map(call=>call.lang))).toEqual(["en-GB"]);
 await guide.getByRole("button",{name:"Stop",exact:true}).click();
 await page.getByRole("button",{name:"Builder",exact:true}).click();
 await expect(page.getByText(lab.tasks[0]!.idea,{exact:true})).toBeVisible();
});
test("money examples separate cash, account money and payment tools",async({page})=>{
 await page.goto("/en/inclusive-learning");await page.getByRole("button",{name:"Payment card",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"A card is a payment tool"})).toBeVisible();
 await page.getByRole("button",{name:"A £1 coin",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"A coin is cash"})).toBeVisible();await page.getByRole("button",{name:"A payment card",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Yes. A card helps"})).toBeVisible();
});
test("storage failure leaves learning usable",async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException("Blocked","SecurityError")}});
 await page.goto("/en/brain-lab");await page.getByRole("button",{name:"Mark as practised",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"could not save"})).toBeVisible();await page.getByRole("button",{name:"Next",exact:true}).click();await expect(page.getByRole("heading",{name:"One thing at a time",exact:true})).toBeVisible();
});
test("keyboard settings and synchronized focus mode",async({page})=>{
 await page.goto("/en/brain-lab");await page.getByRole("button",{name:/Accessibility settings/i}).click();const checkbox=page.getByRole("checkbox",{name:/Focus Mode/i});await checkbox.check();await expect(page.locator('aside[aria-label="Your learning guides"] img')).toHaveCount(0);await expect(page.locator('[data-learning-decoration]').first()).toBeHidden();await page.keyboard.press("Escape");await expect(checkbox).toHaveCount(0);
});

test("picture choices fit at 320px without horizontal scrolling",async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto("/en/inclusive-learning");await expect(page.getByRole("heading",{name:"Meet money and ways to pay",exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
});
