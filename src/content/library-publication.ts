import {originalBooks} from "./library";
import {libraryBooks} from "./discovery";

/** Owner-approved publication subset. Keep every manuscript in its source
 * catalogue; only visually reviewed, fully illustrated editions get routes. */
export const publishedOriginalSlugs = new Set([
  "the-little-compass-and-the-money-choices",
  "the-garden-everyone-could-enter",
]);
export const publicOriginalBooks = originalBooks.filter(book => publishedOriginalSlugs.has(book.slug));
export const publicShortReads: typeof libraryBooks = [];
export const publicLibraryStorySlugs = new Set(
  [...publicOriginalBooks, ...publicShortReads].map(book => book.slug)
);
