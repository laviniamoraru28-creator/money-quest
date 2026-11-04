import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {basename} from "node:path";
import {libraryPeople} from "../src/content/people";
import {originalBooks} from "../src/content/library";
import {bookPageArt} from "../src/content/book-page-art";
import {publicOriginalBooks} from "../src/content/library-publication";
import artwork from "../src/content/book-page-art.json";

const hash=(value:string|Buffer)=>createHash("sha256").update(value).digest("hex");
function imageHash(src:string){
  assert(src.startsWith("/images/money-quest/"));
  const bytes=readFileSync(`public${src}`);
  assert.equal(bytes.toString("ascii",0,4),"RIFF",src);
  assert.equal(bytes.toString("ascii",8,12),"WEBP",src);
  assert(bytes.length>1000,`${src}: reject empty or placeholder assets`);
  return hash(bytes);
}
const portraits=new Set<string>();
for(const person of libraryPeople){
  assert(person.image.startsWith("/images/money-quest/people/"),`${person.name}: needs a dedicated portrait`);
  assert(person.slug.startsWith(basename(person.image).replace(/(?:-v\d+)?\.webp$/,"")),`${person.name}: portrait belongs to this person`);
  const digest=imageHash(person.image);
  assert(!portraits.has(digest),`${person.name}: do not reuse another person's portrait`);
  portraits.add(digest);
}

let expected=0,generated=0;
const seen=new Set<string>();
for(const book of originalBooks){
  const perPage=book.audience.startsWith("Explorer")?1:2;
  book.chapters.forEach((chapter,chapterIndex)=>{
    for(let part=0;part<Math.ceil(chapter.paragraphs.length/perPage);part++){
      expected++;
      const art=bookPageArt(book.slug,chapterIndex,part);
      if(!art)continue;
      generated++;
      assert((art.reusedFrom ? bookPageArt(book.slug,Number(art.reusedFrom.split(":")[1]),Number(art.reusedFrom.split(":")[2]))?.src===art.src : art.src.includes(`${book.slug}-c${chapterIndex+1}-p${part+1}-`)),"Page image is keyed to the correct book, chapter and part");
      assert.equal(art.sourceHash,hash(chapter.paragraphs.slice(part*perPage,part*perPage+perPage).join("\n")),"Artwork must be reviewed again if its source page changes");
      assert(art.width>0&&art.height>0&&art.width<=960&&art.height<=960);
      assert(existsSync(`public${art.src}`));
      const digest=imageHash(art.src);assert(art.reusedFrom||!seen.has(digest),"Reused illustrations require an explicit reviewed source mapping");seen.add(digest);
    }
  });
}
assert.equal(Object.keys(artwork).length,generated,"No orphaned artwork mappings");
if(process.argv.includes("--complete"))for(const book of publicOriginalBooks){
 const per=book.audience.startsWith("Explorer")?1:2;
 book.chapters.forEach((chapter,i)=>{for(let part=0;part<Math.ceil(chapter.paragraphs.length/per);part++)assert(bookPageArt(book.slug,i,part),`Missing public story artwork: ${book.slug}:${i}:${part}`);});
}
console.log(`PASS: ${portraits.size} correctly mapped distinct biography portraits and ${generated}/${expected} individual original-book illustrations; source alignment, explicit reviewed reuse, WebP assets and bounded dimensions.`);
