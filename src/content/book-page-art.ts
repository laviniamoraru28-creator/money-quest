import artwork from "./book-page-art.json";

export type BookPageArt={src:string;width:number;height:number;sourceHash:string};
const pages:Readonly<Record<string,BookPageArt>>=artwork;

/** Chapter and part are canonical indices, independent of translated titles. */
export function bookPageArt(slug:string,chapter:number,part:number):BookPageArt|undefined{
  return pages[`${slug}:${chapter}:${part}`];
}
