import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

async function main() {
// Exercise the real service-worker download and fetch handlers, not a duplicate
// of the cache-key algorithm. Cache API keys are URL strings, as in browsers.
const handlers: Record<string,(event:any)=>void> = {};
const stores = new Map<string,Map<string,Response>>();
let offline = false;
const origin = "https://moneyquest.test";
const chunk = "/_next/static/chunks/app/[locale]/library/[slug]/page-test.js";
const key = (value: string) => new URL(value,origin).href;
const caches = {
  async keys(){return [...stores.keys()]},
  async open(name:string){
    if(!stores.has(name))stores.set(name,new Map());
    const store=stores.get(name)!;
    return {async put(path:string,response:Response){store.set(key(path),response.clone())},async match(path:string){return store.get(key(path))?.clone()}};
  },
  async delete(name:string){return stores.delete(name)}
};
const context=vm.createContext({URL,Response,AbortController,setTimeout,clearTimeout,caches,
  self:{location:{origin},addEventListener:(name:string,handler:(event:any)=>void)=>{handlers[name]=handler}},
  fetch:async(input:string|Request)=>{
    if(offline)throw new Error("Network unavailable");
    const url=typeof input==="string"?input:input.url;
    if(url.includes("offline-manifest.json"))return Response.json({version:"test",pages:{en:["/en/library/test"]},assets:[chunk,"/offline.html"]});
    return new Response(url.includes(".js")?"window.chunkLoaded = true;":"<main><h1>Offline lesson</h1></main>");
  }
});
vm.runInContext(readFileSync("public/moneyquest-sw.js","utf8"),context);
await vm.runInContext('download("en", () => {})',context);
offline=true;
async function request(path:string,mode:string){
 let response:Promise<Response>|undefined;
 handlers.fetch!({request:{method:"GET",url:new URL(path,origin).href,mode},respondWith:(promise:Promise<Response>)=>{response=promise}});
 assert.ok(response,"The service worker must handle the request");return response;
}
const encodedChunk=chunk.replaceAll("[","%5B").replaceAll("]","%5D");
assert.equal(await (await request(encodedChunk,"cors")).text(),"window.chunkLoaded = true;");
assert.equal(await (await request(chunk,"cors")).text(),"window.chunkLoaded = true;");
assert.match(await (await request("/en/library/test","navigate")).text(),/Offline lesson/);
console.log("PASS: offline download serves bracketed Next.js chunks through browser-encoded URLs and cached learning HTML.");

}
main().catch(error=>{console.error(error);process.exitCode=1});
