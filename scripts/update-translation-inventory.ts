import {writeFileSync,readFileSync} from "node:fs";
import {originalBooks} from "../src/content/library";
import {libraryPeople} from "../src/content/people";
import {libraryBooks,museumRooms} from "../src/content/discovery";
import {learningLabs} from "../src/content/learning-labs";
import {labAgeVariants} from "../src/content/lab-age-variants";
import {discoveryNotes} from "../src/content/discovery-notes";
import {authorBooks} from "../src/content/author-books";
import {orderErrorCopy} from "../src/lib/commerce/order-error";
import {draftPublishedBook} from "../src/lib/i18n/library-presentation";
import {draftBiographyPresentation} from "../src/lib/i18n/library-presentation";
import biographyManifest from "../src/content/translations/people.sources.json";
import {parentGuideCopy} from "../src/content/parent-guide-copy";
import {shopCatalogueCopy} from "../src/content/shop-catalogue-copy";
import {shopTermsCopy} from "../src/content/shop-terms-copy";
import {shopFlowCopy} from "../src/content/shop-flow-copy";
import {siteControlsCopy} from "../src/content/site-controls-copy";
import {discoveryCopy} from "../src/content/discovery-copy";
import {readerCopy} from "../src/content/reader-copy";
import {libraryShelfCopy} from "../src/content/library-shelf-copy";
import {laboratoryCopy} from "../src/content/laboratory-copy";
import {LOCALES,ACTIVE_LOCALES} from "../src/i18n/config";
import {biographyTranslationSource,bookTranslationSource,museumTranslationSource,draftTranslatedMuseum,shortReadTranslationSource,draftTranslatedShortRead,laboratoryTranslationSource,draftTranslatedLaboratory,externalBookTranslationSource,draftTranslatedExternalBook,sourceFingerprint,assertTranslationShape} from "../src/lib/i18n/content-translations";
const structural=new Set(["slug","id","name","icon","image","cover","source","sources","sourceTitle","checked","authors","illustrator","publisher","url"]);
function textLeaves(value:unknown,key=""):number{
 if(structural.has(key))return 0;
 if(typeof value==="string")return /^https?:|^\//.test(value)?0:1;
 if(Array.isArray(value))return value.reduce((n,item)=>n+textLeaves(item),0);
 if(value&&typeof value==="object")return Object.entries(value).reduce((n,[k,item])=>n+textLeaves(item,k),0);
 return 0;
}
const sources={originalBooks,biographies:libraryPeople.map(biographyTranslationSource),shortReads:libraryBooks,museumRooms,laboratories:learningLabs,labAgeVariants,discoveryNotes,externalBookIntroductions:authorBooks.map(externalBookTranslationSource)};
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
const labManifest=JSON.parse(readFileSync("src/content/translations/laboratories.sources.json","utf8"));
const labCopies=JSON.parse(readFileSync("src/content/translations/laboratories.ro.json","utf8"));
let labLeaves=0;
for(const lab of learningLabs){
 draftTranslatedLaboratory(lab,labAgeVariants,labCopies[lab.slug],labManifest.sources[lab.slug]);
 labLeaves+=assertTranslationShape(laboratoryTranslationSource(lab,labAgeVariants),labCopies[lab.slug],lab.slug);
}
const externalManifest=JSON.parse(readFileSync("src/content/translations/author-books.sources.json","utf8"));
const externalCopies=JSON.parse(readFileSync("src/content/translations/author-books.ro.json","utf8"));
let externalLeaves=0;
for(const book of authorBooks){
 draftTranslatedExternalBook(book,externalCopies[book.id],externalManifest.sources[book.id]);
 externalLeaves+=assertTranslationShape(externalBookTranslationSource(book),externalCopies[book.id],book.id);
}
const laboratoryInterfaceDrafts={locales:LOCALES,stringsPerLocale:Object.keys(laboratoryCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(laboratoryCopy.en,laboratoryCopy[locale],`lab-ui/${locale}`),0),contentSource:"src/content/laboratory-copy.json",sourceFingerprintManifest:"src/content/translations/laboratory-copy.sources.json",integration:"Three lab routes consume public-gated locale presentations; explicit EN/RO draft assembly and actual component SSR checked; other seven authored lab translations still missing",editorialStatus:"AI multilingual editorial drafts; no native-editor certification",remaining:"Non-English browser layout, interaction and real narration quality; global shared UI, metadata and PDFs"};
const libraryInterfaceDrafts={locales:LOCALES,stringsPerLocale:Object.keys(readerCopy.en).length+Object.keys(libraryShelfCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(readerCopy.en,readerCopy[locale],`reader-ui/${locale}`)+assertTranslationShape(libraryShelfCopy.en,libraryShelfCopy[locale],`shelf-ui/${locale}`),0),sourceFingerprintManifest:"src/content/translations/library-interface.sources.json",integration:"Public-gated original-reader, biography and shelf presentations; explicit EN/RO draft assembly with source hashes and actual component SSR checks",editorialStatus:"AI multilingual editorial drafts; not native-editor certified",remaining:"Global shared UI, metadata, other seven authored-content sets, non-English browser/real speech review and PDFs"};
const discoveryInterfaceDrafts={locales:LOCALES,stringsPerLocale:Object.keys(discoveryCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(discoveryCopy.en,discoveryCopy[locale],`discovery-ui/${locale}`),0),sourceFingerprintManifest:"src/content/translations/discovery-interface.sources.json",integration:"Server-assembled Museum and short-read drafts in all nine locales; 173 successful actual component SSR checks; public English-only gate. Full Library hub drafts only EN/RO until original content is translated",editorialStatus:"AI multilingual editorial drafts, not native-editor certified",remaining:"Other global/page content, remaining authored languages, metadata/SEO, commerce text, PDFs and non-English browser/real voice review"};
const commonControlsDrafts={locales:LOCALES,stringsPerLocale:Object.keys(siteControlsCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(siteControlsCopy.en,siteControlsCopy[locale],`site-controls/${locale}`),0),sourceFingerprintManifest:"src/content/translations/site-controls.sources.json",integration:"Selected-locale server copy for common narration/offline controls, structured and legacy worker errors, and active-only generated fallback pages; nine-locale toolbar SSR/fallback markup checks",editorialStatus:"AI multilingual editorial drafts, not native-editor certified",remaining:"Other page/consumer content and authored editions, SEO/metadata, PDFs, real non-English browser/voice review, final linguistic review and cold/legacy/cross-version multilingual offline review"};
const parentFlowDrafts={locales:LOCALES,stringsPerLocale:Object.keys(parentGuideCopy.en).length+Object.keys(shopFlowCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(parentGuideCopy.en,parentGuideCopy[locale],`parent-guide/${locale}`)+assertTranslationShape(shopFlowCopy.en,shopFlowCopy[locale],`shop-flow/${locale}`),0),sourceFingerprintManifest:"src/content/translations/parent-flow.sources.json",integration:"Complete parent resource guide and selected-locale checkout/order/recovery controls; 45 actual component SSR renders; public EN and sandbox-only gates unchanged",editorialStatus:"AI multilingual editorial drafts, not native-editor/legal certification",remaining:"Privacy/general parent pages, receipt contents/live policy translations, PDFs, remaining authored content, SEO and non-English browser/linguistic/legal review"};
const shopTermsDrafts={locales:LOCALES,stringsPerLocale:Object.keys(shopTermsCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(shopTermsCopy.en,shopTermsCopy[locale],`shop-terms/${locale}`),0),sourceFingerprintManifest:"src/content/translations/shop-terms.sources.json",integration:"Display-only terms presentation with nine actual component SSR renders; public English, consent version and sandbox gates unchanged",editorialStatus:"AI multilingual editorial drafts, not native-editor certification or local legal adaptation",remaining:"Receipts, live policy/interface translations, PDFs, seller details and final consumer-contract review before public sales"};
const shopCatalogueDrafts={locales:LOCALES,stringsPerLocale:assertTranslationShape(shopCatalogueCopy.en,shopCatalogueCopy.en,"catalogue/en"),translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(shopCatalogueCopy.en,shopCatalogueCopy[locale],`catalogue/${locale}`),0),sourceFingerprintManifest:"src/content/translations/shop-catalogue.sources.json",integration:"Full server-selected shop catalogue, two product displays, localized GBP, English-file sample/preview disclosure and FAQ; 18 actual component SSR renders; public English and sandbox gates unchanged",editorialStatus:"AI multilingual editorial drafts, not native-editor/legal certification or translated product editions",remaining:"Receipt contents, live policy/interface translations, other parent/privacy pages, actual printable manuscripts and final consumer/language/browser review"};
const biographyDrafts=biographyManifest.locales.map(value=>{const locale=value as typeof LOCALES[number];let translatedStrings=0;for(const person of libraryPeople){const result=draftBiographyPresentation(person,locale);translatedStrings+=assertTranslationShape(biographyTranslationSource(person),biographyTranslationSource(result.person),`biography/${locale}/${person.slug}`);}return {locale,entries:libraryPeople.length,translatedStrings,sourceFingerprintManifest:"src/content/translations/people.sources.json",integration:"Complete biography detail draft assembly and actual component SSR",editorialStatus:"AI multilingual editorial drafts, not native-editor certification",publicActivation:"blocked pending complete locale and browser/voice/editorial review"};});
const nativeOrderErrorDrafts={locales:LOCALES,stringsPerLocale:Object.keys(orderErrorCopy.en).length,translatedStrings:LOCALES.filter(locale=>locale!=="en").reduce((sum,locale)=>sum+assertTranslationShape(orderErrorCopy.en,orderErrorCopy[locale],`order-error/${locale}`),0),integration:"No-script private native download/receipt error pages; public English gate, no raw diagnostics/tokens, nine-locale markup checks and synthetic live browser checks",editorialStatus:"AI multilingual editorial drafts, not native-editor certification"};
const externalBookDrafts=(externalManifest.locales as string[]).map(value=>{const locale=value as typeof LOCALES[number];let translatedStrings=0;for(const book of authorBooks){const result=draftPublishedBook(book,locale);translatedStrings+=assertTranslationShape(externalBookTranslationSource(book),externalBookTranslationSource(result),`external/${locale}/${book.id}`);}return {locale,entries:authorBooks.length,translatedStrings,sourceFingerprintManifest:"src/content/translations/author-books.sources.json",integration:"Complete external-book introduction draft assembly; isolated author-shelf component SSR",editorialStatus:"AI multilingual editorial drafts, not native-editor certification",publicActivation:"blocked pending complete locale and browser/voice/editorial review"};});
const report={externalBookDrafts,biographyDrafts,nativeOrderErrorDrafts,shopCatalogueDrafts,shopTermsDrafts,parentFlowDrafts,commonControlsDrafts,discoveryInterfaceDrafts,libraryInterfaceDrafts,laboratoryInterfaceDrafts,generated:"2026-10-30",scope:"Eight authored-content groups only. Canonical bibliography and external published book titles are excluded from counts and retained in their published language. This inventory does not certify linguistic quality or cover all hardcoded UI, SEO, commerce policies or privately stored printable manuscripts.",activeLocales:ACTIVE_LOCALES,domains:Object.fromEntries(Object.entries(sources).map(([key,value])=>[key,{sourceStrings:textLeaves(value),sourceHash:sourceFingerprint(value)}])),locales:LOCALES.map(locale=>({locale,messageKeys:"validated separately; key parity does not prove authored-content translation",newContent:locale==="en"?"source edition":locale==="ro"?"All eight tracked authored-content groups have Romanian drafts, including 3 laboratories with age readings and 12 external-book introductions; laboratory, original-reader, biography, shelf and discovery UI with component SSR prepared; remaining global UI, SEO, PDFs and browser-language integration still pending":"10 biographies, 10 Museum rooms, 8 short reads and 12 external-book introductions have content drafts and scoped component SSR; original books, labs and the complete site remain unfinished",publicActivation:locale==="en"?"active":"blocked pending complete content and review"})),shortReadDrafts,shortReadSourceFingerprintManifest:"src/content/translations/short-reads.sources.json",museumDrafts,museumSourceFingerprintManifest:"src/content/translations/museum.sources.json",countingNote:"The initial inventory included 12 canonical source titles in discoveryNotes; a later projection also removes 12 external published book titles from translatable counts. All 24 original titles are preserved in source metadata, not deleted or presented as unverified localized editions.",romanianLaboratories:{entries:learningLabs.length,tasks:learningLabs.flatMap(lab=>lab.tasks).length,translatedStrings:labLeaves,editorialStatus:"AI bilingual editorial pass; not native-editor certified or rendered-language verified",sourceFingerprintManifest:"src/content/translations/laboratories.sources.json"},romanianExternalBooks:{entries:authorBooks.length,translatedStrings:externalLeaves,editorialStatus:"AI bilingual editorial pass; not native-editor certified or rendered-language verified",sourceFingerprintManifest:"src/content/translations/author-books.sources.json"},romanianBooks:{entries:Object.keys(roBooks).length,chapters:bookChapters,translatedStrings:bookLeaves,editorialStatus:"draft, not owner-reviewed",sourceFingerprintManifest:"src/content/translations/books.ro.sources.json"},romanianBiographies:{entries:libraryPeople.length,translatedStrings:roLeaves,editorialStatus:"draft, not owner-reviewed",sourceFingerprintManifest:"src/content/translations/people.ro.sources.json"},additionalWork:["Translate and wire every hardcoded UI and SEO field","Translate parent shop, consumer/privacy text and recovery flow","Translate all privately stored worksheets, journal pages, guides and answers","Proofread terminology, level labels, amounts, dates and right/wrong feedback","Validate routes, real audio and layout per language before ACTIVE_LOCALES changes"]};
writeFileSync("docs/translation-readiness-20261028.json",JSON.stringify(report,null,2)+"\n");
if(process.argv.includes("--record-ro-sources"))writeFileSync("src/content/translations/people.ro.sources.json",JSON.stringify({status:"draft",recorded:"2026-10-28",sources:Object.fromEntries(libraryPeople.map(person=>[person.slug,sourceFingerprint(biographyTranslationSource(person))]))},null,2)+"\n");
console.log(JSON.stringify({sourceStrings:Object.values(report.domains).reduce((n,d)=>n+d.sourceStrings,0),roBiographyStrings:roLeaves,roBookStrings:bookLeaves,roLaboratoryStrings:labLeaves,roExternalBookStrings:externalLeaves,museumDraftStrings:museumDrafts.reduce((sum,item)=>sum+item.translatedStrings,0),shortReadDraftStrings:shortReadDrafts.reduce((sum,item)=>sum+item.translatedStrings,0),activeLocales:ACTIVE_LOCALES}));

if(process.argv.includes("--record-ro-book-sources"))writeFileSync("src/content/translations/books.ro.sources.json",JSON.stringify({status:"draft",recorded:"2026-10-28",sources:Object.fromEntries(originalBooks.filter(book=>roBooks[book.slug]).map(book=>[book.slug,sourceFingerprint(bookTranslationSource(book))]))},null,2)+"\n");
