import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {readFileSync} from "node:fs";
import {createDefaultState} from "../../src/lib/local-progress/state";
import {CERTIFICATE_BANDS,requiredCertificateActivities} from "../../src/lib/certificates/eligibility";
import {LESSON_STRUCTURES} from "../../src/content/curriculum/structures";
import {LOCALES} from "../../src/i18n/config";
import {certificateCopy} from "../../src/content/certificate-copy";

for(const band of CERTIFICATE_BANDS)test(`certificate earned at real final ${band} lesson, date retained, no duplicate reward`,async({page})=>{
 const lesson=LESSON_STRUCTURES.find(item=>item.ageBand===band)!;
 const messages=JSON.parse(readFileSync("messages/en.json","utf8"));
 const state={...createDefaultState(),ageBand:band,completedActivityIds:requiredCertificateActivities(band).filter(id=>id!==lesson.id)};
 await page.addInitScript(initial=>{if(!localStorage.getItem("moneyquest_local_progress_v1"))localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify(initial));},state);
 await page.clock.setFixedTime(new Date("2026-11-03T12:34:00Z"));
 await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
 await expect(page.getByRole("button",{name:certificateCopy.en.download,exact:true})).toHaveCount(0);
 if(band==="explorer"){
  // Every Explorer lesson now runs through its own picture-first
  // interactive flow instead of a single quiz radio; this is the
  // first lesson's (money_basics) exact activity sequence.
  const button=(name:string)=>page.getByRole("button",{name,exact:true});
  for(const label of ["Coin","Banknote","Debit card"])await button(label).click();
  await button("Continue").click();
  await button("Add").click();await button("Add").click();await button("Add").click();
  await button("Check").click();
  await button("Continue").click();
  await button("Debit card").click();
  await button("Continue").click();
  await button("Your bank account").click();
  await button("Continue").click();
 }else{
  await page.getByRole("radio",{name:messages.curriculum[lesson.id].quiz.correctAnswer,exact:true}).check();
  await page.getByRole("button",{name:"Check my answer",exact:true}).click();
 }
 await expect(page.getByRole("button",{name:certificateCopy.en.download,exact:true})).toBeVisible();
 const readState=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!));
 const earned=await readState();
 expect(new Date(earned.certificateCompletionDates[band]).toISOString()).toBe("2026-11-03T12:34:00.000Z");
 await page.clock.setFixedTime(new Date("2026-12-20T12:00:00Z"));
 await page.reload();
 expect((await readState()).certificateCompletionDates[band]).toBe(earned.certificateCompletionDates[band]);
 expect((await readState()).xpTotal).toBe(earned.xpTotal);
 await page.goto("/en/play");
 await page.getByRole("button",{name:"Change level",exact:true}).click();
 const other=band==="explorer"?"Builder":"Explorer";
 await page.getByRole("button",{name:new RegExp(`${other}.*`)}).click();
 await expect(page.getByRole("button",{name:certificateCopy.en.download,exact:true})).toHaveCount(1);
 const otherBand=band==="explorer"?"builder":"explorer";
 await page.goto(`/en/academy-certificate?level=${otherBand}`);
 await expect(page.getByText(certificateCopy.en.locked)).toBeVisible();
 await expect(page.getByRole("button",{name:certificateCopy.en.download,exact:true})).toHaveCount(0);
 await page.goto("/en/play");page.once("dialog",dialog=>dialog.accept());
 await page.getByRole("button",{name:"Reset Progress",exact:true}).click();
 expect((await readState()).certificateCompletionDates).toEqual({});
 await expect(page.getByRole("button",{name:certificateCopy.en.download,exact:true})).toHaveCount(0);
});

for(const locale of LOCALES)test(`certificate direct PDF downloads, localized ${locale}, all three designs`,async({page})=>{
 test.setTimeout(120000);
 const state={...createDefaultState(),ageBand:"explorer",completedActivityIds:CERTIFICATE_BANDS.flatMap(requiredCertificateActivities),certificateCompletionDates:Object.fromEntries(CERTIFICATE_BANDS.map(band=>[band,"2026-11-03T09:30:00+00:00"]))};
 await page.addInitScript(initial=>localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify(initial)),state);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 const outgoing:string[]=[];page.on("request",request=>{if(request.method()!=="GET")outgoing.push(request.url());});
 for(const band of CERTIFICATE_BANDS){
  await page.goto(`/${locale}/academy-certificate?level=${band}`);
  await expect(page.getByRole("heading",{name:certificateCopy[locale].title,exact:true})).toBeVisible();
  const button=page.getByRole("button",{name:certificateCopy[locale].download,exact:true});
  await button.focus();await expect(button).toBeFocused();
  const downloadEvent=page.waitForEvent("download");
  await button.press("Enter");
  const download=await downloadEvent;
  expect(download.suggestedFilename()).toBe(`Money-Quest-${band}-${locale}.pdf`);
  const path=await download.path();expect(path).toBeTruthy();
  expect(readFileSync(path!).subarray(0,5).toString()).toBe("%PDF-");
  await expect(page.locator("iframe")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  if(band==="explorer"){
   const accessibility=await new AxeBuilder({page}).disableRules(["frame-tested"]).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
   expect(accessibility.violations).toEqual([]);
   await page.screenshot({path:test.info().outputPath(`certificate-${locale}.png`),fullPage:true});
  }
 }
 expect(errors).toEqual([]);expect(outgoing).toEqual([]);
});

test("certificate language follows the actual website selector and keeps level/date",async({page})=>{
 const state={...createDefaultState(),ageBand:"builder",completedActivityIds:requiredCertificateActivities("builder"),certificateCompletionDates:{builder:"2026-11-03T09:30:00+00:00"}};
 await page.addInitScript(initial=>localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify(initial)),state);
 await page.goto("/en/academy-certificate?level=builder");
 await page.locator("select").first().selectOption("ro");
 await expect(page).toHaveURL(/\/ro\/academy-certificate\?level=builder$/);
 await expect(page.getByRole("button",{name:certificateCopy.ro.download,exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!).certificateCompletionDates.builder)).toBe("2026-11-03T09:30:00+00:00");
});

test("legacy completion never invents a completion or download date",async({page})=>{
 const state={...createDefaultState(),ageBand:"explorer",completedActivityIds:requiredCertificateActivities("explorer")};
 await page.addInitScript(initial=>localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify(initial)),state);
 await page.goto("/ro/academy-certificate?level=explorer");
 await expect(page.getByText(certificateCopy.ro.dateUnknown)).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!).certificateCompletionDates)).toEqual({});
 await expect(page.getByRole("button",{name:certificateCopy.ro.download,exact:true})).toBeVisible();
});
