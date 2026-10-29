import {createHash} from "node:crypto";
import type {OriginalBook} from "@/content/original-books";
import type {Biography} from "@/content/people";
import type {Room,Book} from "@/content/discovery";
import type {DiscoveryNote} from "@/content/discovery-notes";
const FIELDS=["title","topic","ages","alt","playful","sections","takeaways","illustrationNote"] as const;
export function biographyTranslationSource(person:Biography){
 return Object.fromEntries(FIELDS.filter(key=>person[key]!==undefined).map(key=>[key,person[key]]));
}
export function sourceFingerprint(value:unknown){return createHash("sha256").update(JSON.stringify(value)).digest("hex")}
export function assertTranslationShape(source:unknown,translation:unknown,path="content"):number{
 if(typeof source==="string"){
  if(typeof translation!=="string"||!translation.trim())throw new Error(`Missing translated text: ${path}`);
  return 1;
 }
 if(Array.isArray(source)){
  if(!Array.isArray(translation)||source.length!==translation.length)throw new Error(`Changed array structure: ${path}`);
  return source.reduce((count,item,index)=>count+assertTranslationShape(item,translation[index],`${path}.${index}`),0);
 }
 if(source&&typeof source==="object"){
  if(!translation||typeof translation!=="object"||Array.isArray(translation))throw new Error(`Missing object: ${path}`);
  const left=source as Record<string,unknown>,right=translation as Record<string,unknown>;
  if(JSON.stringify(Object.keys(left).sort())!==JSON.stringify(Object.keys(right).sort()))throw new Error(`Missing or unexpected fields: ${path}`);
  return Object.entries(left).reduce((count,[key,value])=>count+assertTranslationShape(value,right[key],`${path}.${key}`),0);
 }
 if(source!==translation)throw new Error(`Changed structural value: ${path}`);return 0;
}
export function draftTranslatedBiography(person:Biography,translation:unknown,expectedSourceHash:string):Biography{
 const source=biographyTranslationSource(person);
 if(sourceFingerprint(source)!==expectedSourceHash)throw new Error(`Stale translation: ${person.slug}`);
 assertTranslationShape(source,translation,person.slug);
 // Only the exact translatable projection is accepted. Names, sources, dates,
 // slugs, image paths and quiz structure can never be overwritten by copy.
 return {...person,...translation as ReturnType<typeof biographyTranslationSource>} as Biography;
}

const BOOK_FIELDS=["title","subtitle","audience","description","coverAlt","chapters","glossary"] as const;
export function bookTranslationSource(book:OriginalBook){return Object.fromEntries(BOOK_FIELDS.map(key=>[key,book[key]]))}
export function draftTranslatedBook(book:OriginalBook,translation:unknown,expectedSourceHash:string):OriginalBook{
 const source=bookTranslationSource(book);
 if(sourceFingerprint(source)!==expectedSourceHash)throw new Error(`Stale translation: ${book.slug}`);
 assertTranslationShape(source,translation,book.slug);
 return {...book,...translation as ReturnType<typeof bookTranslationSource>} as OriginalBook;
}

/** Text projection excludes identifiers, artwork, source URLs and bibliography titles. */
export function museumTranslationSource(room:Room,note:DiscoveryNote){
 return {room:{title:room.title,intro:room.intro,story:room.story,quiz:room.quiz,explanation:room.explanation,activity:room.activity},note:{feedback:note.feedback,challenges:note.challenges}};
}
export function draftTranslatedMuseum(room:Room,note:DiscoveryNote,translation:unknown,expectedSourceHash:string):{room:Room;note:DiscoveryNote}{
 const source=museumTranslationSource(room,note);
 if(sourceFingerprint(source)!==expectedSourceHash)throw new Error(`Stale translation: museum/${room.slug}`);
 assertTranslationShape(source,translation,room.slug);
 const copy=translation as ReturnType<typeof museumTranslationSource>;
 return {room:{...room,...copy.room},note:{...note,...copy.note}};
}
export function shortReadTranslationSource(book:Book,note:DiscoveryNote){
 return {book:{title:book.title,topic:book.topic,pages:book.pages,quiz:book.quiz},note:{feedback:note.feedback,challenges:note.challenges}};
}
export function draftTranslatedShortRead(book:Book,note:DiscoveryNote,translation:unknown,expectedSourceHash:string):{book:Book;note:DiscoveryNote}{
 const source=shortReadTranslationSource(book,note);
 if(sourceFingerprint(source)!==expectedSourceHash)throw new Error(`Stale translation: short-read/${book.slug}`);
 assertTranslationShape(source,translation,book.slug);
 const copy=translation as ReturnType<typeof shortReadTranslationSource>;
 return {book:{...book,...copy.book},note:{...note,...copy.note}};
}
