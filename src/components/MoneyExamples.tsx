"use client";
import Image from "next/image";
import {useState} from "react";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";

import {useLocale} from "next-intl";
import {REGIONAL_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import {moneyExamplesCopy} from "@/content/money-examples-copy";

/** Labelled diagrams use exact HTML amounts. They are teaching models, not legal tender. */
export function MoneyDiagram({kind,locale="en"}: {kind:string;locale?:Locale}) {
  return <div aria-hidden="true" className="flex h-28 items-center justify-center rounded-xl bg-cream p-3">
    {kind === "account" ? <div className="w-full min-w-0 rounded-xl border-2 border-teal bg-white px-2 py-2 text-center shadow-md"><span className="block text-sm">{moneyExamplesCopy[locale].balance}</span><span className="text-base font-bold text-teal-text sm:text-xl">{new Intl.NumberFormat(REGIONAL_LOCALES[locale],{style:"currency",currency:"GBP"}).format(12)}</span></div> : <Image unoptimized src={`/images/money-quest/money/${kind}.webp`} alt="" width={384} height={384} loading="lazy" className="h-full w-full object-contain"/>}
  </div>;
}
export function MoneyExamples() {
  const requested=useLocale(),locale=isSupportedLocale(requested)?requested:"en",copy=moneyExamplesCopy[locale];
  const examples=[
   {name:copy.coins,image:"coins",group:copy.money,detail:copy.coinDetail},
   {name:copy.notes,image:"banknote",group:copy.money,detail:copy.noteDetail},
   {name:copy.account,image:"account",group:copy.money,detail:copy.accountDetail},
   {name:copy.card,image:"card",group:copy.tool,detail:copy.cardDetail},
   {name:copy.phone,image:"phone",group:copy.tool,detail:copy.phoneDetail}
  ];
  const [selected,setSelected]=useState(0);
  const [answer,setAnswer]=useState<number|null>(null);
  const example=examples[selected]!;
  return <section className="my-6 rounded-2xl border border-amber-300 bg-white p-4 sm:p-6" aria-labelledby="money-examples-heading">
    <h2 id="money-examples-heading" className="text-xl">{copy.title}</h2>
    <p className="mt-2">{copy.intro}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{examples.map((item,i)=><button type="button" key={item.image} aria-pressed={selected===i} onClick={()=>{setSelected(i);setAnswer(null)}} className={`rounded-xl border-2 p-2 text-left ${selected===i?"border-teal bg-teal/5":"border-ink/20"}`}><MoneyDiagram kind={item.image} locale={locale}/><span className="mt-2 block text-base font-bold">{item.name}</span></button>)}</div>
    <div className="mt-4 rounded-xl bg-fog p-4" role="status"><p className="font-bold">{example.group}</p><p>{example.detail}</p><ReadAloudButton text={example.detail} uiLocale={REGIONAL_LOCALES[locale]}/></div>
    <fieldset className="mt-5"><legend className="font-bold">{copy.question}</legend><div className="mt-3 flex flex-wrap gap-3">{[copy.coinChoice,copy.cardChoice].map((label,index)=><button type="button" key={label} aria-pressed={answer===index} onClick={()=>setAnswer(index)} className="min-h-12 rounded-xl border-2 border-teal px-4 py-2 text-teal-text">{label}</button>)}</div></fieldset>
    {answer!==null&&<p role="status" className="mt-3">{answer===1?copy.correct:copy.retry}</p>}
    <p className="mt-4 text-sm text-ink/70">{copy.illustration}</p>
  </section>;
}
