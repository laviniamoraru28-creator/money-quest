import {test,expect,type Page} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {readFileSync} from "node:fs";
import {createDefaultState} from "../../src/lib/local-progress/state";
import {createDefaultState as createEntrepreneurDefault} from "../../src/lib/entrepreneur-quest/state";
import {createDefaultState as createLeadershipDefault} from "../../src/lib/leadership-quest/state";
import {CERTIFICATE_BANDS,requiredCertificateActivities} from "../../src/lib/certificates/eligibility";
import {LESSON_STRUCTURES} from "../../src/content/curriculum/structures";
import {LOCALES} from "../../src/i18n/config";
import {certificateCopy} from "../../src/content/certificate-copy";
import {journeyContinueCopy} from "../../src/content/certificate-journey-copy";
import type {AgeBand} from "../../src/types/database.types";

/** Seeds the three bits of localStorage state the certificate gate reads,
 * in the actual band-scoped shape the hooks read/write (see
 * band-scoped-storage.ts). `eq`/`lq` are booleans, not partial state
 * objects: every test here only ever needs "done" or "not done." */
// Guarded per key (matches the repo's own existing seeding convention) -
// addInitScript reruns on EVERY navigation of the page, reload included,
// so an unconditional set would silently discard any progress a test
// made in between navigations.
async function seedQuestState(page: Page, band: AgeBand, options: {mqCompletedIds: string[]; eqDone: boolean; lqDone: boolean}) {
  const mq = {...createDefaultState(), certificateQuestCount:3, ageBand: band, completedActivityIds: options.mqCompletedIds};
  const eq = {byBand: {[band]: {...createEntrepreneurDefault(), pitchCompleted: options.eqDone}}};
  const lq = {byBand: {[band]: {...createLeadershipDefault(), completedMissionIds: options.lqDone ? ["final-challenge"] : []}}};
  await page.addInitScript(([mqState, eqState, lqState]) => {
    // addInitScript also reruns on the transient about:blank document
    // Chromium creates before each real navigation commits, where
    // window.localStorage can be null - skip quietly there instead of
    // crashing the real, upcoming document.
    if (!window.localStorage) return;
    if (!localStorage.getItem("moneyquest_local_progress_v1")) localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(mqState));
    if (!localStorage.getItem("moneyquest_entrepreneur_quest_v1")) localStorage.setItem("moneyquest_entrepreneur_quest_v1", JSON.stringify(eqState));
    if (!localStorage.getItem("moneyquest_leadership_quest_v1")) localStorage.setItem("moneyquest_leadership_quest_v1", JSON.stringify(lqState));
  }, [mq, eq, lq]);
}

const readLocalProgress = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!));

