import {LESSON_STRUCTURES} from "@/content/curriculum/structures";

export function normalizeSearch(text:string):string {
 return text.normalize("NFD").replace(/\p{M}/gu,"").replace(/[łŁ]/g,"l").toLocaleLowerCase().replace(/\s+/g," ").trim();
}
function strings(value:unknown):string {
 if(typeof value==="string")return value;
 if(Array.isArray(value))return value.map(strings).join(" ");
 if(value&&typeof value==="object")return Object.values(value).map(strings).join(" ");
 return "";
}
/** Search actual translated lesson copy, including vocabulary, explanations and questions. */
export function findLessons(curriculum:unknown,query:string) {
 if(!curriculum||typeof curriculum!=="object")return [];
 const terms=normalizeSearch(query).slice(0,100).split(" ").filter(Boolean);
 if(!terms.length)return [];
 return LESSON_STRUCTURES.flatMap(lesson=>{
  const copy=(curriculum as Record<string,unknown>)[lesson.id];
  if(!copy||typeof copy!=="object"||!("title" in copy)||typeof copy.title!=="string")return [];
  const text=normalizeSearch(strings(copy));
  if(!terms.every(term=>text.includes(term)))return [];
  const title=copy.title;
  return [{...lesson,title,href:`/play/world/${lesson.worldId}/lesson/${lesson.id}`,score:terms.every(term=>normalizeSearch(title).includes(term))?0:1}];
 }).sort((a,b)=>a.score-b.score||a.orderIndex-b.orderIndex);
}
