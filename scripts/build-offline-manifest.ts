import {readFileSync, writeFileSync, readdirSync, statSync} from "node:fs";
import path from "node:path";
import {ACTIVE_LOCALES} from "../src/i18n/config";
import {libraryBooks, museumRooms} from "../src/content/discovery";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {ARTICLE_STRUCTURES} from "../src/content/articles";
import {LQ_MISSIONS} from "../src/content/leadership-quest/structures";
import {RLQ_MISSIONS} from "../src/content/real-life-quests/structures";
import {EQ_CHALLENGE_IDS, EQ_BUSINESS_PROBLEM_IDS} from "../src/content/entrepreneur-quest/structures";

function files(root: string): string[] {
  return readdirSync(root).flatMap(name => {
    const file=path.join(root,name);return statSync(file).isDirectory()?files(file):[file];
  });
}
const pages=new Set<string>();
for(const file of files("src/app/[locale]")) {
  if(!file.endsWith("/page.tsx"))continue;
  const route=file.replace("src/app/[locale]","").replace("/page.tsx","");
  if(!route.includes("[") && route!=="/feedback" && !route.startsWith("/reviews"))pages.add(`/en${route}`);
}
const coverage=JSON.parse(readFileSync("docs/website-coverage.json","utf8"));
function visit(value: unknown): void {
  if(Array.isArray(value))value.forEach(visit);
  else if(value&&typeof value==="object") for(const [key,item] of Object.entries(value)) {
    if(key==="url"&&typeof item==="string"&&item.startsWith("/en/")) {
      pages.add(item);if(item.includes("/lesson/"))pages.add(`${item}/worksheet`);
    } else visit(item);
  }
}
visit(coverage);
for(const entry of [...libraryBooks,...originalBooks,...libraryPeople])pages.add(`/en/library/${entry.slug}`);
for(const entry of museumRooms)pages.add(`/en/museum/${entry.slug}`);
for(const entry of ARTICLE_STRUCTURES)pages.add(`/en/learn/${entry.slug}`);
for(const mission of LQ_MISSIONS)pages.add(`/en/leadership-quest/missions/${mission.id}`);
for(const mission of RLQ_MISSIONS)pages.add(`/en/real-life-quests/missions/${mission.id}`);
for(const id of EQ_CHALLENGE_IDS)pages.add(`/en/entrepreneur-quest/challenges/${id}`);
for(const id of EQ_BUSINESS_PROBLEM_IDS)pages.add(`/en/entrepreneur-quest/run/problems/${id}`);
const publicAssets=files("public").filter(file=>/\.(webp|png|jpg|jpeg|svg|avif|pdf|woff2?|webmanifest|html)$/.test(file)).map(file=>`/${file.replace(/^public\//,"")}`);
const nextAssets=files(".next/static").filter(file=>!file.endsWith(".map")).map(file=>file.replace(/^\.next/,"/_next"));
const manifest={version:readFileSync(".next/BUILD_ID","utf8").trim(),pages:Object.fromEntries(ACTIVE_LOCALES.map(locale=>[locale,[...pages].sort().map(route=>route.replace(/^\/en(?=\/|$)/,`/${locale}`))])),assets:[...new Set([...publicAssets,...nextAssets])].sort()};
writeFileSync("public/offline-manifest.json",JSON.stringify(manifest));
console.log(`Offline manifest: ${pages.size} learning pages per active locale and ${manifest.assets.length} assets. No API, feedback form or external books included.`);
