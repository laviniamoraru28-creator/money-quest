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
const context=vm.createContext({URL,Response,Headers,AbortController,setTimeout,clearTimeout,caches,
  self:{location:{origin},addEventListener:(name:string,handler:(event:any)=>void)=>{handlers[name]=handler}},
  fetch:async(input:string|Request)=>{
    if(offline)throw new Error("Network unavailable");
    const url=typeof input==="string"?input:input.url;
    if(url.includes("offline-manifest.json"))return Response.json({version:"test",pages:{en:["/en/library/test"]},assets:[chunk,"/offline.html","/media/quiet/test.mp4"]});
    if(url.endsWith(".mp4"))return new Response(Uint8Array.from({length:64},(_,index)=>index),{headers:{"Content-Type":"video/mp4"}});
    return new Response(url.includes(".js")?"window.chunkLoaded = true;":"<main><h1>Offline lesson</h1></main>");
  }
});
vm.runInContext(readFileSync("public/moneyquest-sw.js","utf8"),context);
await vm.runInContext('download("en", () => {})',context);
offline=true;
async function request(path:string,mode:string,range?:string){
 let response:Promise<Response>|undefined;
 handlers.fetch!({request:{method:"GET",url:new URL(path,origin).href,mode,headers:new Headers(range?{Range:range}:{})},respondWith:(promise:Promise<Response>)=>{response=promise}});
 assert.ok(response,"The service worker must handle the request");return response;
}
const encodedChunk=chunk.replaceAll("[","%5B").replaceAll("]","%5D");
assert.equal(await (await request(encodedChunk,"cors")).text(),"window.chunkLoaded = true;");
assert.equal(await (await request(chunk,"cors")).text(),"window.chunkLoaded = true;");
assert.match(await (await request("/en/library/test","navigate")).text(),/Offline lesson/);
const full=await request("/media/quiet/test.mp4","cors");assert.equal(full.status,200);assert.equal((await full.arrayBuffer()).byteLength,64);
for(const [range,start,end] of [["bytes=0-1",0,1],["bytes=10-",10,63],["bytes=-5",59,63],["bytes=60-999",60,63],["bytes=-999",0,63]] as const){
 const result=await request("/media/quiet/test.mp4","cors",range);assert.equal(result.status,206);
 assert.equal(result.headers.get("Content-Range"),`bytes ${start}-${end}/64`);
 assert.equal(result.headers.get("Content-Length"),String(end-start+1));assert.equal(result.headers.get("Content-Type"),"video/mp4");
 assert.deepEqual([...new Uint8Array(await result.arrayBuffer())],Array.from({length:end-start+1},(_,index)=>index+start));
}
for(const range of ["bytes=64-","bytes=3-1","bytes=-0","bytes=-","bytes=0-1,4-5","bytes=9007199254740992-","invalid"]){
 const result=await request("/media/quiet/test.mp4","cors",range);assert.equal(result.status,416);assert.equal(result.headers.get("Content-Range"),"bytes */64");
}
console.log("PASS: offline encoded chunks, learning HTML and MP4 byte-range playback/seek responses, including suffix, open-ended and invalid ranges.");

}
main().catch(error=>{console.error(error);process.exitCode=1});
