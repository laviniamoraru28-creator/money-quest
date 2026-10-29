/* Opt-in offline copies of bundled learning content. No APIs, analytics or external sites. */
const PREFIX = "moneyquest-offline-";
const READY = "/__moneyquest_offline_ready__";
let downloading = null;
// Next.js chunk folders contain [locale]/[slug]. Browsers request these
// as %5Blocale%5D, while build manifests list literal brackets.
function cacheKey(pathname) {
  try { return pathname.split("/").map(part => encodeURIComponent(decodeURIComponent(part))).join("/"); }
  catch { return pathname; }
}
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

async function savedCache() {
  const names = (await caches.keys()).filter(name => name.startsWith(PREFIX)).reverse();
  for (const name of names) {
    const cache = await caches.open(name);
    if (await cache.match(READY)) return cache;
  }
  return null;
}
// Browsers request small byte ranges when playing/seeking local MP4 files.
// Offline cache stores the complete file, then serves the requested slice.
async function mediaRange(response, range) {
  if (!range) return response;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid = () => new Response(null,{status:416,headers:{"Content-Range":`bytes */${size}`,"Accept-Ranges":"bytes"}});
  if (!match || !size || !match[1] && !match[2]) return invalid();
  let start, end;
  if (!match[1]) {
    const suffix=Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix<=0) return invalid();
    start=Math.max(0,size-suffix);end=size-1;
  } else {
    start=Number(match[1]);end=match[2]?Number(match[2]):size-1;
    if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start) return invalid();
    end=Math.min(end,size-1);
  }
  const headers=new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.set("Content-Range",`bytes ${start}-${end}/${size}`);
  headers.set("Content-Length",String(end-start+1));
  headers.set("Accept-Ranges","bytes");
  return new Response(bytes.slice(start,end+1),{status:206,headers});
}
async function download(locale, send) {
  const response = await fetch("/offline-manifest.json", {cache:"no-store",credentials:"omit"});
  if (!response.ok) throw new Error("The offline download list is unavailable. Reconnect and try again.");
  const manifest = await response.json();
  const pages = manifest.pages[locale];
  if (!Array.isArray(pages) || !pages.length) throw new Error("This language does not have a prepared offline copy yet.");
  const name = `${PREFIX}${manifest.version}-${locale}`;
  const cache = await caches.open(name);
  const urls = [...new Set([...pages,...manifest.assets])];
  if (await cache.match(READY)) { send({type:"ready",count:urls.length}); return; }
  let cursor = 0, done = 0, failed = false;
  try {
    const worker = async () => {
      while (cursor < urls.length && !failed) {
        const item = urls[cursor++];
        const url = new URL(item,self.location.origin);
        if (url.origin!==self.location.origin || url.pathname.startsWith("/api/") || !item.startsWith("/")) throw new Error("Invalid offline download path.");
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(),30000);
        try {
          const result = await fetch(url.href,{cache:"reload",credentials:"omit",signal:controller.signal});
          if (!result.ok || result.redirected && new URL(result.url).origin!==self.location.origin) throw new Error(`Could not save ${item}.`);
          await cache.put(cacheKey(url.pathname),result);
          send({type:"progress",done:++done,total:urls.length});
        } catch(error) { failed=true; throw error; }
        finally {clearTimeout(timer);}
      }
    };
    const outcomes = await Promise.allSettled(Array.from({length:3},worker));
    const rejection = outcomes.find(result=>result.status==="rejected");
    if (rejection) throw rejection.reason;
    await cache.put(READY,new Response(JSON.stringify({version:manifest.version,locale,count:urls.length})));
    send({type:"ready",count:urls.length});
    // Only remove older copies of this language after the replacement is complete.
    for(const old of await caches.keys())if(old.startsWith(PREFIX)&&old.endsWith(`-${locale}`)&&old!==name)await caches.delete(old);
  } catch(error) {await caches.delete(name);throw error;}
}
self.addEventListener("message", event => {
  if(event.data?.type!=="download" || !event.ports[0])return;
  const port=event.ports[0],send=data=>port.postMessage(data);
  if(downloading){send({type:"error",message:"A download is already running in another window. Let it finish first."});return;}
  downloading=download(event.data.locale,send).catch(error=>send({type:"error",message:error.message||"Download failed. Your previous completed copy is kept. Check your connection and free storage."})).finally(()=>{downloading=null;});
  event.waitUntil(downloading);
});
self.addEventListener("fetch", event => {
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
  if(event.request.mode==="navigate") {
    event.respondWith((async()=>{
      try {const response=await fetch(event.request);if(response.status<500)return response;}catch{}
      const cache=await savedCache();
      return await cache?.match(cacheKey(url.pathname==="/"?"/en":url.pathname)) || await cache?.match("/offline.html") || new Response("Reconnect to download Money Quest for offline use.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    })());
  } else if(url.pathname.startsWith("/_next/static/")||/\.(webp|png|jpg|jpeg|svg|avif|pdf|mp4|woff2?|webmanifest)$/.test(url.pathname)) {
    event.respondWith((async()=>{
      const cache=await savedCache();
      const saved=await cache?.match(cacheKey(url.pathname));
      if(!saved)return fetch(event.request);
      return url.pathname.endsWith(".mp4")?mediaRange(saved,event.request.headers.get("Range")):saved;
    })());
  }
});
