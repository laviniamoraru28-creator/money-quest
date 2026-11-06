import type {OriginalBook} from "@/content/original-books";
import type {LibraryPerson} from "@/content/people";
import {ACTIVE_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import books from "@/content/translations/books.ro.json";
import bookManifest from "@/content/translations/books.ro.sources.json";
import people from "@/content/translations/people.ro.json";
import peopleManifest from "@/content/translations/people.sources.json";
import peopleEs from "@/content/translations/people.es.json";
import peopleFr from "@/content/translations/people.fr.json";
import peopleDe from "@/content/translations/people.de.json";
import peopleIt from "@/content/translations/people.it.json";
import peoplePt from "@/content/translations/people.pt.json";
import peopleNl from "@/content/translations/people.nl.json";
import peoplePl from "@/content/translations/people.pl.json";
import {draftTranslatedBook,draftTranslatedBiography} from "./content-translations";
import {draftTranslatedExternalBook} from "./content-translations";
import {publicOriginalBooks} from "@/content/library-publication";
import {publicLibraryPeople} from "@/content/people-publication";
import {authorBooks} from "@/content/author-books";
import externalBooks from "@/content/translations/author-books.ro.json";
import externalManifest from "@/content/translations/author-books.sources.json";
import externalES from "@/content/translations/author-books.es.json";
import externalFR from "@/content/translations/author-books.fr.json";
import externalDE from "@/content/translations/author-books.de.json";
import externalIT from "@/content/translations/author-books.it.json";
import externalPT from "@/content/translations/author-books.pt.json";
import externalNL from "@/content/translations/author-books.nl.json";
import externalPL from "@/content/translations/author-books.pl.json";
import booksES from "@/content/translations/books.es.json";
import booksFR from "@/content/translations/books.fr.json";
import booksDE from "@/content/translations/books.de.json";
import booksIT from "@/content/translations/books.it.json";
import booksPT from "@/content/translations/books.pt.json";
import booksNL from "@/content/translations/books.nl.json";
import booksPL from "@/content/translations/books.pl.json";
const bookDrafts:Partial<Record<Locale,Record<string,unknown>>>={ro:books,es:booksES,fr:booksFR,de:booksDE,it:booksIT,pt:booksPT,nl:booksNL,pl:booksPL};
const externalDrafts:Partial<Record<Locale,Record<string,unknown>>>={ro:externalBooks,es:externalES,fr:externalFR,de:externalDE,it:externalIT,pt:externalPT,nl:externalNL,pl:externalPL};

const biographyDrafts:Partial<Record<Locale,Record<string,unknown>>>={ro:people,es:peopleEs,fr:peopleFr,de:peopleDe,it:peopleIt,pt:peoplePt,nl:peopleNl,pl:peoplePl};
export type ReaderPresentation={book:OriginalBook;locale:Locale;paragraphsPerPage:1|2|4};
export type BiographyPresentation={person:LibraryPerson;locale:Locale};
export type ShelfPresentation={locale:Locale;books:OriginalBook[];people:LibraryPerson[];published:typeof authorBooks};
export function publicLibraryLocale(requested:string):Locale {
 const active:readonly string[]=ACTIVE_LOCALES;
 return isSupportedLocale(requested)&&active.includes(requested)?requested:"en";
}
const shortChapterIndices:Record<string,number[]> = {
  "the-little-compass-and-the-money-choices":[0,2,4,6,7],
  "the-garden-everyone-could-enter":[0,1,2,4,5],
};
export function draftReaderPresentation(book:OriginalBook,locale:Locale):ReaderPresentation {
 // Layout comes from the canonical edition, never a translated audience label.
 const paragraphsPerPage=4;
 const shorten=(edition:OriginalBook):OriginalBook=>({...edition,chapters:(shortChapterIndices[edition.slug]??edition.chapters.map((_,i)=>i)).map(index=>edition.chapters[index]!).filter(Boolean)});
 if(locale==="en")return {book:shorten(book),locale,paragraphsPerPage};
 const draft=bookDrafts[locale];if(!draft)throw new Error(`Original-book translation not ready: ${locale}`);
 const slug=book.slug as keyof typeof books;
 if(!draft[slug]||!bookManifest.sources[slug])throw new Error(`Missing original-book translation: ${book.slug}`);
 return {book:shorten(draftTranslatedBook(book,draft[slug],bookManifest.sources[slug])),locale,paragraphsPerPage};
}
export function draftBiographyPresentation(person:LibraryPerson,locale:Locale):BiographyPresentation {
 if(locale==="en")return {person,locale};
 const draft=biographyDrafts[locale];if(!draft)throw new Error(`Biography translation not ready: ${locale}`);
 const slug=person.slug as keyof typeof peopleManifest.sources;
 if(!draft[slug]||!peopleManifest.sources[slug])throw new Error(`Missing biography translation: ${person.slug}`);
 return {person:draftTranslatedBiography(person,draft[slug],peopleManifest.sources[slug]),locale};
}
export function draftPublishedBook(book:typeof authorBooks[number],locale:Locale):typeof authorBooks[number]{
 if(locale==="en")return book;
 const draft=externalDrafts[locale];if(!draft)throw new Error(`Published-book introduction not ready: ${locale}`);
 const id=book.id as keyof typeof externalManifest.sources;
 if(!draft[id]||!externalManifest.sources[id])throw new Error(`Missing published-book introduction: ${book.id}`);
 return draftTranslatedExternalBook(book,draft[id],externalManifest.sources[id]);
}
export function draftShelfPresentation(locale:Locale):ShelfPresentation {

 return {
  locale,books:publicOriginalBooks.map(book=>draftReaderPresentation(book,locale).book),
  people:publicLibraryPeople.map(person=>draftBiographyPresentation(person,locale).person),
  published:authorBooks.map(book=>draftPublishedBook(book,locale))
 };
}
