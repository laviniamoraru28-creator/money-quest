import {libraryPeople} from "./people";

/** Keep unpublished biographies in the source catalogue for later review. */
export const publishedBiographySlugs = new Set([
  "ada-lovelace-beyond-number-crunching",
  "madam-cj-walker-a-business-and-a-network",
  "katherine-johnson-checking-the-numbers",
  "tim-berners-lee-sharing-information",
  "beatrix-potter-drawing-writing-and-making",
]);
export const publicLibraryPeople = libraryPeople.filter(person => publishedBiographySlugs.has(person.slug));
