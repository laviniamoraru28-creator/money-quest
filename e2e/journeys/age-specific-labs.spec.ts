import {test,expect} from "@playwright/test";
import {LOCALES} from "../../src/i18n/config";
import {museumRooms} from "../../src/content/discovery";
import {learningLabs} from "../../src/content/learning-labs";
import {discoveryCopy} from "../../src/content/discovery-copy";
import {readerCopy} from "../../src/content/reader-copy";
import {draftDiscoveryPresentation} from "../../src/lib/i18n/discovery-presentation";
import {draftLaboratoryPresentation} from "../../src/lib/i18n/laboratory-presentation";
import {labTaskAtLevel} from "../../src/content/lab-age-variants";

for(const locale of LOCALES){
 test(`${locale}: all Museum selectors change question, choices and feedback`,async({page})=>{
  test.setTimeout(180_000);
  for(const room of museumRooms){
   const view=draftDiscoveryPresentation("museum",locale,room.slug);
   await page.goto(`/${locale}/museum/${room.slug}`);
   const article=page.getByRole("article"),selector=page.getByLabel(discoveryCopy[locale].chooseChallenge,{exact:true});
   for(const level of [0,1,2,0]){
    const assessment=view.ageAssessments![level]!;
    await selector.selectOption(String(level));
    await expect(article.locator("legend")).toHaveText(assessment.question);
    await expect(article.getByRole("button",{pressed:true})).toHaveCount(0);
    await expect(article.getByRole("button",{name:discoveryCopy[locale].mark,exact:true})).toHaveCount(0);
    await expect(article.getByText(view.note!.challenges[level]!,{exact:true})).toBeVisible();
    for(const answer of assessment.answers)await expect(article.getByRole("button",{name:answer,exact:true})).toBeVisible();
    await article.getByRole("button",{name:assessment.answers[(assessment.correct+1)%3]!,exact:true}).click();
    await expect(article.getByRole("status").filter({hasText:discoveryCopy[locale].retry})).toBeVisible();
    await article.getByRole("button",{name:assessment.answers[assessment.correct]!,exact:true}).click();
    await expect(article.getByRole("status").filter({hasText:assessment.explanation})).toContainText(readerCopy[locale].correct);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 });
 test(`${locale}: every Brain, Emotion and Future Skills activity changes with age`,async({page})=>{
  test.setTimeout(180_000);
  for(const lab of learningLabs){
   const view=draftLaboratoryPresentation(lab,locale);
   await page.goto(`/${locale}/${lab.slug}`);
   for(const [index,task] of view.lab.tasks.entries()){
    await page.getByRole("button",{name:`${index+1}. ${task.title}`,exact:true}).click();
    for(const [level,label] of ["Explorer","Builder","Strategist"].entries()){
     const reading=labTaskAtLevel(lab.slug,task,level,view.variants);
     await page.getByRole("button",{name:label,exact:true}).click();
     const article=page.getByRole("article");
     // Explorer (level 0) renders the prompt in ExplorerPictureChoice's own
     // <p>, not a <fieldset>/<legend> — Builder/Strategist keep the
     // original fieldset unchanged, so check the text itself rather than
     // which tag wraps it.
     await expect(article.getByText(reading.situation,{exact:true})).toBeVisible();
     await expect(article.getByRole("button",{pressed:true})).toHaveCount(0);
     await expect(article.getByText(reading.tryIt[level]!,{exact:true})).toBeVisible();
     for(const choice of reading.choices)await expect(article.getByRole("button",{name:choice,exact:true})).toBeVisible();
     await article.getByRole("button",{name:reading.choices[reading.correct]!,exact:true}).click();
     await expect(article.getByRole("status").filter({hasText:reading.explanation})).toBeVisible();
    }
   }
  }
 });
}
