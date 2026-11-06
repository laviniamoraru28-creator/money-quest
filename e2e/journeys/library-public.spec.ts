import {readFileSync} from "node:fs";
import {test,expect} from "@playwright/test";
import {LOCALES,REGIONAL_LOCALES} from "../../src/i18n/config";
import {publicOriginalBooks,publicShortReads} from "../../src/content/library-publication";
import {originalBooks} from "../../src/content/library";
import {libraryBooks} from "../../src/content/discovery";
import {draftReaderPresentation} from "../../src/lib/i18n/library-presentation";
import {readerCopy} from "../../src/content/reader-copy";
import {experienceCopy} from "../../src/content/experience-copy";
import {bookPageArt} from "../../src/content/book-page-art";

for(const locale of LOCALES)test(`${locale}: curated Library every page, speech, keyboard, motion and night view`,async({page})=>{
 test.setTimeout(120000);
 const {a11y}=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(()=>{
  const calls:{lang:string;text:string}[]=[];(window as unknown as {readerSpeech:typeof calls}).readerSpeech=calls;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},speak(utterance:{lang:string;text:string;onstart?:()=>void}){calls.push({lang:utterance.lang,text:utterance.text});utterance.onstart?.();}}});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{text:string;lang="";constructor(text:string){this.text=text;}}});
 });
 await page.goto(`/${locale}/library`);
 const publicSlugs=[...publicOriginalBooks,...publicShortReads].map(book=>book.slug);
 const links=await page.locator('main a[href*="/library/"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")!.split("/").at(-1)));
 for(const book of [...originalBooks,...libraryBooks])expect(links.includes(book.slug)).toBe(publicSlugs.includes(book.slug));
 await expect(page.locator('a[href="#short-reads"]')).toHaveCount(0);
 for(const book of publicOriginalBooks){
  const view=draftReaderPresentation(book,locale),copy=readerCopy[locale],ui=experienceCopy[locale];
  await page.goto(`/${locale}/library/${book.slug}`);
  const cover=page.getByRole("button",{name:ui.openBook,exact:true});await cover.focus();await page.keyboard.press("Enter");
  const article=page.getByRole("article");
  await article.getByRole("button",{name:copy.listen,exact:true}).click();
  expect(await page.evaluate(()=>(window as unknown as {readerSpeech:{lang:string}[]}).readerSpeech.at(-1)?.lang)).toBe(REGIONAL_LOCALES[locale]);
  await article.getByRole("button",{name:copy.stop,exact:true}).click();
  await page.emulateMedia({reducedMotion:"reduce"});
  expect(await article.evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  const spreads=book.chapters.flatMap((ch,c)=>Array.from({length:Math.ceil(ch.paragraphs.length/view.paragraphsPerPage)},(_,part)=>({chapter:c,part})));
  let index=0;
  for(const {chapter,part} of spreads){
   const art=bookPageArt(book.slug,chapter,part)!;
   const img=article.locator("figure img");await expect(img).toHaveAttribute("src",art.src);
   await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
   await expect(article.locator(".book-reading-page")).toContainText(view.book.chapters[chapter]!.paragraphs[part*view.paragraphsPerPage]!);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await article.locator(".book-reading-page").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
   if(index===15){await page.getByRole("button",{name:a11y.accessibilityMenuLabel,exact:true}).click();await page.getByRole("checkbox",{name:a11y.nightViewLabel,exact:true}).check();await page.keyboard.press("Escape");await expect.poll(()=>article.locator(".book-reading-page").evaluate(el=>getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");}
   if(index<spreads.length-1){
    if(index===0){const region=article.getByRole("region",{name:copy.pages,exact:true});await region.focus();await page.keyboard.press("ArrowRight");}
    else await article.getByRole("button",{name:new RegExp(copy.nextPage)}).click();
   }
   index++;
  }
  await expect(article.getByRole("button",{name:new RegExp(copy.nextPage)})).toBeDisabled();
  await article.getByRole("button",{name:new RegExp(copy.previousPage)}).click();
  await article.getByRole("button",{name:ui.closeBook,exact:true}).click();await expect(cover).toBeFocused();
  await page.screenshot({path:test.info().outputPath(`${locale}-closed.png`),fullPage:true});
 }
 for(const slug of [...originalBooks,...libraryBooks].filter(book=>!publicSlugs.includes(book.slug)).map(book=>book.slug))expect((await page.request.get(`/${locale}/library/${slug}`)).status()).toBe(404);
 expect(errors).toEqual([]);
});
