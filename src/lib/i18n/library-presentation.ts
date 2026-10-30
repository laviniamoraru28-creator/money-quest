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
import {originalBooks} from "@/content/library";
import {libraryPeople} from "@/content/people";
import {authorBooks} from "@/content/author-books";
import externalBooks from "@/content/translations/author-books.ro.json";
import externalManifest from "@/content/translations/author-books.sources.json";

const biographyDrafts:Partial<Record<Locale,Record<string,unknown>>>={ro:people,es:peopleEs,fr:peopleFr,de:peopleDe,it:peopleIt,pt:peoplePt,nl:peopleNl,pl:peoplePl};
export type ReaderPresentation={book:OriginalBook;locale:Locale;paragraphsPerPage:1|2};
export type BiographyPresentation={person:LibraryPerson;locale:Locale};
export type ShelfPresentation={locale:Locale;books:OriginalBook[];people:LibraryPerson[];published:typeof authorBooks};
export function publicLibraryLocale(requested:string):Locale {
 const active:readonly string[]=ACTIVE_LOCALES;
 return isSupportedLocale(requested)&&active.includes(requested)?requested:"en";
}
export function draftReaderPresentation(book:OriginalBook,locale:Locale):ReaderPresentation {
 // Layout comes from the canonical edition, never a translated audience label.
 const paragraphsPerPage=book.audience.startsWith("Explorer")?1:2;
 if(locale==="en")return {book,locale,paragraphsPerPage};
 if(locale!=="ro")throw new Error(`Original-book translation not ready: ${locale}`);
 const slug=book.slug as keyof typeof books;
 if(!books[slug]||!bookManifest.sources[slug])throw new Error(`Missing original-book translation: ${book.slug}`);
 return {book:draftTranslatedBook(book,books[slug],bookManifest.sources[slug]),locale,paragraphsPerPage};
}
export function draftBiographyPresentation(person:LibraryPerson,locale:Locale):BiographyPresentation {
 if(locale==="en")return {person,locale};
 const draft=biographyDrafts[locale];if(!draft)throw new Error(`Biography translation not ready: ${locale}`);
 const slug=person.slug as keyof typeof peopleManifest.sources;
 if(!draft[slug]||!peopleManifest.sources[slug])throw new Error(`Missing biography translation: ${person.slug}`);
 return {person:draftTranslatedBiography(person,draft[slug],peopleManifest.sources[slug]),locale};
}
export function draftShelfPresentation(locale:Locale):ShelfPresentation {
 if(locale!=="en"&&locale!=="ro")throw new Error(`Library shelf content not ready: ${locale}`);
 return {
  locale,books:originalBooks.map(book=>draftReaderPresentation(book,locale).book),
  people:libraryPeople.map(person=>draftBiographyPresentation(person,locale).person),
  published:authorBooks.map(book=>{
   if(locale==="en")return book;
   const id=book.id as keyof typeof externalBooks;
   if(!externalBooks[id]||!externalManifest.sources[id])throw new Error(`Missing external-book translation: ${book.id}`);
   return draftTranslatedExternalBook(book,externalBooks[id],externalManifest.sources[id]);
  })
 };
}