for (const band of CERTIFICATE_BANDS) {
  test(`${band}: no certificate after Money Quest alone - the continue-to-Entrepreneur-Quest prompt shows instead`, async ({page}) => {
    await seedQuestState(page, band, {mqCompletedIds: requiredCertificateActivities(band), eqDone: false, lqDone: false});
    await page.goto("/en/play");
    await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(0);
    await expect(page.getByRole("link", {name: journeyContinueCopy.en.toEntrepreneurQuest, exact: true})).toBeVisible();
  });

  test(`${band}: the continue-to-Entrepreneur-Quest prompt is keyboard-reachable and axe-clean`, async ({page}) => {
    await seedQuestState(page, band, {mqCompletedIds: requiredCertificateActivities(band), eqDone: false, lqDone: false});
    await page.goto("/en/play");
    const link = page.getByRole("link", {name: journeyContinueCopy.en.toEntrepreneurQuest, exact: true});
    await link.focus();
    await expect(link).toBeFocused();
    const accessibility = await new AxeBuilder({page}).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test(`${band}: no certificate after Money Quest + Entrepreneur Quest alone - the continue-to-Leadership-Quest prompt shows instead`, async ({page}) => {
    await seedQuestState(page, band, {mqCompletedIds: requiredCertificateActivities(band), eqDone: true, lqDone: false});
    await page.goto("/en/play");
    await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(0);
    await expect(page.getByRole("link", {name: journeyContinueCopy.en.toLeadershipQuest, exact: true})).toBeVisible();
  });

  test(`${band}: certificate appears only once all three are done, dated from that moment - not the earlier Money-Quest-only date`, async ({page}) => {
    const lesson = LESSON_STRUCTURES.find(item => item.ageBand === band)!;
    const messages = JSON.parse(readFileSync("messages/en.json", "utf8"));
    // Money Quest's OWN completion date is seeded as already recorded,
    // days before Entrepreneur Quest and Leadership Quest were finished -
    // exactly the real "finished MQ a while ago, came back to finish the
    // other two" sequence, so certificateCompletionDates.<band> must
    // stay exactly as seeded (never recomputed) while the NEW
    // threeQuestCertificateDates.<band> reflects today instead.
    const state = {
      ...createDefaultState(), certificateQuestCount:3, ageBand: band,
      completedActivityIds: requiredCertificateActivities(band).filter(id => id !== lesson.id),
      certificateCompletionDates: {[band]: "2026-10-20T08:00:00.000+00:00"},
    };
    await page.addInitScript(([mqState, eqState, lqState]) => {
      // Guarded: addInitScript reruns on the reload later in this test,
      // and an unconditional set there would wipe out the lesson
      // completion and recorded date this test is about to make. It
      // also reruns on the transient about:blank document before the
      // real navigation commits, where window.localStorage can be null.
      if (!window.localStorage) return;
      if (!localStorage.getItem("moneyquest_local_progress_v1")) localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(mqState));
      if (!localStorage.getItem("moneyquest_entrepreneur_quest_v1")) localStorage.setItem("moneyquest_entrepreneur_quest_v1", JSON.stringify(eqState));
      if (!localStorage.getItem("moneyquest_leadership_quest_v1")) localStorage.setItem("moneyquest_leadership_quest_v1", JSON.stringify(lqState));
    }, [state, {byBand: {[band]: {...createEntrepreneurDefault(), pitchCompleted: true}}}, {byBand: {[band]: {...createLeadershipDefault(), completedMissionIds: ["final-challenge"]}}}]);
    await page.clock.setFixedTime(new Date("2026-11-03T12:34:00Z"));
    await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
    await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(0);
    if (band === "explorer") {
      const button = (name: string) => page.getByRole("button", {name, exact: true});
      for (const label of ["Coin", "Banknote", "Debit card"]) await button(label).click();
      await button("Continue").click();
      await button("Add").click(); await button("Add").click(); await button("Add").click();
      await button("Check").click();
      await button("Continue").click();
      await button("Debit card").click();
      await button("Continue").click();
      await button("Your bank account").click();
    } else {
      await page.getByRole("radio", {name: messages.curriculum[lesson.id].quiz.correctAnswer, exact: true}).check();
      await page.getByRole("button", {name: "Check my answer", exact: true}).click();
    }
    // Completing MQ's final piece makes all three quests done for this band -
    // the certificate reward (which previously wasn't shown at all, since
    // EQ/LQ were already done but MQ wasn't) appears right here.
    await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toBeVisible();
    const afterCompletion = await readLocalProgress(page);
    expect(afterCompletion.certificateCompletionDates[band]).toBe("2026-10-20T08:00:00.000+00:00");
    expect(new Date(afterCompletion.threeQuestCertificateDates[band]).toISOString()).toBe("2026-11-03T12:34:00.000Z");
    // Persists across a reload, same as the existing MQ-only date always has.
    await page.clock.setFixedTime(new Date("2026-12-20T12:00:00Z"));
    await page.reload();
    const reloaded = await readLocalProgress(page);
    expect(reloaded.threeQuestCertificateDates[band]).toBe(afterCompletion.threeQuestCertificateDates[band]);
    expect(reloaded.certificateCompletionDates[band]).toBe("2026-10-20T08:00:00.000+00:00");
  });
}

test("switching to a different band shows no certificate for it, even though another band just earned one", async ({page}) => {
  await seedQuestState(page, "explorer", {mqCompletedIds: requiredCertificateActivities("explorer"), eqDone: true, lqDone: true});
  await page.goto("/en/play");
  await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(1);
  await page.getByRole("button", {name: "Change level", exact: true}).click();
  await page.getByRole("button", {name: /Builder.*/}).click();
  // Builder's own Money Quest, Entrepreneur Quest and Leadership Quest
  // are all untouched - the certificate must not follow the switch.
  await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(0);
  await page.goto("/en/academy-certificate?level=explorer");
  await expect(page.getByText(certificateCopy.en.locked)).toBeVisible();
});

test("a direct link to a DIFFERENT band's certificate than the one currently selected never reads as eligible", async ({page}) => {
  // Builder is fully done; the family is currently on Builder; a direct
  // link to Explorer's certificate must not read as eligible even though
  // nothing here says Explorer specifically ISN'T done - the guard is on
  // the currently-selected band matching the URL, not on Explorer's own
  // (seeded-empty) state (Issue #86 point 4's "direct URL download guard").
  await seedQuestState(page, "builder", {mqCompletedIds: requiredCertificateActivities("builder"), eqDone: true, lqDone: true});
  await page.goto("/en/academy-certificate?level=explorer");
  await expect(page.getByText(certificateCopy.en.locked)).toBeVisible();
  await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toHaveCount(0);
  await page.goto("/en/academy-certificate?level=builder");
  await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toBeVisible();
});

test("a family who already had all three quests done before this feature shipped sees no invented date, ever", async ({page}) => {
  // The exact legacy scenario the existing MQ-only certificateCompletionDates
  // field was already built to handle (see the "legacy completion never
  // invents a date" test below) - now also true for the three-quest date:
  // arriving already-eligible must never stamp today's date.
  await seedQuestState(page, "explorer", {mqCompletedIds: requiredCertificateActivities("explorer"), eqDone: true, lqDone: true});
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00Z"));
  await page.goto("/en/play");
  await expect(page.getByRole("button", {name: certificateCopy.en.download, exact: true})).toBeVisible();
  const state = await readLocalProgress(page);
  expect(state.threeQuestCertificateDates.explorer).toBeUndefined();
  await page.goto("/en/academy-certificate?level=explorer");
  await expect(page.getByText(certificateCopy.en.dateUnknown)).toBeVisible();
});

for(const locale of LOCALES)test(`certificate direct PDF downloads, localized ${locale}, all three designs`,async({page})=>{
 test.setTimeout(120000);
 const threeQuestCertificateDates=Object.fromEntries(CERTIFICATE_BANDS.map(band=>[band,"2026-11-03T09:30:00+00:00"]));
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 const outgoing:string[]=[];page.on("request",request=>{if(request.method()!=="GET")outgoing.push(request.url());});
 const seed=(band:typeof CERTIFICATE_BANDS[number])=>[
  {...createDefaultState(),ageBand:band,completedActivityIds:requiredCertificateActivities(band),threeQuestCertificateDates},
  {byBand:{[band]:{...createEntrepreneurDefault(),pitchCompleted:true}}},
  {byBand:{[band]:{...createLeadershipDefault(),completedMissionIds:["final-challenge"]}}},
 ] as const;
 const keys=["moneyquest_local_progress_v1","moneyquest_entrepreneur_quest_v1","moneyquest_leadership_quest_v1"] as const;
 // Guarded so the registered addInitScript (which reruns on every later
 // goto in this test, not just the first) never clobbers a different
 // band's data that reseedForBand below just set for THIS iteration.
 const setIfAbsent=([mqState,eqState,lqState]:readonly [unknown,unknown,unknown])=>{
  // addInitScript also reruns on the transient about:blank document
  // Chromium creates before each real navigation commits, where
  // window.localStorage can be null rather than throw or being absent -
  // skip quietly there instead of crashing the real, upcoming document.
  if(!window.localStorage)return;
  if(!localStorage.getItem("moneyquest_local_progress_v1"))localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(mqState));
  if(!localStorage.getItem("moneyquest_entrepreneur_quest_v1"))localStorage.setItem("moneyquest_entrepreneur_quest_v1", JSON.stringify(eqState));
  if(!localStorage.getItem("moneyquest_leadership_quest_v1"))localStorage.setItem("moneyquest_leadership_quest_v1", JSON.stringify(lqState));
 };
 // Deliberately switches band between iterations: clears first so the
 // guarded addInitScript above (which reruns on the goto right after
 // this) sees the keys already holding THIS band's fresh data and skips.
 const reseedForBand=([keysToClear,values]:readonly [readonly string[],readonly [unknown,unknown,unknown]])=>{
  for(const key of keysToClear)localStorage.removeItem(key);
  const [mqState,eqState,lqState]=values;
  localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(mqState));
  localStorage.setItem("moneyquest_entrepreneur_quest_v1", JSON.stringify(eqState));
  localStorage.setItem("moneyquest_leadership_quest_v1", JSON.stringify(lqState));
 };
 await page.addInitScript(setIfAbsent, seed(CERTIFICATE_BANDS[0]));
 for(const band of CERTIFICATE_BANDS){
  if(band!==CERTIFICATE_BANDS[0])await page.evaluate(reseedForBand, [keys, seed(band)] as const);
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
 await seedQuestState(page,"builder",{mqCompletedIds:requiredCertificateActivities("builder"),eqDone:true,lqDone:true});
 await page.addInitScript(()=>{
  const state=JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!);
  state.threeQuestCertificateDates={builder:"2026-11-03T09:30:00+00:00"};
  localStorage.setItem("moneyquest_local_progress_v1",JSON.stringify(state));
 });
 await page.goto("/en/academy-certificate?level=builder");
 await page.locator("select").first().selectOption("ro");
 await expect(page).toHaveURL(/\/ro\/academy-certificate\?level=builder$/);
 await expect(page.getByRole("button",{name:certificateCopy.ro.download,exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!).threeQuestCertificateDates.builder)).toBe("2026-11-03T09:30:00+00:00");
});

test("legacy completion never invents a completion or download date",async({page})=>{
 await seedQuestState(page,"explorer",{mqCompletedIds:requiredCertificateActivities("explorer"),eqDone:true,lqDone:true});
 await page.goto("/ro/academy-certificate?level=explorer");
 await expect(page.getByText(certificateCopy.ro.dateUnknown)).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!).threeQuestCertificateDates)).toEqual({});
 await expect(page.getByRole("button",{name:certificateCopy.ro.download,exact:true})).toBeVisible();
});
