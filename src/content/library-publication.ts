import {originalBooks} from "./library";
import {libraryBooks} from "./discovery";

/** Preserve the complete text catalogue already available on production main.
 * Artwork coverage is a separate release gate, never a reason to hide books. */
export const publicOriginalBooks = originalBooks;
export const publicShortReads = libraryBooks;
export const publicLibraryStorySlugs = new Set(
  [...publicOriginalBooks, ...publicShortReads].map(book => book.slug)
);
