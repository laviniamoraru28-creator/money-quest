import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {LOCALES,REGIONAL_LOCALES} from '../../src/i18n/config';
import {originalBooks} from '../../src/content/library';
import {libraryPeople} from '../../src/content/people';
import {museumRooms} from '../../src/content/discovery';
import {learningLabs} from '../../src/content/learning-labs';
import {draftReaderPresentation,draftBiographyPresentation} from '../../src/lib/i18n/library-presentation';
import {draftLaboratoryPresentation} from '../../src/lib/i18n/laboratory-presentation';
import {draftDiscoveryPresentation} from '../../src/lib/i18n/discovery-presentation';
import {labTaskAtLevel} from '../../src/content/lab-age-variants';
import {laboratoryCopy} from '../../src/content/laboratory-copy';
import {experienceCopy} from '../../src/content/experience-copy';
import {readerCopy} from '../../src/content/reader-copy';
import {reviewsCopy} from '../../src/content/reviews-copy';
import {parentGuideCopy} from '../../src/content/parent-guide-copy';
import {LESSON_WORKSHEETS} from '../../src/content/worksheets';

for(const locale of LOCALES){
 test(`${locale}: real routes, localized reading levels, narration and downloadable editions`,async({page,request},info)=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
   (window as any).releaseSpeech=[];
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [];},speak(u:any){(window as any).releaseSpeech.push(u.lang);u.onstart?.();}}});
   Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{lang='';text:string;constructor(text:string){this.text=text;}}});
  });
  await page.setViewportSize({width:info.project.name==='mobile-chrome'?393:1280,height:852});
  await page.goto(`/${locale}/brain-lab`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/brain-lab$`));
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  const selector=page.locator('select').first();await expect(selector.locator('option')).toHaveCount(9);await expect(selector).toHaveValue(locale);
  const lab=learningLabs.find(l=>l.slug==='brain-lab')!,view=draftLaboratoryPresentation(lab,locale),ui=laboratoryCopy[locale];
  await expect(page.locator('main h1')).toHaveText(view.lab.title);
  const first=view.lab.tasks[0]!;
  for(const [index,label] of ['Explorer','Builder','Strategist'].entries()){
   await page.getByRole('button',{name:label,exact:true}).click();
   const reading=labTaskAtLevel(lab.slug,first,index,view.variants);
   const article=page.getByRole('article');await expect(article.getByText(reading.idea,{exact:true})).toBeVisible();
   await article.getByRole('button',{name:reading.choices[reading.correct],exact:true}).click();
   await expect(article.getByRole('status').filter({hasText:reading.explanation})).toBeVisible();
  }
  const guide=page.getByRole('complementary',{name:ui.guideLabel,exact:true});await guide.getByRole('button',{name:JSON.parse(readFileSync(`messages/${locale}.json`,'utf8')).a11y.listenToLessonLabel,exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).releaseSpeech)).toEqual([REGIONAL_LOCALES[locale]]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.screenshot({path:info.outputPath(`lab-${locale}.png`),fullPage:true});
  const book=draftReaderPresentation(originalBooks[0]!,locale).book;
  await page.goto(`/${locale}/library/${book.slug}`);await expect(page.locator('main h1')).toHaveText(book.title);
  await page.getByRole('button',{name:experienceCopy[locale].openBook,exact:true}).click();
  await expect(page.getByText(book.chapters[0]!.paragraphs[0]!,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:readerCopy[locale].nextPage+' →',exact:true}).click();
  await page.screenshot({path:info.outputPath(`book-${locale}.png`),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.goto(`/${locale}/parents/resources`);
  await expect(page.getByRole('link',{name:parentGuideCopy[locale].activitySample,exact:true})).toHaveAttribute('href',`/resources/samples/free-family-sample-${locale}.pdf`);
  for(const file of [`/resources/samples/free-family-sample-${locale}.pdf`,`/resources/samples/free-journal-week-one-${locale}.pdf`,`/worksheets/${locale}/${Object.values(LESSON_WORKSHEETS)[0]}`,`/worksheets/${locale}/money-quest-worksheets-answer-key.pdf`]){
   const response=await request.get(file);expect(response.status(),file).toBe(200);expect((await response.body()).subarray(0,4).toString()).toBe('%PDF');
  }
  const fallback=await request.get(`/offline-pages/${locale}.html`);expect(fallback.status()).toBe(200);expect(await fallback.text()).toContain(`<html lang="${locale}">`);
  const canonical=page.locator('link[rel="canonical"]');await expect(canonical).toHaveAttribute('href',`https://moneyquesteducation.com/${locale}/parents/resources`);
  expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBeGreaterThanOrEqual(9);
  await page.goto(`/${locale}/reviews`);await expect(page.getByRole('heading',{level:1})).toHaveText(reviewsCopy[locale].title);
  if(locale==='pl')await expect(page.getByRole('radio',{name:'2 gwiazdki',exact:true})).toBeVisible();
 });
}

test('every translated original book, biography, Museum room and laboratory serves its own metadata',async({request},info)=>{
 test.skip(info.project.name!=='desktop-chrome','HTTP matrix only needs one browser project');test.setTimeout(180000);
 for(const locale of LOCALES){
  const entries=[...originalBooks.map(b=>{const t=draftReaderPresentation(b,locale).book;return {path:`/library/${t.slug}`,title:t.title};}),...libraryPeople.map(p=>{const t=draftBiographyPresentation(p,locale).person;return {path:`/library/${t.slug}`,title:t.title};}),...museumRooms.map(r=>{const t=draftDiscoveryPresentation('museum',locale,r.slug).item!;return {path:`/museum/${r.slug}`,title:t.title};}),...learningLabs.map(l=>{const t=draftLaboratoryPresentation(l,locale).lab;return {path:`/${l.slug}`,title:t.title};})];
  for(const entry of entries){const path=`/${locale}${entry.path}`,response=await request.get(path);expect(response.status(),path).toBe(200);const html=await response.text();expect(html,path).toContain(`https://moneyquesteducation.com${path}`);expect(html,path).toContain(`lang="${locale}"`);expect(html,path).toContain('<title>');}
 }
});
