import {writeFileSync,readFileSync} from "node:fs";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {libraryBooks,museumRooms} from "../src/content/discovery";
import {learningLabs} from "../src/content/learning-labs";
import {labAgeVariants} from "../src/content/lab-age-variants";
import {discoveryNotes} from "../src/content/discovery-notes";
import {authorBooks} from "../src/content/author-books";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {biographyTranslationSource,bookTranslationSource,museumTranslationSource,draftTranslatedMuseum,shortReadTranslationSource,draftTranslatedShortRead,sourceFingerprint,assertTranslationShape} from "../src/lib/i18n/content-translations";
const structural=new Set(["slug","id","name","icon","image","cover","source","sources","sourceTitle","checked","authors","illustrator","publisher","url"]);
function textLeaves(value:unknown,key=""):number{
 if(structural.has(key))return 0;
 if(typeof value==="string")return /^https?:|^\//.test(value)?0:1;
 if(Array.isArray(value))return value.reduce((n,item)=>n+textLeaves(item),0);
 if(value&&typeof value==="object")return Object.entries(value).reduce((n,[k,item])=>n+textLeaves(item,k),0);
 return 0;
}
const sources={originalBooks,biographies:libraryPeople.map(biographyTranslationSource),shortReads:libraryBooks,museumRooms,laboratories:learningLabs,labAgeVariants,discoveryNotes,externalBookIntroductions:authorBooks};
const ro=JSON.parse(readFileSync("src/content/translations/people.ro.json","utf8"));
let roLeaves=0;
for(const person of libraryPeople)roLeaves+=assertTranslationShape(biographyTranslationSource(person),ro[person.slug],person.slug);
const roBooks=JSON.parse(readFileSync("src/content/translations/books.ro.json","utf8"));
let bookLeaves=0;let bookChapters=0;
for(const [slug,value] of Object.entries(roBooks)){
 const book=originalBooks.find(item=>item.slug===slug);if(!book)throw new Error(`Unknown book ${slug}`);
 bookLeaves+=assertTranslationShape(bookTranslationSource(book),value,slug);bookChapters+=book.chapters.length;
}
const museumManifest=JSON.parse(readFileSync("src/content/translations/museum.sources.json","utf8"));
const museumDrafts=LOCALES.filter(locale=>locale!=="en").map(locale=>{
 const copy=JSON.parse(readFileSync(`src/content/translations/museum.${locale}.json`,"utf8"));
 let translatedStrings=0;
 for(const room of museumRooms){
  const note=discoveryNotes[room.slug]!;
  draftTranslatedMuseum(room,note,copy[room.slug],museumManifest.sources[room.slug]);
  translatedStrings+=assertTranslationShape(museumTranslationSource(room,note),copy[room.slug],`${locale}/${room.slug}`);
 }
 return {locale,entries:museumRooms.length,translatedStrings,editorialStatus:"draft, not native-editor reviewed",publicActivation:"blocked pending complete site locale"};
});
const shortReadManifest=JSON.parse(readFileSync("src/content/translations/short-reads.sources.json","utf8"));
const shortReadDrafts=LOCALES.filter(locale=>locale!=="en").map(locale=>{
 const copy=JSON.parse(readFileSync(`src/content/translations/short-reads.${locale}.json`,"utf8"));
 let translatedStrings=0;
 for(const book of libraryBooks){
  const note=discoveryNotes[book.slug]!;
  draftTranslatedShortRead(book,note,copy[book.slug],shortReadManifest.sources[book.slug]);
  translatedStrings+=assertTranslationShape(shortReadTranslationSource(book,note),copy[book.slug],`${locale}/${book.slug}`);
 }
 return {locale,entries:libraryBooks.length,pages:libraryBooks.reduce((sum,book)=>sum+book.pages.length,0),translatedStrings,editorialStatus:"draft, not native-editor reviewed",publicActivation:"blocked pending complete site locale"};
});
const report={generated:"2026-10-29",scope:"Eight authored-content groups only. Canonical bibliography titles are excluded from counts and retained in their published language. This inventory does not certify linguistic quality or cover all hardcoded UI, SEO, commerce policies or privately stored printable manuscripts.",activeLocales:ACTIVE_LOCALES,domains:Object.fromEntries(Object.entries(sources).map(([key,value])=>[key,{sourceStrings:textLeaves(value),sourceHash:sourceFingerprint(value)}])),locales:LOCALES.map(locale=>({locale,messageKeys:"validated separately; key parity does not prove authored-content translation",newContent:locale==="en"?"source edition":locale==="ro"?"10 biography drafts, 10 book drafts, 10 Museum room drafts and 8 short-read drafts with age challenges; other domains pending":"10 Museum room drafts and 8 short-read drafts with age challenges; other domains pending",publicActivation:locale==="en"?"active":"blocked pending complete content and review"})),shortReadDrafts,shortReadSourceFingerprintManifest:"src/content/translations/short-reads.sources.json",museumDrafts,museumSourceFingerprintManifest:"src/content/translations/museum.sources.json",countingNote:"The initial inventory included 12 canonical source titles in discoveryNotes. The current count excludes them; their text has not been removed or changed.",romanianBooks:{entries:Object.keys(roBooks).length,chapters:bookChapters,translatedStrings:bookLeaves,editorialStatus:"draft, not owner-reviewed",sourceFingerprintManifest:"src/content/translations/books.ro.sources.json"},romanianBiographies:{entries:libraryPeople.length,translatedStrings:roLeaves,editorialStatus:"draft, not owner-reviewed",sourceFingerprintManifest:"src/content/translations/people.ro.sources.json"},additionalWork:["Translate and wire every hardcoded UI and SEO field","Translate parent shop, consumer/privacy text and recovery flow","Translate all privately stored worksheets, journal pages, guides and answers","Proofread terminology, level labels, amounts, dates and right/wrong feedback","Validate routes, real audio and layout per language before ACTIVE_LOCALES changes"]};
writeFileSync("docs/translation-readiness-20261028.json",JSON.stringify(report,null,2)+"\n");
if(process.argv.includes("--record-ro-sources"))writeFileSync("src/content/translations/people.ro.sources.json",JSON.stringify({status:"draft",recorded:"2026-10-28",sources:Object.fromEntries(libraryPeople.map(person=>[person.slug,sourceFingerprint(biographyTranslationSource(person))]))},null,2)+"\n");
console.log(JSON.stringify({sourceStrings:Object.values(report.domains).reduce((n,d)=>n+d.sourceStrings,0),roBiographyStrings:roLeaves,roBookStrings:bookLeaves,museumDraftStrings:museumDrafts.reduce((sum,item)=>sum+item.translatedStrings,0),shortReadDraftStrings:shortReadDrafts.reduce((sum,item)=>sum+item.translatedStrings,0),activeLocales:ACTIVE_LOCALES}));

if(process.argv.includes("--record-ro-book-sources"))writeFileSync("src/content/translations/books.ro.sources.json",JSON.stringify({status:"draft",recorded:"2026-10-28",sources:Object.fromEntries(originalBooks.filter(book=>roBooks[book.slug]).map(book=>[book.slug,sourceFingerprint(bookTranslationSource(book))]))},null,2)+"\n");
