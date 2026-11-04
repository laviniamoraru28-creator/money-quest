import {originalBooks} from "./library";
import {libraryBooks} from "./discovery";

/** Editorial release list. All drafts, translations and artwork remain in their
 * source collections. Add a title only after every reading page is reviewed. */
export const publicOriginalBooks = originalBooks.filter(book =>
  book.slug === "the-little-compass-and-the-money-choices"
);
/** Short reads currently lack dedicated page artwork and remain unpublished. */
export const publicShortReads = libraryBooks.filter(() => false);
export const publicLibraryStorySlugs = new Set(
  [...publicOriginalBooks, ...publicShortReads].map(book => book.slug)
);
