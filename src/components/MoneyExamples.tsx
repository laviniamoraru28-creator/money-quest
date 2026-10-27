"use client";
import {useState} from "react";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";

const examples = [
  {name:"Coins", image:"coins", group:"Money", detail:"Coins are cash. A £1 coin has a value of one pound."},
  {name:"Banknotes", image:"banknote", group:"Money", detail:"Banknotes are cash. A £5 note has a value of five pounds."},
  {name:"Money in an account", image:"account", group:"Money", detail:"A bank balance records money held in an account. You do not need to hold it as cash."},
  {name:"Payment card", image:"card", group:"A way to pay", detail:"A card is a payment tool. A debit card uses money in an account. A credit card uses borrowed money that must be repaid."},
  {name:"Phone payment", image:"phone", group:"A way to pay", detail:"A phone can send a payment instruction. The phone itself is not money, and tapping it does not create money."},
];

/** Labelled diagrams use exact HTML amounts. They are teaching models, not legal tender. */
export function MoneyDiagram({kind}: {kind:string}) {
  return <div aria-hidden="true" className="flex h-28 items-center justify-center rounded-xl bg-cream p-3">
    {kind === "account" ? <div className="rounded-xl border-2 border-teal bg-white px-5 py-2 text-center shadow-md"><span className="block text-sm">Bank balance</span><span className="text-2xl font-bold text-teal">£12.00</span></div> : <img src={`/images/money-quest/money/${kind}.webp`} alt="" width={384} height={384} loading="lazy" className="h-full w-full object-contain"/>}
  </div>;
}
export function MoneyExamples() {
  const [selected,setSelected]=useState(0);
  const [answer,setAnswer]=useState<string|null>(null);
  const example=examples[selected]!;
  return <section className="my-6 rounded-2xl border border-amber-300 bg-white p-4 sm:p-6" aria-labelledby="money-examples-heading">
    <h2 id="money-examples-heading" className="text-xl">Meet money and ways to pay</h2>
    <p className="mt-2">Choose a picture. Find out what it represents.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{examples.map((item,i)=><button type="button" key={item.image} aria-pressed={selected===i} onClick={()=>{setSelected(i);setAnswer(null)}} className={`rounded-xl border-2 p-2 text-left ${selected===i?"border-teal bg-teal/5":"border-ink/20"}`}><MoneyDiagram kind={item.image}/><span className="mt-2 block text-base font-bold">{item.name}</span></button>)}</div>
    <div className="mt-4 rounded-xl bg-fog p-4" role="status"><p className="font-bold">{example.group}</p><p>{example.detail}</p><ReadAloudButton text={example.detail} uiLocale="en-GB"/></div>
    <fieldset className="mt-5"><legend className="font-bold">Which one is a payment tool?</legend><div className="mt-3 flex flex-wrap gap-3">{["A £1 coin","A payment card"].map(label=><button type="button" key={label} aria-pressed={answer===label} onClick={()=>setAnswer(label)} className="min-h-12 rounded-xl border-2 border-teal px-4 py-2 text-teal">{label}</button>)}</div></fieldset>
    {answer&&<p role="status" className="mt-3">{answer==="A payment card"?"Yes. A card helps you pay using an account or credit. It is not money itself.":"A coin is cash. Look for the tool that sends a payment instruction. You can choose again."}</p>}
    <p className="mt-4 text-sm text-ink/70">Money pictures are illustrations. Real coins and banknotes have more detail. The account balance is a learning example.</p>
  </section>;
}
