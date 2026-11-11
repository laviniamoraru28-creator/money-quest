"use client";
import { ReadAloudControl } from "@/components/ui/ReadAloudButton";

import {useCallback, useEffect, useState} from "react";
import type {Locale} from "@/i18n/config";
import {learningAmount} from "@/lib/currency/learning-currency";
import {explorerSpeechLang} from "@/lib/explorer/speech-lang";

type Method = "coins" | "banknote" | "card";
type Copy = {title:string;instruction:string;coins:string;banknote:string;card:string;balance:string;price:string;paid:string;insufficient:string;again:string;listen:string;};
const rows:Record<Locale,string>={
 en:"Little shop|Buy an apple for 2. You have 5.|Coins|Banknote|Debit card|Money left|Price|You paid 2. You have 3 left.|Not enough money. Try again.|Play again|Listen",
 ro:"Micul magazin|Cumpără un măr cu 2. Ai 5.|Monede|Bancnotă|Card de debit|Bani rămași|Preț|Ai plătit 2. Ți-au rămas 3.|Nu ai destui bani. Încearcă din nou.|Joacă din nou|Ascultă",
 es:"La tienda|Compra una manzana por 2. Tienes 5.|Monedas|Billete|Tarjeta de débito|Dinero restante|Precio|Pagaste 2. Te quedan 3.|No tienes suficiente dinero. Inténtalo de nuevo.|Jugar otra vez|Escuchar",
 fr:"La boutique|Achète une pomme pour 2. Tu as 5.|Pièces|Billet|Carte de débit|Argent restant|Prix|Tu as payé 2. Il te reste 3.|Pas assez d’argent. Réessaie.|Rejouer|Écouter",
 de:"Der kleine Laden|Kaufe einen Apfel für 2. Du hast 5.|Münzen|Geldschein|Debitkarte|Geld übrig|Preis|Du hast 2 bezahlt. 3 bleiben übrig.|Nicht genug Geld. Versuch es noch einmal.|Noch einmal|Anhören",
 it:"Il negozietto|Compra una mela per 2. Hai 5.|Monete|Banconota|Carta di debito|Denaro rimasto|Prezzo|Hai pagato 2. Ti restano 3.|Non hai abbastanza denaro. Riprova.|Gioca ancora|Ascolta",
 pt:"A lojinha|Compra uma maçã por 2. Tens 5.|Moedas|Nota|Cartão de débito|Dinheiro restante|Preço|Pagaste 2. Restam-te 3.|Não tens dinheiro suficiente. Tenta novamente.|Jogar outra vez|Ouvir",
 nl:"De winkel|Koop een appel voor 2. Je hebt 5.|Munten|Bankbiljet|Betaalpas|Geld over|Prijs|Je betaalde 2. Je hebt 3 over.|Niet genoeg geld. Probeer opnieuw.|Opnieuw spelen|Luisteren",
 pl:"Mały sklep|Kup jabłko za 2. Masz 5.|Monety|Banknot|Karta debetowa|Pozostałe pieniądze|Cena|Zapłacono 2. Zostały 3.|Za mało pieniędzy. Spróbuj ponownie.|Zagraj ponownie|Posłuchaj"
};
const keys=(["title","instruction","coins","banknote","card","balance","price","paid","insufficient","again","listen"] as const);
const copy=Object.fromEntries(Object.entries(rows).map(([locale,row])=>[locale,Object.fromEntries(keys.map((key,i)=>[key,row.split("|")[i]]))])) as Record<Locale,Copy>;
const money=learningAmount;

/** Pretend purchase only. All three methods debit the same five-unit balance. */
export function ExplorerMiniShop({locale,onComplete}: {locale:Locale;onComplete?:()=>void}) {
 const t=copy[locale];
 const [balance,setBalance]=useState(5);
 const [method,setMethod]=useState<Method|null>(null);
 const [feedback,setFeedback]=useState("");
 const speak=useCallback((value:string)=>{
   if(typeof window==="undefined"||!("speechSynthesis" in window))return;
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(value);
   utterance.lang=explorerSpeechLang();
   window.speechSynthesis.speak(utterance);
 },[]);
 useEffect(()=>()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();},[]);
 const pay=(choice:Method)=>{
   if(method!==null)return;
   if(balance<2){setFeedback(t.insufficient);speak(t.insufficient);return;}
   setMethod(choice);
   onComplete?.();
   setBalance(value=>value-2);
   setFeedback(t.paid);
   speak(t.paid);
 };
 return <section data-explorer-mini-shop className="mt-6 rounded-3xl border-2 border-teal/30 bg-white p-4 sm:p-6">
   <h2 className="text-2xl font-bold">{t.title}</h2>
   <p className="mt-2 text-lg">{t.instruction.replace("2",money(2,locale)).replace("5",money(5,locale))}</p>
   <ReadAloudControl label={t.listen} onClick={()=>speak(t.instruction)} className="mt-3" />
   <div className="my-5 flex items-center justify-between rounded-2xl bg-cream p-5">
     <div className="text-center"><span aria-hidden="true" className="block text-6xl">🍎</span><span className="text-lg font-bold">{t.price}: {money(2,locale)}</span></div>
     <div className="text-center"><span aria-hidden="true" className="block text-5xl">💰</span><span className="text-lg font-bold">{t.balance}: {money(balance,locale)}</span></div>
   </div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
     {([{id:"coins",label:t.coins,icon:"🪙"},{id:"banknote",label:t.banknote,icon:"💵"},{id:"card",label:t.card,icon:"💳"}] as const).map(option=>
       <button key={option.id} type="button" disabled={method!==null} onClick={()=>pay(option.id)}
         aria-pressed={method===option.id}
         className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal/40 p-4 font-bold aria-pressed:bg-teal/10 disabled:opacity-70">
         <span aria-hidden="true" className="text-5xl">{option.icon}</span>{option.label}
       </button>)}
   </div>
   <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{feedback}</p>
   {method!==null&&<button type="button" className="min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white" onClick={()=>{setBalance(5);setMethod(null);setFeedback("");}}>{t.again}</button>}
 </section>;
}
