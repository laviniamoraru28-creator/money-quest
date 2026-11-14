"use client";
import {useState} from "react";
import {ExplorerPicture} from "./ExplorerPicture";
import {useLocale} from "next-intl";
import {isSupportedLocale,type Locale} from "@/i18n/config";
import {learningAmount} from "@/lib/currency/learning-currency";
import {useTapOrDrag} from "@/lib/explorer/use-tap-or-drag";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import {explorerSpeechLang} from "@/lib/explorer/speech-lang";

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
function amount(value:number, locale:Locale): string {
 if(locale!=="ro" || Number.isInteger(value)) return learningAmount(value,locale);
 const lei=Math.floor(value);
 const bani=`${Math.round((value-lei)*100)} bani`;
 return lei===0 ? bani : `${learningAmount(lei,locale)} și ${bani}`;
}
type MoneyItem={id:string;value:number;kind:"coin"|"note"};
// Use real circulating denominations. Poland has no 5-zloty banknote.
const denominations:Record<Locale,{coin:number;note:number}>={
 en:{coin:1,note:5},ro:{coin:1,note:5},es:{coin:1,note:5},fr:{coin:1,note:5},
 de:{coin:1,note:5},it:{coin:1,note:5},pt:{coin:1,note:5},nl:{coin:1,note:5},
 pl:{coin:2,note:10}
};
function moneyItems(locale:Locale):MoneyItem[]{
 const {coin,note}=denominations[locale];
 const values = locale === "ro" ? [note, 1, 1, 1, 1, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1] : [note, ...Array<number>(5).fill(coin)];
 return values.map((value,index)=>({
   id:`money-${index}`,
   value,
   kind:index===0 || (locale==="ro" && value===1) ? "note" : "coin",
 }));
}
export function ExplorerSavingJar({onComplete,nextLabel}:{onComplete:()=>void;nextLabel:string}){
 const requested=useLocale(),locale=isSupportedLocale(requested)?requested:"en";
 const [title,instruction,savedLabel,goalLabel,coinLabel,noteLabel,success,restart]=rows[locale];
 const [added,setAdded]=useState<string[]>([]);
 const {dragSource,dropTarget}=useTapOrDrag<string>();
 const MONEY=moneyItems(locale);
 const TARGET=MONEY.reduce((sum,item)=>sum+Math.round(item.value*100),0)/100;
 const saved=MONEY.filter(item=>added.includes(item.id)).reduce((sum,item)=>sum+Math.round(item.value*100),0)/100;
 const remaining=(Math.round(TARGET*100)-Math.round(saved*100))/100;
 const done=remaining===0;
 const remainingLabel=locale==="ro"?(remaining===1?"rămas":"rămași"):locale==="en"?"to go":"";
 const add=(id:string)=>{
   if(done||added.includes(id))return;
   const next=[...added,id];
   setAdded(next);
 };
 return <section data-explorer-saving-jar className="overflow-hidden rounded-[2rem] border-2 border-soft-blue/50 bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50 shadow-xl">
   <div className="relative bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200 px-5 py-5 text-center">
     <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">🚲 {title}</h2>
     <p className="mt-2 text-base font-medium text-ink">{instruction}</p>
     <ReadAloudButton text={done ? success : `${title}. ${instruction}`} uiLocale={explorerSpeechLang()} />
   </div>
   <div className="grid items-center gap-5 p-4 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(230px,1fr)]">
     <div className="flex flex-col items-center rounded-3xl bg-white/75 p-4">
       <div className="relative flex h-64 w-full max-w-52 flex-col items-center justify-end sm:h-80 sm:w-64">
         <div data-savings-jar-lid className="absolute top-3 z-10 h-3 w-[84%] rounded-md border-2 border-teal bg-teal shadow-sm" aria-hidden="true"/>
         <div role="img" aria-label={`${savedLabel}: ${amount(saved,locale)}`}
           {...dropTarget(add)}
           className="relative flex h-[88%] w-[84%] flex-col justify-end overflow-hidden rounded-b-xl rounded-t-lg border-[6px] border-sky-400 bg-gradient-to-br from-white/95 via-sky-50/60 to-cyan-200/60 p-3 shadow-inner">
           <div className="absolute inset-x-2 bottom-2 rounded-b-lg bg-amber-200/35 transition-[height] duration-300 motion-reduce:transition-none" style={{height:`${(saved/TARGET)*80}%`}}/>
           <div className="relative z-10 flex flex-wrap content-end justify-center gap-1" style={{minHeight:`${Math.max(12,(saved/TARGET)*78)}%`}}>
             {MONEY.filter(item=>added.includes(item.id)).map(item=><span key={item.id} aria-hidden="true" className="text-3xl drop-shadow-sm sm:text-4xl"><ExplorerPicture symbol={item.kind==="coin"?"🪙":"💵"} size={24}/></span>)}
           </div>
         </div>
         <div className="absolute right-0 top-12 rotate-6 rounded-xl border-2 border-amber-400 bg-yellow-100 px-3 py-2 text-3xl shadow-sm" aria-hidden="true">🚲</div>
       </div>
       <p className="mt-4 text-center text-sm font-medium text-ink">{instruction}</p>
     </div>
     <div className="flex flex-col gap-4 rounded-3xl border-2 border-soft-blue/40 bg-white/90 p-5 text-center shadow-sm">
       <div className="rounded-2xl bg-teal/10 px-3 py-3 text-lg font-bold text-teal-text">🎯 {goalLabel}: {amount(TARGET,locale)}</div>
       <div aria-hidden="true" className="text-6xl">🚲</div>
       <p role="status" aria-live="polite" className="text-2xl font-extrabold text-ink">{savedLabel}: {amount(saved,locale)} / {amount(TARGET,locale)}</p>
       <div role="progressbar" aria-valuemin={0} aria-valuemax={TARGET} aria-valuenow={saved} aria-label={savedLabel} className="h-5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-[width] duration-300 motion-reduce:transition-none" style={{width:`${(saved/TARGET)*100}%`}}/></div>
       <p className="text-base font-semibold text-ink">{done?success:`${amount(remaining,locale)} ${remainingLabel}`}</p>
     </div>
   </div>
   <div className="border-t-2 border-amber-200 bg-gradient-to-b from-amber-100 to-orange-200 p-4 sm:p-6">
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
       {MONEY.map(item=><button key={item.id} type="button" disabled={done||added.includes(item.id)} onClick={()=>add(item.id)}
         {...dragSource(item.id)}
         aria-label={`${item.kind==="coin"?coinLabel:noteLabel} ${amount(item.value,locale)}`}
         className="flex min-h-28 cursor-grab flex-col items-center justify-center rounded-2xl border-2 border-soft-blue/40 bg-white/95 p-2 font-bold text-ink shadow-md transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal active:cursor-grabbing disabled:cursor-default disabled:opacity-35 motion-reduce:transform-none">
         <span aria-hidden="true" className="text-4xl"><ExplorerPicture symbol={item.kind==="coin"?"🪙":"💵"}/></span>
         <span className="break-words text-base">{amount(item.value,locale)}</span><span className="text-xs">{item.kind==="coin"?coinLabel:noteLabel}</span>
       </button>)}
     </div>
     {done&&<div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-white p-5 text-center"><p role="status" className="text-xl font-bold text-emerald-800">⭐ {success}</p>
       <button type="button" onClick={onComplete} className="mt-3 min-h-12 w-full rounded-full bg-teal px-4 py-3 text-base font-bold text-white">{nextLabel}</button>
       <button type="button" onClick={()=>setAdded([])} className="mt-3 min-h-12 rounded-full bg-teal px-6 py-3 font-bold text-white">{restart}</button>
     </div>}
   </div>
 </section>;
}
