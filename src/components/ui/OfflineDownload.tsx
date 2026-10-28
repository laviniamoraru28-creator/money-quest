"use client";

import {useEffect,useRef,useState} from "react";
const PREFIX="moneyquest-offline-";
export function OfflineDownload({locale}:{locale:string}) {
  const [supported,setSupported]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const channel=useRef<MessageChannel|null>(null);
  useEffect(()=>{
    setSupported("serviceWorker" in navigator && "caches" in window && window.isSecureContext);
    const followOffline=(event:MouseEvent)=>{
      if(navigator.onLine || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
      const link=(event.target as Element)?.closest("a");if(!link||link.target||link.hasAttribute("download"))return;
      const url=new URL(link.href,location.href);
      if(url.origin===location.origin&&url.pathname!==location.pathname){event.preventDefault();event.stopPropagation();location.assign(url.href);}
    };
    document.addEventListener("click",followOffline,true);
    return()=>{document.removeEventListener("click",followOffline,true);channel.current?.port1.close();};
  },[]);
  const download=async()=>{
    if(busy)return;setBusy(true);setMessage("Preparing the offline download. Keep this page open.");
    try {
      await navigator.serviceWorker.register("/moneyquest-sw.js",{scope:"/",updateViaCache:"none"});
      const registration=await navigator.serviceWorker.ready;
      const worker=registration.active;if(!worker)throw new Error("Offline setup is not ready. Try again while connected.");
      const messages=new MessageChannel();channel.current?.port1.close();channel.current=messages;
      messages.port1.onmessage=event=>{
        const result=event.data;
        if(result.type==="progress")setMessage(`Downloading ${result.done} of ${result.total} files and pages. Keep this page open.`);
        if(result.type==="ready"){setMessage(`Offline download complete: ${result.count} files and pages saved on this device. External books, purchases and feedback submission still need internet.`);setBusy(false);messages.port1.close();}
        if(result.type==="error"){setMessage(`Download not completed. ${result.message}`);setBusy(false);messages.port1.close();}
      };
      worker.postMessage({type:"download",locale},[messages.port2]);
    }catch(error){setBusy(false);setMessage(`Download not completed. ${error instanceof Error?error.message:"Check your browser, connection and free storage."}`);}
  };
  const remove=async()=>{
    try {
      for(const name of await caches.keys())if(name.startsWith(PREFIX))await caches.delete(name);
      const registration=await navigator.serviceWorker.getRegistration("/");
      if(registration?.active?.scriptURL.endsWith("/moneyquest-sw.js"))await registration.unregister();
      setMessage("Offline copies removed. Your learning progress and accessibility preferences were kept.");
    }catch{setMessage("Could not remove offline files. Your browser’s site-storage settings can remove them.");}
  };
  return <details className="max-w-full"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">Use without internet</summary><div className="max-w-2xl py-3"><p>With a grown-up, download this language’s learning pages, pictures and worksheets. This uses device storage and can use tens of megabytes of data. Keep the page open until it says complete.</p><p className="mt-2 text-sm">Your browser may remove saved files when storage is low. Voice playback depends on installed voices. External books and websites are not downloaded.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!supported||busy} onClick={download} className="min-h-12 rounded-xl border border-teal/40 bg-white px-4 py-3 font-semibold text-teal-text disabled:opacity-60">{busy?"Downloading…":"Download for offline use"}</button><button type="button" disabled={!supported||busy} onClick={remove} className="min-h-12 rounded-xl border border-ink/30 px-4 py-3 disabled:opacity-60">Remove offline copy</button></div><p role="status" className="mt-3 text-sm">{message}</p></div></details>;
}
