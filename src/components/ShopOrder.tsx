"use client";
import {useEffect,useState} from "react";
export function ShopOrder({recovery=false}:{recovery?:boolean}){
 const [token,setToken]=useState(""),[message,setMessage]=useState("Checking your payment…"),[reference,setReference]=useState<{sessionId:string;checkout:string}|null>(null);
 useEffect(()=>{
  if(recovery){const params=new URLSearchParams(location.hash.slice(1));const value=params.get("token");history.replaceState(null,"",location.pathname);if(value){setToken(value);setMessage("Your recovery link will be checked before any file is supplied.");}else setMessage("This page needs the recovery link from your saved order confirmation.");return;}
  const params=new URLSearchParams(location.search);setReference({sessionId:params.get("session_id")??"",checkout:params.get("checkout")??""});history.replaceState(null,"",location.pathname);
 },[recovery]);
 useEffect(()=>{if(!reference)return;let active=true;fetch("/api/shop/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(reference)}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.message);if(active){setToken(data.token);setMessage("Sandbox payment verified. No real money was taken. You can download your files and save the confirmation with its recovery link.");}}).catch(error=>{if(active)setMessage(error instanceof Error?error.message:"Order verification is unavailable. Do not pay again.")});return()=>{active=false};},[reference]);
 return <div><p role="status" className="leading-relaxed">{message}</p>{token&&<div className="mt-6 flex flex-wrap gap-4">
  <form method="post" action="/api/shop/download"><input type="hidden" name="token" value={token}/><button className="min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">Download your PDF archive</button></form>
  <form method="post" action="/api/shop/receipt"><input type="hidden" name="token" value={token}/><button className="min-h-12 rounded-xl border border-teal px-5 py-3 font-bold text-teal-text">Save confirmation and recovery link</button></form>
 </div>}{!token&&reference&&<button type="button" onClick={()=>setReference({...reference})} className="mt-5 min-h-12 rounded-xl border border-teal px-5 py-3 font-semibold text-teal-text">Check again without paying again</button>}</div>
}
