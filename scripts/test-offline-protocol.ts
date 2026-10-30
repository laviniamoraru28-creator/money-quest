import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {parseOfflineWorkerMessage} from "../src/lib/offline/messages";
import {offlineFallbackHtml} from "../src/lib/offline/fallback-page";

const PREFIX="moneyquest-offline-",READY="/__moneyquest_offline_ready__",origin="https://moneyquest.test";
type Mode="ok"|"manifest"|"file"|"path"|"quota"|"timeout"|"cleanup"|"paused";
function harness(mode:Mode="ok"){
 const stores=new Map<string,Map<string,Response>>(),handlers:Record<string,(event:any)=>void>={},fetched:string[]=[];
 let offline=false,release:()=>void=()=>{};
 const gate=new Promise<void>(resolve=>{release=resolve});
 const key=(path:string)=>new URL(path,origin).href;
 function seed(locale:string,version="old",legacy=false){
  stores.set(`${PREFIX}${version}-${locale}`,new Map([[key(READY),Response.json({locale,version})],[key("/offline.html"),new Response("legacy fallback")],...(!legacy?[[key(`/offline-pages/${locale}.html`),new Response(offlineFallbackHtml(locale as "en"|"ro"))] as [string,Response]]:[])]));
 }
 seed("en");
 const caches={
  async keys(){return [...stores.keys()]},
  async open(name:string){
   if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name)!;
   return {async match(path:string){return store.get(key(path))?.clone()},async put(path:string,response:Response){if(mode==="quota"&&name===`${PREFIX}new-en`)throw new DOMException("quota","QuotaExceededError");store.set(key(path),response.clone())}};
  },
  async delete(name:string){if(mode==="cleanup"&&name===`${PREFIX}old-en`)throw new Error("cleanup blocked");return stores.delete(name)}
 };
 const context=vm.createContext({URL,Response,Headers,AbortController,DOMException,setTimeout,clearTimeout,caches,
  self:{location:{origin},addEventListener:(name:string,handler:(event:any)=>void)=>{handlers[name]=handler}},
  fetch:async(input:string|Request)=>{
   if(offline)throw new TypeError("Network unavailable");
   const url=typeof input==="string"?input:input.url;fetched.push(url);
   if(url.includes("offline-manifest.json")){
    if(mode==="paused")await gate;
    if(mode==="manifest")return new Response("unavailable",{status:503});
    return Response.json({version:"new",pages:{en:["/en/lesson"]},assets:mode==="path"?["/api/forbidden"]:["/offline-pages/en.html"]});
   }
   if(mode==="file")return new Response("missing",{status:404});
   if(mode==="timeout")throw new DOMException("timed out","AbortError");
   return new Response(url.endsWith(".html")?offlineFallbackHtml("en"):"downloaded lesson");
  }
 });
 vm.runInContext(readFileSync("public/moneyquest-sw.js","utf8"),context);
 function start(locale="en"){
  const messages:any[]=[];let done:Promise<unknown>=Promise.resolve();
  handlers.message!({data:{type:"download",locale},ports:[{postMessage:(message:any)=>messages.push(message)}],waitUntil:(promise:Promise<unknown>)=>{done=promise}});
  return {messages,done};
 }
 async function navigate(path:string){
  let response:Promise<Response>|undefined;
  handlers.fetch!({request:{method:"GET",url:new URL(path,origin).href,mode:"navigate",headers:new Headers()},respondWith:(promise:Promise<Response>)=>{response=promise}});
  assert(response);return response;
 }
 return {stores,seed,start,navigate,fetched,release,goOffline(){offline=true}};
}
async function main(){
 for(const [mode,expected] of [["manifest","list_unavailable"],["file","file_unavailable"],["path","invalid_path"],["quota","storage_full"],["timeout","timeout"]] as const){
  const h=harness(mode),run=h.start();await run.done;
  const error=run.messages.at(-1);assert.equal(error.type,"error");assert.equal(error.code,expected);
  assert.equal(parseOfflineWorkerMessage(error)?.type,"error");assert.equal(typeof error.message,"string","Retain an English compatibility message for older UIs");
  assert(h.stores.has(`${PREFIX}old-en`),`${mode}: prior complete download is preserved`);assert(!h.stores.has(`${PREFIX}new-en`),`${mode}: partial copy removed`);
  if(mode==="path")assert(!h.fetched.some(url=>url.includes("/api/")),"Never fetch a forbidden API path");
 }
 const language=harness(),unsupported=language.start("ro");await unsupported.done;assert.equal(unsupported.messages.at(-1).code,"language_unavailable");assert(language.stores.has(`${PREFIX}old-en`));
 const busy=harness("paused"),first=busy.start(),second=busy.start();await second.done;assert.equal(second.messages.at(-1).code,"busy");busy.release();await first.done;assert.equal(first.messages.at(-1).type,"ready");
 const cleanup=harness("cleanup"),cleanRun=cleanup.start();await cleanRun.done;assert.equal(cleanRun.messages.at(-1).type,"ready");assert(cleanup.stores.has(`${PREFIX}new-en`));assert(cleanup.stores.has(`${PREFIX}old-en`),"Old-copy cleanup failure must not invalidate the completed replacement");
 const good=harness(),run=good.start();await run.done;assert.equal(run.messages.at(-1).type,"ready");assert(!good.stores.has(`${PREFIX}old-en`));assert(good.stores.has(`${PREFIX}new-en`));
 good.seed("ro");good.goOffline();
 assert.equal(await (await good.navigate("/en/lesson")).text(),"downloaded lesson");
 assert((await (await good.navigate("/en/not-downloaded")).text()).includes('<html lang="en">'));
 assert((await (await good.navigate("/ro/not-downloaded")).text()).includes('<html lang="ro">'),"Use the requested language cache before another language cache");
 const legacy=harness();legacy.seed("en","old",true);legacy.goOffline();assert.equal(await (await legacy.navigate("/en/not-downloaded")).text(),"legacy fallback","An older completed cache without generated HTML still works");
 console.log("PASS: actual worker structured/compatible errors, numeric DOMException quota code, timeout, busy lock, rejected language/API path, failed-partial cleanup, old-copy preservation, safe post-success cleanup, requested-language fallback, cached navigation and legacy fallback. Existing MP4/cache-key tests remain separate.");
}
main().catch(error=>{console.error(error);process.exitCode=1});
