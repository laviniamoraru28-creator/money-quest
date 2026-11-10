"use client";
import {useState} from "react";
import {useLocale} from "next-intl";
import {isSupportedLocale,type Locale} from "@/i18n/config";

const rows:Record<Locale,[string,string,string,string,string,string,string,string]>={
 en:["Save for a bicycle","Put coins and banknotes into the jar.","Saved","Goal","Coin","Banknote","Great! You saved enough for your bicycle!","Start again"],
 ro:["Economisește pentru o bicicletă","Pune monede și bancnote în borcan.","Ai strâns","Obiectiv","Monedă","Bancnotă","Bravo! Ai strâns bani pentru bicicletă!","Începe din nou"],
 es:["Ahorra para una bicicleta","Pon monedas y billetes en el tarro.","Ahorrado","Meta","Moneda","Billete","¡Bien! ¡Ahorraste para la bicicleta!","Empezar de nuevo"],
 fr:["Économise pour un vélo","Mets des pièces et des billets dans le bocal.","Économisé","Objectif","Pièce","Billet","Bravo ! Tu as économisé pour ton vélo !","Recommencer"],
 de:["Spare für ein Fahrrad","Lege Münzen und Geldscheine ins Glas.","Gespart","Ziel","Münze","Geldschein","Super! Du hast für dein Fahrrad gespart!","Neu starten"],
 it:["Risparmia per una bicicletta","Metti monete e banconote nel barattolo.","Risparmiato","Obiettivo","Moneta","Banconota","Bravo! Hai risparmiato per la bici!","Ricomincia"],
 pt:["Poupa para uma bicicleta","Põe moedas e notas no frasco.","Poupado","Objetivo","Moeda","Nota","Boa! Poupaste para a bicicleta!","Recomeçar"],
 nl:["Spaar voor een fiets","Doe munten en bankbiljetten in de pot.","Gespaard","Doel","Munt","Bankbiljet","Goed gedaan! Je hebt voor je fiets gespaard!","Opnieuw"],
 pl:["Oszczędzaj na rower","Włóż monety i banknoty do słoika.","Oszczędzono","Cel","Moneta","Banknot","Brawo! Udało ci się zaoszczędzić na rower!","Od nowa"]
};
const symbols:Record<Locale,string>={en:"£",ro:"lei",es:"€",fr:"€",de:"€",it:"€",pt:"€",nl:"€",pl:"zł"};
function amount(value:number,locale:Locale){return ["ro","pl"].includes(locale)?`${value} ${symbols[locale]}`:`${symbols[locale]}${value}`;}
const TARGET=10;
const MONEY=[{id:"c1",value:1,kind:"coin"},{id:"n1",value:5,kind:"note"},{id:"c2",value:1,kind:"coin"},{id:"c3",value:1,kind:"coin"},{id:"c4",value:1,kind:"coin"},{id:"c5",value:1,kind:"coin"}] as const;
export function ExplorerSavingJar({onComplete}:{onComplete:()=>void}){
 const requested=useLocale(),locale=isSupportedLocale(requested)?requested:"en";
 const [title,instruction,savedLabel,goalLabel,coinLabel,noteLabel,success,restart]=rows[locale];
 const [added,setAdded]=useState<string[]>([]);
 const saved=MONEY.filter(item=>added.includes(item.id)).reduce((sum,item)=>sum+item.value,0);
 const done=saved>=TARGET;
 const speak=(message:string)=>{
   if(typeof window==="undefined"||!("speechSynthesis" in window))return;
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(message);
   utterance.lang=document.documentElement.lang||"en";
   window.speechSynthesis.speak(utterance);
 };
 const add=(id:string)=>{
   if(done||added.includes(id))return;
   const next=[...added,id];
   setAdded(next);
   const total=MONEY.filter(item=>next.includes(item.id)).reduce((sum,item)=>sum+item.value,0);
   speak(total>=TARGET?success:`${savedLabel}: ${amount(total,locale)}`);
   if(total>=TARGET)onComplete();
 };
 return <section data-explorer-saving-jar className="rounded-3xl border-2 border-teal/30 bg-white p-4 sm:p-6">
   <h2 className="text-2xl font-bold">{title}</h2>
   <p className="mt-2 text-lg">{instruction}</p>
   <button type="button" className="mt-3 min-h-12 rounded-xl border-2 border-teal px-4 py-2" onClick={()=>speak(`${title}. ${instruction}`)}>🔊</button>
   <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-cream p-4">
     <div aria-hidden="true" className="text-6xl">🚲</div>
     <p className="text-lg font-bold">{goalLabel}: {amount(TARGET,locale)}</p>
     <div role="img" aria-label={`${savedLabel}: ${amount(saved,locale)}`}
       className="flex h-56 w-48 flex-col justify-end overflow-hidden rounded-b-[3rem] rounded-t-xl border-4 border-teal bg-white/70 p-3">
       <div className="flex min-h-0 flex-wrap content-end justify-center gap-1" style={{height:`${Math.max(4,(saved/TARGET)*100)}%`}}>
         {MONEY.filter(item=>added.includes(item.id)).map(item=><span key={item.id} aria-hidden="true" className="text-3xl">{item.kind==="coin"?"🪙":"💵"}</span>)}
       </div>
     </div>
     <p role="status" aria-live="polite" className="text-xl font-bold">{savedLabel}: {amount(saved,locale)} / {amount(TARGET,locale)}</p>
     <div role="progressbar" aria-valuemin={0} aria-valuemax={TARGET} aria-valuenow={saved} aria-label={savedLabel} className="h-4 w-full overflow-hidden rounded-full bg-white"><div className="h-full bg-teal" style={{width:`${(saved/TARGET)*100}%`}}/></div>
   </div>
   <div className="mt-5 grid grid-cols-3 gap-3">
     {MONEY.filter(item=>!added.includes(item.id)).map(item=><button key={item.id} type="button" disabled={done} onClick={()=>add(item.id)}
       className="flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 border-teal/40 p-2 font-bold">
       <span aria-hidden="true" className="text-4xl">{item.kind==="coin"?"🪙":"💵"}</span>
       <span>{amount(item.value,locale)}</span><span className="text-sm">{item.kind==="coin"?coinLabel:noteLabel}</span>
     </button>)}
   </div>
   {done&&<div className="mt-5 rounded-xl bg-teal/10 p-4"><p role="status" className="text-lg font-bold">{success}</p>
     <button type="button" onClick={()=>setAdded([])} className="mt-3 min-h-12 rounded-xl border-2 border-teal px-4 py-2">{restart}</button>
   </div>}
 </section>;
}
