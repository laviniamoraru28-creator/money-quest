"use client";

import {useEffect,useRef,useState} from "react";
import type {Locale} from "@/i18n/config";
import type {SiteControlsCopy} from "@/content/site-controls-copy";
import {offlineExceptionCode,offlineStatusText,parseOfflineWorkerMessage,type OfflineStatus} from "@/lib/offline/messages";
const PREFIX="moneyquest-offline-";
export function OfflineDownload({locale,copy}:{locale:Locale;copy:SiteControlsCopy}) {
  const language=locale;
  const [supported,setSupported]=useState(false),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState<OfflineStatus|null>(null);
  const channel=useRef<MessageChannel|null>(null);
  useEffect(()=>{
    setSupported("serviceWorker" in navigator && "caches" in window && window.isSecureContext);
    setChecked(true);
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
    if(busy)return;setBusy(true);setStatus({type:"preparing"});
    try {
      await navigator.serviceWorker.register("/moneyquest-sw.js",{scope:"/",updateViaCache:"none"});
      const registration=await navigator.serviceWorker.ready;
      const worker=registration.active;if(!worker){setBusy(false);setStatus({type:"error",code:"setup_not_ready"});return;}
      const messages=new MessageChannel();channel.current?.port1.close();channel.current=messages;
      messages.port1.onmessage=event=>{
        const result=parseOfflineWorkerMessage(event.data);if(!result)return;
        setStatus(result);
        if(result.type!=="progress"){setBusy(false);messages.port1.close();}
      };
      worker.postMessage({type:"download",locale:language},[messages.port2]);
    }catch(error){setBusy(false);setStatus({type:"error",code:offlineExceptionCode(error)});}
  };
  const remove=async()=>{
    try {
      for(const name of await caches.keys())if(name.startsWith(PREFIX))await caches.delete(name);
      const registration=await navigator.serviceWorker.getRegistration("/");
      if(registration?.active?.scriptURL.endsWith("/moneyquest-sw.js"))await registration.unregister();
      setStatus({type:"removed"});
    }catch{setStatus({type:"removeFailed"});}
  };
  return <details className="max-w-full"><summary className="min-h-12 cursor-pointer py-3 font-semibold text-teal-text">{copy.offlineSummary}</summary><div className="max-w-2xl py-3"><p>{copy.instructions}</p><p className="mt-2 text-sm">{copy.limitations}</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!supported||busy} onClick={download} className="min-h-12 rounded-xl border border-teal/40 bg-white px-4 py-3 font-semibold text-teal-text disabled:opacity-60">{busy?copy.downloading:copy.download}</button><button type="button" disabled={!supported||busy} onClick={remove} className="min-h-12 rounded-xl border border-ink/30 px-4 py-3 disabled:opacity-60">{copy.remove}</button></div><p role="status" className="mt-3 text-sm">{offlineStatusText(language,status,copy)||(checked&&!supported?copy.unsupported:"")}</p></div></details>;
}
