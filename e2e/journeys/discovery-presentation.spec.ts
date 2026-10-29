import {test,expect} from "@playwright/test";
import {museumRooms,libraryBooks} from "../../src/content/discovery";
import {discoveryNotes} from "../../src/content/discovery-notes";

test("Museum presentation keeps gated language, narration, quiz and canonical completion",async({page})=>{
 await page.addInitScript(()=>{
  const calls:{lang:string;text:string}[]=[];(window as unknown as {discoverySpeech:typeof calls}).discoverySpeech=calls;
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},speak(utterance:{lang:string;text:string;onstart?:()=>void}){calls.push({lang:utterance.lang,text:utterance.text});utterance.onstart?.();}}});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{text:string;lang="";constructor(text:string){this.text=text;}}});
 });
 const room=museumRooms.find(room=>room.slug==="first-coins")!,note=discoveryNotes[room.slug]!;
 await page.goto(`/ro/museum/${room.slug}`);await expect(page).toHaveURL(new RegExp(`/en/museum/${room.slug}$`));
 const article=page.getByRole("article");await expect(article.getByRole("heading",{name:room.title,exact:true,level:1})).toBeVisible();
 await article.getByRole("button",{name:"Listen",exact:true}).last().click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {discoverySpeech:{lang:string}[]}).discoverySpeech.map(call=>call.lang))).toEqual(["en-GB"]);
 expect((await page.evaluate(()=>(window as unknown as {discoverySpeech:{text:string}[]}).discoverySpeech))[0]!.text).toContain(room.intro);
 await article.getByRole("button",{name:"Stop",exact:true}).click();
 for(let level=0;level<3;level++){
  await page.getByLabel("Choose a practical challenge",{exact:true}).selectOption(String(level));await expect(page.getByText(note.challenges[level]!,{exact:true})).toBeVisible();
 }
 await page.getByRole("button",{name:room.quiz.answers[(room.quiz.correct+1)%3]!,exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Look back at the story"})).toBeVisible();
 await page.getByRole("button",{name:room.quiz.answers[room.quiz.correct]!,exact:true}).click();await expect(page.getByRole("status").filter({hasText:note.feedback})).toBeVisible();
 await page.getByRole("button",{name:"Mark as discovered",exact:true}).click();await expect(page.getByRole("button",{name:"Saved on this device",exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("money-quest-discovery-v1")||"[]"))).toEqual([`museum:${room.slug}`]);
 await page.getByText("Sources for grown-ups",{exact:true}).click();await expect(page.getByRole("link",{name:note.sources![0]!.title,exact:true})).toHaveAttribute("href",note.sources![0]!.url);
 await page.reload();await page.getByRole("button",{name:room.quiz.answers[room.quiz.correct]!,exact:true}).click();await expect(page.getByRole("button",{name:"Saved on this device",exact:true})).toBeVisible();
});

test("short-read presentation retains three pages, age activities and honest blocked-storage feedback",async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException("Blocked","SecurityError")};});
 const book=libraryBooks.find(book=>book.slug==="the-digital-coin")!,note=discoveryNotes[book.slug]!;
 await page.goto(`/ro/library/${book.slug}`);await expect(page).toHaveURL(new RegExp(`/en/library/${book.slug}$`));
 await expect(page.getByRole("region",{name:"Discovery challenge",exact:true})).toHaveCount(0);
 for(let index=0;index<3;index++){
  await expect(page.getByRole("heading",{name:book.pages[index]!.title,exact:true,level:2})).toBeVisible();await expect(page.getByText(`Page ${index+1} of 3`,{exact:true})).toBeVisible();
  if(index<2)await page.getByRole("button",{name:"Next",exact:true}).click();
 }
 for(let level=0;level<3;level++){
  await page.getByLabel("Choose a practical challenge",{exact:true}).selectOption(String(level));await expect(page.getByText(note.challenges[level]!,{exact:true})).toBeVisible();
 }
 await page.getByRole("button",{name:book.quiz.answers[book.quiz.correct]!,exact:true}).click();await page.getByRole("button",{name:"Mark as discovered",exact:true}).click();
 await expect(page.getByRole("status").filter({hasText:"could not save progress"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Completed. Explore again",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Saved on this device",exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem("money-quest-discovery-v1"))).toBeNull();
 await page.getByRole("button",{name:"Previous",exact:true}).click();await expect(page.getByRole("heading",{name:book.pages[1]!.title,exact:true,level:2})).toBeFocused();
 await page.getByRole("button",{name:"Next",exact:true}).click();await expect(page.getByRole("button",{name:book.quiz.answers[book.quiz.correct]!,exact:true})).toHaveAttribute("aria-pressed","false");
});
