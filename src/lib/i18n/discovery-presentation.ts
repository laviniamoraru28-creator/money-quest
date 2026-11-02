import {museumRooms,libraryBooks,type Room,type Book} from "@/content/discovery";
import {discoveryNotes,type DiscoveryNote} from "@/content/discovery-notes";
import type {Locale} from "@/i18n/config";
import {draftTranslatedMuseum,draftTranslatedShortRead} from "./content-translations";
import {draftShelfPresentation,publicLibraryLocale,type ShelfPresentation} from "./library-presentation";
import museumManifest from "@/content/translations/museum.sources.json";
import shortReadManifest from "@/content/translations/short-reads.sources.json";
import museumRO from "@/content/translations/museum.ro.json";
import museumES from "@/content/translations/museum.es.json";
import museumFR from "@/content/translations/museum.fr.json";
import museumDE from "@/content/translations/museum.de.json";
import museumIT from "@/content/translations/museum.it.json";
import museumPT from "@/content/translations/museum.pt.json";
import museumNL from "@/content/translations/museum.nl.json";
import museumPL from "@/content/translations/museum.pl.json";
import shortReadsRO from "@/content/translations/short-reads.ro.json";
import shortReadsES from "@/content/translations/short-reads.es.json";
import shortReadsFR from "@/content/translations/short-reads.fr.json";
import shortReadsDE from "@/content/translations/short-reads.de.json";
import shortReadsIT from "@/content/translations/short-reads.it.json";
import shortReadsPT from "@/content/translations/short-reads.pt.json";
import shortReadsNL from "@/content/translations/short-reads.nl.json";
import shortReadsPL from "@/content/translations/short-reads.pl.json";
const museumDrafts:Record<Exclude<Locale,"en">,Record<string,unknown>>={ro:museumRO,es:museumES,fr:museumFR,de:museumDE,it:museumIT,pt:museumPT,nl:museumNL,pl:museumPL};
const shortReadsDrafts:Record<Exclude<Locale,"en">,Record<string,unknown>>={ro:shortReadsRO,es:shortReadsES,fr:shortReadsFR,de:shortReadsDE,it:shortReadsIT,pt:shortReadsPT,nl:shortReadsNL,pl:shortReadsPL};
export type DiscoveryCard={slug:string;title:string;summary:string};
type Base={locale:Locale;entries:DiscoveryCard[];note?:DiscoveryNote};
export type DiscoveryPresentation=Base&(
 {kind:"museum";item?:Room;shelves?:never}|
 {kind:"library";item?:Book;shelves?:ShelfPresentation}
);
export type DiscoveryKind=DiscoveryPresentation["kind"];

/** Full text is selected on the server. The browser receives cards and only the current detail. */
export function draftDiscoveryPresentation(kind:DiscoveryKind,locale:Locale,slug?:string):DiscoveryPresentation {
 if(kind==="museum"){
  const translated=museumRooms.map(room=>{
   const note=discoveryNotes[room.slug];if(!note)throw new Error(`Missing discovery note: ${room.slug}`);
   if(locale==="en")return {room,note};
   const hash=(museumManifest.sources as Record<string,string>)[room.slug];
   if(!hash)throw new Error(`Missing museum source fingerprint: ${room.slug}`);
   return draftTranslatedMuseum(room,note,museumDrafts[locale][room.slug],hash);
  });
  const selected=translated.find(entry=>entry.room.slug===slug);
  if(slug&&!selected)throw new Error(`Unknown museum discovery: ${slug}`);
  return {kind,locale,entries:translated.map(({room})=>({slug:room.slug,title:room.title,summary:room.intro})),item:selected?.room,note:selected?.note};
 }
 const translated=libraryBooks.map(book=>{
  const note=discoveryNotes[book.slug];if(!note)throw new Error(`Missing discovery note: ${book.slug}`);
  if(locale==="en")return {book,note};
  const hash=(shortReadManifest.sources as Record<string,string>)[book.slug];
  if(!hash)throw new Error(`Missing short-read source fingerprint: ${book.slug}`);
  return draftTranslatedShortRead(book,note,shortReadsDrafts[locale][book.slug],hash);
 });
 const selected=translated.find(entry=>entry.book.slug===slug);
 if(slug&&!selected)throw new Error(`Unknown short-read discovery: ${slug}`);
 return {kind,locale,entries:translated.map(({book})=>({slug:book.slug,title:book.title,summary:book.topic})),item:selected?.book,note:selected?.note,...(!slug?{shelves:draftShelfPresentation(locale)}:{})};
}
/** UI/content drafts never bypass the public activation gate. */
export function publicDiscoveryPresentation(kind:DiscoveryKind,requestedLocale:string,slug?:string) {
 return draftDiscoveryPresentation(kind,publicLibraryLocale(requestedLocale),slug);
}
