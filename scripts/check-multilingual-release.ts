import {LESSON_WORKSHEETS} from "../src/content/worksheets";
import {reviewsCopy} from "../src/content/reviews-copy";
import {liveShopCopy} from "../src/content/live-shop-copy";
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
/** Empty source fields are intentional hidden notices, not missing translations. */
function markAllowedEmpty(source:any,value:any):any{
 if(source===""&&value==="")return "__INTENTIONALLY_EMPTY__";
 if(Array.isArray(value))return value.map((item,index)=>markAllowedEmpty(source?.[index],item));
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,markAllowedEmpty(source?.[key],item)]));
 return value;
}
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
// File availability is part of the multilingual website contract. Merchant
// credentials and hosted payment evidence are a separate activation gate.
for(const locale of LOCALES){
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const english=JSON.parse(readFileSync("messages/en.json","utf8"));
 try{assertTranslationShape(markAllowedEmpty(english,english),markAllowedEmpty(english,messages),`messages/${locale}`);}catch(error){blockers.push(`${locale}: message structure invalid: ${String(error)}`);}
 for(const filename of Object.values(LESSON_WORKSHEETS))if(!existsSync(`public/worksheets/${locale}/${filename}`))blockers.push(`${locale}: missing worksheet ${filename}`);
 if(!existsSync(`public/worksheets/${locale}/money-quest-worksheets-answer-key.pdf`))blockers.push(`${locale}: missing answer guide`);
 for(const stem of ["free-family-sample","free-journal-week-one"])if(!existsSync(`public/resources/samples/${stem}-${locale}.pdf`))blockers.push(`${locale}: missing ${stem}`);
 for(const [name,copy] of [["reviews",reviewsCopy],["live shop",liveShopCopy]] as const){try{assertTranslationShape(copy.en,copy[locale],`${name}/${locale}`);}catch(error){blockers.push(String(error));}}
}
const report={generated:new Date().toISOString(),plannedLocales:LOCALES,activeLocales:ACTIVE_LOCALES,releaseReady:blockers.length===0,editorialReview:"AI draft review; no independent native-editor certification",scope:"Six authored content groups, nine-locale message shape, route activation, localized UI copy and all current public PDFs. Browser/voice quality and merchant configuration require separate evidence.",commerceReady:false,commerceNote:"Commerce stays off until actual private host configuration, reviewed merchant policies and complete hosted settlement/email/download tests pass.",matrix,blockers};
const output=process.argv.find(value=>value.startsWith("--output="))?.slice(9);
if(output)writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
if(!report.releaseReady&&!process.argv.includes("--inventory-only"))process.exitCode=1;
