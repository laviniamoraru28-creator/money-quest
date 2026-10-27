import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {museumRooms,libraryBooks} from "../src/content/discovery";
import {discoveryNotes} from "../src/content/discovery-notes";
import {learningLabs} from "../src/content/learning-labs";
import {WORLDS} from "../src/content/worlds";
import sitemap from "../src/app/sitemap";
assert.equal(museumRooms.length,10);assert.equal(libraryBooks.length,8);assert.equal(learningLabs.length,3);
const entries=[...museumRooms,...libraryBooks];assert.equal(new Set(entries.map(item=>item.slug)).size,18);
for(const item of entries){
 assert.equal(item.quiz.answers.length,3);assert.ok(item.quiz.correct>=0&&item.quiz.correct<3);assert.equal(new Set(item.quiz.answers).size,3);
 const note=discoveryNotes[item.slug];assert.ok(note,`missing note for ${item.slug}`);assert.equal(note.challenges.length,3);assert.equal(new Set(note.challenges).size,3);assert.ok(note.feedback.length>40);
 if("pages" in item){assert.equal(item.pages.length,3);for(const page of item.pages)assert.ok(page.text.length>=150,`thin page ${item.slug}/${page.title}`)}
}
assert.equal(learningLabs.reduce((count,lab)=>count+lab.tasks.length,0),22);
for(const lab of learningLabs){assert.equal(new Set(lab.tasks.map(task=>task.id)).size,lab.tasks.length);for(const task of lab.tasks){assert.ok(task.correct>=0&&task.correct<3);assert.equal(new Set(task.choices).size,3);assert.equal(task.tryIt.length,3);assert.equal(new Set(task.tryIt).size,3)}}
for(const path of [...WORLDS.flatMap(world=>[`worlds/${world.id}.webp`,`worlds/${world.id}-thumb.webp`]),"guides/girl-and-puppy.webp","guides/girl-and-puppy-thumb.webp",...['brain-lab','mind-lab','future-skills','inclusive-learning','museum','library'].flatMap(item=>[`sections/${item}.webp`,`sections/${item}-thumb.webp`]),...['coins','banknote','card','phone'].map(item=>`money/${item}.webp`)]){
 const full=`public/images/money-quest/${path}`;assert.ok(existsSync(full),`missing ${full}`);const bytes=readFileSync(full);assert.ok(bytes.length>1000);assert.ok(bytes.length<150000,`oversized ${full}`);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
}
const urls=sitemap().map(entry=>entry.url);assert.equal(new Set(urls).size,urls.length);for(const url of urls){assert.ok(new URL(url).pathname.startsWith('/en'));assert.ok(!url.includes('/play'));assert.ok(!url.includes('.example'))}
for(const slug of [...learningLabs.map(lab=>lab.slug),'inclusive-learning','museum','library'])assert.ok(urls.includes(`https://moneyquesteducation.com/en/${slug}`));
console.log('PASS: 18 discoveries, 24 short story pages, 54 discovery challenges, 22 lab tasks, 66 practical challenges, 32 image files and English-only sitemap integrity.');
