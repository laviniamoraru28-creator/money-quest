import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import path from "node:path";
const files=['messages/ro.json',...readdirSync('src/content/translations').filter(f=>f.endsWith('.ro.json')).map(f=>path.join('src/content/translations',f))];
for(const file of files)assert(!/adultul tău|adultului tău|adulții tăi|adulților tăi/i.test(readFileSync(file,'utf8')),`${file}: use natural parent/trusted-adult wording`);
const messages=JSON.parse(readFileSync('messages/ro.json','utf8'));
assert(messages.curriculum['explorer-money_basics-l1'].story.includes('cu părintele sau cu un adult de încredere'));
assert(!/\blir[ăe]|sterlin/i.test(readFileSync('src/content/translations/books.ro.json','utf8')));
console.log('PASS: Romanian parent/trusted-adult wording and lei in original story editions.');
