"use client";
import {useState} from "react";
export function ShopCheckout({productId,enabled}:{productId:string;enabled:boolean}){
 const [adult,setAdult]=useState(false),[instant,setInstant]=useState(false),[ack,setAck]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function checkout(){
  if(busy||!adult||!instant||!ack||!enabled)return;setBusy(true);setMessage("Opening the payment page…");
  try{const response=await fetch("/api/shop/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,adultPurchaser:adult,instantSupply:instant,cancellationAcknowledged:ack})});const data=await response.json();if(!response.ok)throw new Error(data.message??"Checkout is unavailable.");const url=new URL(data.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw new Error("Checkout is unavailable.");location.assign(url.href);}catch(error){setMessage(error instanceof Error?error.message:"Checkout is unavailable. Please try later.");setBusy(false);}
 }
 return <div className="mt-5 border-t border-ink/15 pt-4">
  {enabled?<><p className="text-sm font-semibold">Test checkout only. No real money will be taken.</p><fieldset className="mt-3 space-y-3"><legend className="font-semibold">Before opening the download checkout</legend>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={adult} onChange={event=>setAdult(event.target.checked)}/><span>I am an adult purchasing for my household.</span></label>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={instant} onChange={event=>setInstant(event.target.checked)}/><span>I expressly request immediate supply of the digital download.</span></label>
   <label className="flex min-h-12 items-start gap-3 py-2"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={ack} onChange={event=>setAck(event.target.checked)}/><span>I acknowledge that my change-of-mind cancellation right is lost once digital supply begins. My statutory rights for faulty or misdescribed content remain.</span></label>
  </fieldset></>:<p className="text-sm">Paid downloads are not open yet. Try the complete free sample while the editions are reviewed.</p>}
  <button type="button" disabled={!enabled||!adult||!instant||!ack||busy} onClick={checkout} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{busy?"Opening checkout…":enabled?"Continue to test card payment":"Purchases open after review"}</button>
  <p role="status" className="mt-3 text-sm">{message}</p>
 </div>
}
