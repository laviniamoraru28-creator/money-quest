/* Opt-in offline copies of bundled learning content. No APIs, analytics or external sites. */
const PREFIX = "moneyquest-offline-";
const READY = "/__moneyquest_offline_ready__";
let downloading = null;
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
          await cache.put(url.pathname,result);
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
      return await cache?.match(url.pathname==="/"?"/en":url.pathname) || await cache?.match("/offline.html") || new Response("Reconnect to download Money Quest for offline use.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    })());
  } else if(url.pathname.startsWith("/_next/static/")||/\.(webp|png|jpg|jpeg|svg|avif|pdf|woff2?|webmanifest)$/.test(url.pathname)) {
    event.respondWith((async()=>{const cache=await savedCache();return await cache?.match(url.pathname)||fetch(event.request);})());
  }
});
