"use client";
import {useEffect,useState} from "react";
import type {ShopFlowCopy} from "@/content/shop-flow-copy";
import {shopErrorKey} from "@/lib/commerce/client-messages";
export function ShopOrder({recovery=false,copy}:{recovery?:boolean;copy:ShopFlowCopy}){
 const [token,setToken]=useState(""),[message,setMessage]=useState<keyof ShopFlowCopy>(recovery?"recoveryPending":"checking"),[reference,setReference]=useState<{sessionId:string;checkout:string}|null>(null);
 useEffect(()=>{
  if(recovery){const params=new URLSearchParams(location.hash.slice(1));const value=params.get("token");history.replaceState(null,"",location.pathname);if(value){setToken(value);setMessage("recoveryPending");}else setMessage("recoveryMissing");return;}
  const params=new URLSearchParams(location.search);setReference({sessionId:params.get("session_id")??"",checkout:params.get("checkout")??""});history.replaceState(null,"",location.pathname);
 },[recovery]);
 useEffect(()=>{if(!reference)return;let active=true;setMessage("checking");fetch("/api/shop/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(reference)}).then(async response=>{const data=await response.json();if(!active)return;if(!response.ok){setMessage(shopErrorKey(data,"orderUnavailable"));return;}if(typeof data.token!=="string"||!data.token)throw new Error("Invalid order response");setToken(data.token);setMessage("verified");}).catch(()=>{if(active)setMessage("orderUnavailable")});return()=>{active=false};},[reference]);
 return <div><p role="status" className="leading-relaxed">{copy[message]}</p>{token&&<p className="mt-3 text-sm">{copy.englishFiles}</p>}{token&&<div className="mt-6 flex flex-wrap gap-4">
  <form method="post" action="/api/shop/download"><input type="hidden" name="token" value={token}/><button className="min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">{copy.download}</button></form>
  <form method="post" action="/api/shop/receipt"><input type="hidden" name="token" value={token}/><button className="min-h-12 rounded-xl border border-teal px-5 py-3 font-bold text-teal-text">{copy.receipt}</button></form>
 </div>}{!token&&reference&&<button type="button" onClick={()=>setReference({...reference})} className="mt-5 min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text">{copy.recheck}</button>}</div>
}
