"use client";
import {useState} from "react";
import type {ShopFlowCopy} from "@/content/shop-flow-copy";
import {shopErrorKey,validatedCheckoutUrl} from "@/lib/commerce/client-messages";
export function ShopCheckout({productId,enabled,copy,termsRequired=false}:{productId:string;enabled:boolean;copy:ShopFlowCopy;termsRequired?:boolean}){
 const [terms,setTerms]=useState(false);
 const [adult,setAdult]=useState(false),[instant,setInstant]=useState(false),[ack,setAck]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState<keyof ShopFlowCopy|null>(null);
 async function checkout(){
  if(busy||!adult||!instant||!ack||!enabled||(termsRequired&&!terms))return;setBusy(true);setMessage("openingStatus");
  try{const response=await fetch("/api/shop/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,adultPurchaser:adult,instantSupply:instant,cancellationAcknowledged:ack,...(termsRequired?{termsAccepted:terms}:{})})});const data=await response.json();if(!response.ok){setMessage(shopErrorKey(data,"checkoutUnavailable"));setBusy(false);return;}location.assign(validatedCheckoutUrl(data.url));}catch{setMessage("checkoutUnavailable");setBusy(false);}
 }
 return <div className="mt-5 border-t border-ink/15 pt-4">
  {enabled?<><p className="text-sm font-semibold">{copy.testOnly}</p><fieldset className="mt-3 space-y-3"><legend className="font-semibold">{copy.legend}</legend>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={adult} onChange={event=>setAdult(event.target.checked)}/><span>{copy.adult}</span></label>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={instant} onChange={event=>setInstant(event.target.checked)}/><span>{copy.instant}</span></label>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={ack} onChange={event=>setAck(event.target.checked)}/><span>{copy.ack}</span></label>
   {termsRequired&&<label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>I have read and accept the <a className="text-teal-text underline" href="/en/parents/shop/terms" target="_blank" rel="noreferrer">digital download terms (opens a new tab)</a> and understand that the files are in English.</span></label>}
  </fieldset></>:<p className="text-sm">{copy.notOpen}</p>}
  <button type="button" disabled={!enabled||!adult||!instant||!ack||busy||(termsRequired&&!terms)} onClick={checkout} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{busy?copy.openingButton:enabled?copy.continueTest:copy.closedButton}</button>
  <p role="status" className="mt-3 text-sm">{message?copy[message]:""}</p>
 </div>
}
