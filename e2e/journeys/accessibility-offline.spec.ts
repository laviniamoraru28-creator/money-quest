import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {learningLabs} from "../../src/content/learning-labs";
import {labTaskAtLevel} from "../../src/content/lab-age-variants";

test("Listen is present in Leadership and reads visible content without form values",async({page})=>{
  await page.addInitScript(()=>{
    const calls:string[]=[];(window as unknown as {speechCalls:string[]}).speechCalls=calls;
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},speak(utterance:{text:string;onstart?:()=>void}){calls.push(utterance.text);utterance.onstart?.();}}});
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{ text:string;constructor(text:string){this.text=text;} }});
  });
  await page.goto("/en/leadership-quest");
  const controls=page.getByRole("complementary",{name:"Page read-aloud",exact:true});
  await controls.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(controls.getByRole("button",{name:"Stop",exact:true})).toBeVisible();
  expect((await page.evaluate(()=>(window as unknown as {speechCalls:string[]}).speechCalls)).join(" ")).toMatch(/leadership/i);
  await controls.getByRole("button",{name:"Stop",exact:true}).click();
  await expect(controls.getByRole("button",{name:"Listen",exact:true})).toBeVisible();
});

for(const path of ["/en","/en/library","/en/brain-lab","/en/mind-lab","/en/leadership-quest","/en/play/investing-lab"])test(`night view contrast and persistence: ${path}`,async({page})=>{
  await page.goto(path);await page.getByRole("button",{name:"Night view",exact:true}).click();
  await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.reload();await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
  await page.getByRole("button",{name:"Night view",exact:true}).click();await expect(page.locator("html")).toHaveAttribute("data-night-view","false");
});

for(const lab of learningLabs)test(`actual age-specific lab wording: ${lab.slug}`,async({page})=>{
  await page.goto(`/en/${lab.slug}`);
  for(let taskIndex=0;taskIndex<lab.tasks.length;taskIndex++){
    const task=lab.tasks[taskIndex]!;
    for(const [level,label] of ["Explorer","Builder","Strategist"].entries()){
      await page.getByRole("button",{name:label,exact:true}).click();const reading=labTaskAtLevel(lab.slug,task,level);
      await expect(page.getByText(reading.idea,{exact:true})).toBeVisible();
      await expect(page.getByRole("group",{name:reading.situation,exact:true})).toBeVisible();
      await page.getByRole("button",{name:reading.choices[reading.correct]!,exact:true}).click();
      await expect(page.getByRole("status").filter({hasText:reading.explanation})).toBeVisible();
    }
    if(taskIndex<lab.tasks.length-1)await page.getByRole("button",{name:"Next",exact:true}).click();
  }
});

test("offline download covers unvisited books and leadership, with removable local copy",async({page,context})=>{
  test.setTimeout(240000);
  await page.goto("/en");await page.getByText("Use without internet",{exact:true}).click();
  await page.getByRole("button",{name:"Download for offline use",exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"Offline download complete:"})).toBeVisible({timeout:180000});
  await context.setOffline(true);
  for(const path of ["/en/library/the-little-compass-and-the-money-choices","/en/leadership-quest","/en/mind-lab"]){
    await page.goto(path);await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText("Reconnect to download Money Quest for offline use.",{exact:true})).toHaveCount(0);
  }
  await page.getByText("Use without internet",{exact:true}).click();await page.getByRole("button",{name:"Remove offline copy",exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"Offline copies removed"})).toBeVisible();await context.setOffline(false);
});
