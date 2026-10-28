import {mkdir,open,readFile,rename,unlink} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
export type Review={id:string;rating:number;comment:string;status:"pending"|"approved"};
type Store={counts:[number,number,number,number,number];comments:Review[]};
const empty=():Store=>({counts:[0,0,0,0,0],comments:[]});
function filename(){const file=process.env.MONEYQUEST_REVIEW_STORE_PATH;if(!file||!path.isAbsolute(file)||!file.endsWith(".json"))throw new Error("Reviews are not configured");return file;}
async function read(file:string):Promise<Store>{
  try {
    const data=JSON.parse(await readFile(file,"utf8"));
    if(!Array.isArray(data.counts)||data.counts.length!==5||!data.counts.every((n:unknown)=>Number.isSafeInteger(n)&&(n as number)>=0)||!Array.isArray(data.comments)||!data.comments.every((r:Review)=>r&&typeof r.id==="string"&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5&&typeof r.comment==="string"&&["pending","approved"].includes(r.status)))throw new Error("Invalid review data");
    return data;
  }catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return empty();throw error;}
}
async function change<T>(fn:(store:Store)=>T):Promise<T>{
  const file=filename();await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  const lock=`${file}.lock`;let handle;
  for(let attempt=0;attempt<15;attempt++){
    try{handle=await open(lock,"wx",0o600);break;}catch(error){if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;await new Promise(resolve=>setTimeout(resolve,25));}
  }
  if(!handle)throw new Error("Review storage busy");
  const temporary=`${file}.${randomUUID()}.tmp`;
  try{
    const store=await read(file);const result=fn(store);
    const output=await open(temporary,"wx",0o600);try{await output.writeFile(JSON.stringify(store));await output.sync();}finally{await output.close();}
    await rename(temporary,file);return result;
  }finally{await unlink(temporary).catch(()=>{});await handle.close();await unlink(lock).catch(()=>{});}
}
export async function publicReviews(){
  const data=await read(filename());const total=data.counts.reduce((a,b)=>a+b,0);
  return {count:total,average:total?data.counts.reduce((sum,n,i)=>sum+n*(i+1),0)/total:null,comments:data.comments.filter(r=>r.status==="approved").map(({rating,comment})=>({rating,comment}))};
}
export function validateReview(value:unknown):{rating:number;comment:string}{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Choose a rating from 1 to 5.");
  const data=value as Record<string,unknown>;
  if(Object.keys(data).some(key=>!["rating","comment"].includes(key)))throw new Error("Only a rating and optional comment are accepted.");
  if(!Number.isInteger(data.rating)||(data.rating as number)<1||(data.rating as number)>5)throw new Error("Choose a rating from 1 to 5.");
  if(typeof data.comment!=="string"||data.comment.length>500)throw new Error("Keep the comment to 500 characters or fewer.");
  const comment=data.comment.trim();
  if(/[<>]|https?:|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s()+-]*){7,}/i.test(comment))throw new Error("Please remove links, email addresses, phone numbers and HTML. Do not include names or other personal details.");
  return {rating:data.rating as number,comment};
}
export async function submitReview(value:unknown){
  const data=validateReview(value);
  return change(store=>{
    if(store.counts.reduce((a,b)=>a+b,0)>=100000||store.comments.length>=500)throw new Error("Feedback capacity reached");
    store.counts[data.rating-1]!++;
    if(data.comment)store.comments.push({id:randomUUID(),rating:data.rating,comment:data.comment,status:"pending"});
    return {pending:Boolean(data.comment)};
  });
}
export async function moderateReview(action:string,id?:string){
  if(action==="list")return (await read(filename())).comments;
  if(!["approve","reject"].includes(action)||!id)throw new Error("Invalid moderation action");
  return change(store=>{
    const index=store.comments.findIndex(r=>r.id===id);if(index<0)throw new Error("Review not pending");
    if(action==="approve")store.comments[index]!.status="approved";
    else store.comments.splice(index,1);
    return {updated:true};
  });
}
