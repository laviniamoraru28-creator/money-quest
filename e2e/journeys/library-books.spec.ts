import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { originalBooks } from "../../src/content/library";
import { authorBooks } from "../../src/content/author-books";
import { libraryPeople } from "../../src/content/people";
import {librarySourceDate} from "../../src/content/reader-copy";

test("Library separates full originals, author listings and existing short reads", async ({ page }) => {
  await page.goto("/en/library");
  await expect(page.getByRole("heading", { name: "Money Quest original books", exact: true })).toBeVisible();
  for (const book of originalBooks) await expect(page.getByRole("link", { name: book.title, exact: true })).toHaveAttribute("href", `/en/library/${book.slug}`);
  await page.getByLabel("Choose a topic").selectOption("Leadership");
  await expect(page.getByRole("status").filter({hasText:"1 book shown"})).toHaveText("1 book shown");
  await expect(page.getByRole("heading", { name: "Sofia Valdez, Future Prez", exact: true })).toBeVisible();
  await page.getByLabel("Choose a topic").selectOption("All topics");
  for (const book of authorBooks) {
    const article = page.getByRole("article").filter({ has: page.getByRole("heading", { name: book.title, exact: true }) });
    await article.getByText("For grown-ups: where to find this book", { exact: true }).click();
    await expect(article.getByRole("link")).toHaveAttribute("href", book.url);
    await expect(article).toContainText("The complete book is not hosted on Money Quest.");
  }
  await expect(page.getByRole("link", { name: /The Saving Seed/ })).toBeVisible();
});

for (const book of originalBooks) test(`original book: all chapters, feedback, completion, WCAG: ${book.slug}`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(`/en/library/${book.slug}`);
  await expect(page.getByRole("heading", { name: book.title, level: 1, exact: true })).toBeVisible();
  await page.getByRole("button", {name: "Open book", exact: true}).click();
  const image = page.locator("main img").first(); await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.getByRole("button", { name: "Larger text", exact: true }).click();
  for (let index = 0; index < book.chapters.length; index++) {
    const chapter = book.chapters[index]!;
    await expect(page.getByRole("heading", { name: chapter.title, level: 2, exact: true })).toBeVisible();
    await page.getByRole("button", { name: chapter.choices.find(choice => !choice.correct)!.text, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Let’s think it through." })).toBeVisible();
    await page.getByRole("button", { name: chapter.choices.find(choice => choice.correct)!.text, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "That fits." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    if (index === 0 || index === book.chapters.length - 1) {
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(result.violations).toEqual([]);
    }
    if (index < book.chapters.length - 1) {
      await page.getByRole("button", { name: "Next chapter", exact: true }).click();
      await expect(page.getByRole("heading", { name: book.chapters[index + 1]!.title, level: 2, exact: true })).toBeFocused();
    }
  }
  await page.getByRole("button", { name: "Mark book as read", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Book marked as read" })).toBeVisible();
  await page.reload();
  await page.getByText("Contents: choose any chapter", { exact: true }).click();
  await page.getByRole("button", { name: book.chapters.at(-1)!.title, exact: true }).click();
  await expect(page.getByRole("button", { name: "Marked as read on this device", exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("book-final-chapter.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("optional chapter question never blocks navigation and blocked storage stays usable", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); }; });
  const book = originalBooks[0]!;
  await page.goto(`/en/library/${book.slug}`);
  await page.getByText("Contents: choose any chapter", { exact: true }).click();
  await page.getByRole("button", { name: book.chapters.at(-1)!.title, exact: true }).click();
  await page.getByRole("button", { name: "Mark book as read", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "could not save" })).toBeVisible();
  await page.getByRole("button", { name: "Previous chapter", exact: true }).click();
  await expect(page.getByRole("heading", { name: book.chapters.at(-2)!.title, level: 2, exact: true })).toBeFocused();
});

test("inactive Romanian reader preserves English narration, typography controls and cover descriptions",async({page})=>{
 await page.addInitScript(()=>{
  const calls:{lang:string;text:string}[]=[];(window as unknown as {readerSpeech:typeof calls}).readerSpeech=calls;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},speak(utterance:{lang:string;text:string;onstart?:()=>void}){calls.push({lang:utterance.lang,text:utterance.text});utterance.onstart?.();}}});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{text:string;lang="";constructor(text:string){this.text=text;}}});
 });
 const book=originalBooks.find(book=>book.slug==="the-repair-table")!;
 await page.goto(`/ro/library/${book.slug}`);await expect(page).toHaveURL(new RegExp(`/en/library/${book.slug}$`));
 await page.getByRole("button",{name:"Open book",exact:true}).click();
 const article=page.getByRole("article"),chapter=book.chapters[0]!;
 await article.getByRole("button",{name:"Listen",exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {readerSpeech:{lang:string}[]}).readerSpeech.map(call=>call.lang))).toEqual(["en-GB"]);
 await article.getByRole("button",{name:"Stop",exact:true}).click();
 expect((await page.evaluate(()=>(window as unknown as {readerSpeech:{text:string}[]}).readerSpeech))[0]!.text).toContain(chapter.title);
 await article.getByRole("button",{name:"Larger text",exact:true}).click();await expect(article.getByRole("button",{name:"Standard text",exact:true})).toHaveAttribute("aria-pressed","true");
 await article.getByRole("button",{name:"Next chapter",exact:true}).click();
 // This book keeps its own cover on later chapters, so its actual cover alt must remain.
 await expect(article.getByRole("img",{name:book.coverAlt,exact:true})).toBeVisible();
});

test("inactive Romanian biography retains canonical source and a British calendar date",async({page})=>{
 const person=libraryPeople[0]!;
 await page.goto(`/ro/library/${person.slug}`);await expect(page).toHaveURL(new RegExp(`/en/library/${person.slug}$`));
 await expect(page.getByRole("heading",{name:person.title,exact:true,level:1})).toBeVisible();
 await page.getByText("Factual source and notes for grown-ups",{exact:true}).click();
 await expect(page.getByText(`Source checked ${librarySourceDate("en",person.checked)}.`,{exact:true})).toBeVisible();
 await expect(page.getByRole("link",{name:`${person.sourceTitle} (external site)`,exact:true})).toHaveAttribute("href",person.source);
});

for (const person of libraryPeople) test(`sourced illustrated biography: ${person.name}`, async ({ page }) => {
  await page.goto(`/en/library/${person.slug}`);
  await expect(page.getByRole("heading", { name: person.title, level: 1, exact: true })).toBeVisible();
  const image = page.getByRole("img", { name: person.alt }); await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.getByText("Factual source and notes for grown-ups", { exact: true }).click();
  await expect(page.getByRole("link", { name: `${person.sourceTitle} (external site)`, exact: true })).toHaveAttribute("href", person.source);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
