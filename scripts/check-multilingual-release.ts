import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {LOCALES,ACTIVE_LOCALES,type Locale} from "../src/i18n/config";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {learningLabs} from "../src/content/learning-labs";
import {labAgeVariants} from "../src/content/lab-age-variants";
import {authorBooks} from "../src/content/author-books";
import {museumRooms,libraryBooks} from "../src/content/discovery";
import {discoveryNotes} from "../src/content/discovery-notes";
import {bookTranslationSource,biographyTranslationSource,laboratoryTranslationSource,museumTranslationSource,shortReadTranslationSource,externalBookTranslationSource,assertTranslationShape,sourceFingerprint} from "../src/lib/i18n/content-translations";

/** This is a release blocker inventory, never a native-editor certification. */
const groups=[
 {id:"originalBooks",file:"books",source:Object.fromEntries(originalBooks.map(book=>[book.slug,bookTranslationSource(book)]))},
 {id:"laboratories",file:"laboratories",source:Object.fromEntries(learningLabs.map(lab=>[lab.slug,laboratoryTranslationSource(lab,labAgeVariants)]))},
 {id:"biographies",file:"people",source:Object.fromEntries(libraryPeople.map(person=>[person.slug,biographyTranslationSource(person)]))},
 {id:"museumRooms",file:"museum",source:Object.fromEntries(museumRooms.map(room=>[room.slug,museumTranslationSource(room,discoveryNotes[room.slug]!)]))},
 {id:"shortReads",file:"short-reads",source:Object.fromEntries(libraryBooks.map(book=>[book.slug,shortReadTranslationSource(book,discoveryNotes[book.slug]!)]))},
 {id:"externalBookIntroductions",file:"author-books",source:Object.fromEntries(authorBooks.map(book=>[book.id,externalBookTranslationSource(book)]))}
];
const blockers:string[]=[];
const matrix:Record<string,unknown>={};
for(const locale of LOCALES){
 const row:Record<string,unknown>={};
 for(const group of groups){
  if(locale==="en"){row[group.id]={status:"source",entries:Object.keys(group.source).length};continue;}
  const filename=`src/content/translations/${group.file}.${locale}.json`;
  if(!existsSync(filename)){row[group.id]={status:"missing",file:filename,entries:Object.keys(group.source).length};blockers.push(`${locale}: missing ${group.id}`);continue;}
  try{
   const translations=JSON.parse(readFileSync(filename,"utf8"));
   const strings=assertTranslationShape(group.source,translations,`${locale}/${group.id}`);
   row[group.id]={status:"shape-checked",entries:Object.keys(group.source).length,strings,sourceHash:sourceFingerprint(group.source)};
  }catch(error){row[group.id]={status:"invalid",reason:String(error)};blockers.push(`${locale}: invalid ${group.id}`);}
 }
 matrix[locale]=row;
}
const currentLocaleSet:readonly string[]=ACTIVE_LOCALES;
for(const locale of LOCALES)if(!currentLocaleSet.includes(locale))blockers.push(`${locale}: public route not activated`);
/** Explicit remaining integration blockers. Remove only with localized code and verification. */
const integrationBlockers=[
 "Live storefront accepts only English, including checkout consent and order communication",
 "Parent/privacy message summaries still contain legacy absolute no-data claims requiring multilingual factual review",
 "Several learning pages still export English-only metadata",
 "Complete nine-language browser journeys, overflow, keyboard and narration checks are pending",
 "Free legacy website worksheets and samples remain English; multilingual paid bundles are separate"
];
blockers.push(...integrationBlockers);
const report={generated:new Date().toISOString(),plannedLocales:LOCALES,activeLocales:ACTIVE_LOCALES,releaseReady:blockers.length===0,editorialReview:"AI draft review; no independent native-editor certification",scope:"Six authored content groups, route activation and explicit remaining integration work. Message key parity, browser layout and legal text require separate validation.",matrix,blockers};
const output=process.argv.find(value=>value.startsWith("--output="))?.slice(9);
if(output)writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
if(!report.releaseReady&&!process.argv.includes("--inventory-only"))process.exitCode=1;
