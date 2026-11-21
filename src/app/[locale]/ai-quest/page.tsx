"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";

type Band = "explorer" | "builder" | "strategist";
type Mission = {title:string; concept:string; scenario:string; choices:[string,string,string]; correct:number; feedback:string; task:string};
const units = [
  {title:"Meet Your New Teammate",concept:"AI predicts patterns from examples. It can help, but it can be wrong.",task:"Choose a helpful job for AI.",choices:["Ask AI to suggest three names for our lemonade stand.","Ask AI to decide who deserves to be your friend.","Tell AI your home address so it knows you."],correct:0,feedback:"AI is useful for brainstorming. People make personal decisions."},
  {title:"Talking Like a Leader",concept:"A good prompt explains the goal, audience and constraints. Check the result.",task:"Choose the clearest instruction.",choices:["Do something.","Suggest three friendly names for a children's bookshop, each under four words.","Make the perfect business and never ask questions."],correct:1,feedback:"Specific goals and limits help. Review the output yourself."},
  {title:"AI & Money",concept:"AI can help compare options, but it cannot guarantee profit or accurate prices.",task:"Choose the safest business decision.",choices:["Trust an AI profit prediction without checking.","Spend all your savings on an AI recommendation.","Compare costs yourself and ask an adult before spending real money."],correct:2,feedback:"Check the numbers and risks. AI suggestions are not financial guarantees."},
  {title:"The Truth Detective",concept:"AI sometimes produces convincing but false claims.",task:"An AI says your product will sell 1,000 units tomorrow. What now?",choices:["Check evidence, ask how it knows, and avoid presenting the claim as fact.","Publish it immediately.","Add more zeros to make it exciting."],correct:0,feedback:"Evidence matters more than a confident answer."},
  {title:"The Golden Rules",concept:"Protect privacy, respect people, verify claims and keep a human responsible.",task:"Choose the responsible way to use AI.",choices:["Upload a classmate's photo without permission.","Use AI to draft an advert, check its claims and ask permission before using anyone's data.","Copy AI output and pretend you created every idea."],correct:1,feedback:"Responsible AI use protects privacy and gives credit."}
] as const;
const ageTasks:Record<Band,readonly string[]> = {
  explorer:["🧠 AI helps us think of ideas. Which choice is kind and safe?","🗣️ Which request gives AI a clear job?","🪙 Which choice keeps our money safe?","🔎 Which choice checks if a story is true?","🛡️ Which choice protects other people?"],
  builder:["Junior mission: pick an appropriate use of AI for a small project.","Junior mission: improve a vague prompt with a goal and a limit.","Junior mission: compare costs before trusting an AI suggestion.","Junior mission: verify a claim before sharing it.","Junior mission: apply privacy, fairness and credit rules."],
  strategist:["Pro mission: decide which decisions to delegate and which require human judgement.","Pro mission: design a testable prompt with audience, format and constraints.","Pro mission: evaluate uncertainty, pricing and profit claims.","Pro mission: challenge unsupported marketing predictions.","Pro mission: apply an ethical review to AI-assisted advertising."]
};
const ui:Record<string,[string,string,string,string,string,string,string,string]> = {
  en:["AI Quest","Five missions about using AI responsibly","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Try another answer","Mission complete","Next mission"],
  ro:["AI Quest","Cinci misiuni despre folosirea responsabilă a AI","Explorer (6–8 ani)","Builder (9–11 ani)","Strategist (12–14 ani)","Încearcă alt răspuns","Misiune finalizată","Misiunea următoare"],
  es:["AI Quest","Cinco misiones para usar la IA de forma responsable","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Prueba otra respuesta","Misión completada","Siguiente misión"],
  fr:["AI Quest","Cinq missions pour utiliser l’IA de manière responsable","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Essaie une autre réponse","Mission terminée","Mission suivante"],
  de:["AI Quest","Fünf Missionen zum verantwortungsvollen Umgang mit KI","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Versuche eine andere Antwort","Mission geschafft","Nächste Mission"],
  it:["AI Quest","Cinque missioni per usare l'IA in modo responsabile","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Riprova","Missione completata","Missione successiva"],
  pt:["AI Quest","Cinco missões para usar a IA com responsabilidade","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Tenta outra resposta","Missão concluída","Próxima missão"],
  nl:["AI Quest","Vijf missies om verantwoord met AI om te gaan","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Probeer een ander antwoord","Missie voltooid","Volgende missie"],
  pl:["AI Quest","Pięć misji o odpowiedzialnym korzystaniu z AI","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Spróbuj ponownie","Misja ukończona","Następna misja"]
};
const key="moneyquest_ai_quest_v1";
export default function AIQuestPage(){
 const locale=useLocale();const labels=ui[locale]??ui.en;
 const [band,setBand]=useState<Band>("explorer");const [index,setIndex]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [completed,setCompleted]=useState<Record<Band,number[]>>({explorer:[],builder:[],strategist:[]});
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const data=JSON.parse(raw);if(data&&typeof data==="object"){setCompleted({explorer:safe(data.explorer),builder:safe(data.builder),strategist:safe(data.strategist)})}}}catch{}},[]);
 const unit=units[index];const correct=selected===unit.correct;
 function finish(){if(!correct)return;const next={...completed,[band]:Array.from(new Set([...completed[band],index]))};setCompleted(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 return <main id="main-content" className="mx-auto max-w-3xl px-sm py-xl text-ink">
  <Link href="/play" className="text-teal-text underline">← Money Quest</Link>
  <h1 className="mt-md font-display text-3xl font-bold">{labels[0]}</h1><p className="mt-2 text-ink/75">{labels[1]}</p>
  <div className="mt-md flex flex-wrap gap-2" role="group" aria-label="Age level">{(["explorer","builder","strategist"] as const).map((b,i)=><button type="button" key={b} aria-pressed={band===b} onClick={()=>{setBand(b);setSelected(null)}} className={`rounded-xl border px-3 py-3 font-bold ${band===b?"bg-teal text-white":"bg-white text-ink"}`}>{labels[i+2]}</button>)}</div>
  <div className="mt-lg grid grid-cols-5 gap-2" aria-label="Mission progress">{units.map((u,i)=><button key={u.title} type="button" onClick={()=>{setIndex(i);setSelected(null)}} aria-current={index===i?"step":undefined} className={`min-h-12 rounded-lg border font-bold ${index===i?"border-teal bg-cream":"bg-white"}`}>{completed[band].includes(i)?"✓":i+1}</button>)}</div>
  <article className="mt-md rounded-2xl border border-teal/20 bg-white p-md">
    <p className="text-sm text-ink/70">{index+1} / {units.length}</p><h2 className="mt-2 font-display text-2xl font-bold">{unit.title}</h2>
    <p className="mt-sm">{unit.concept}</p><p className="mt-md font-bold">{ageTasks[band][index]}</p>
    <p className="mt-sm">{unit.task}</p>
    <div className="mt-md grid gap-3">{unit.choices.map((choice,i)=><button type="button" key={choice} disabled={correct} onClick={()=>setSelected(i)} className={`min-h-14 rounded-xl border-2 p-3 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal ${selected===i?"border-teal bg-cream":"border-ink/20 bg-white"}`}>{choice}</button>)}</div>
    {selected!==null&&<div role="status" aria-live="polite" className="mt-md rounded-xl bg-cream p-4"><p>{correct?unit.feedback:labels[5]}</p>{correct&&<button type="button" onClick={()=>{finish();if(index<units.length-1){setIndex(index+1);setSelected(null)}}} className="mt-3 min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">{index<units.length-1?labels[7]:labels[6]}</button>}</div>}
  </article>
  <p className="mt-md text-sm text-ink/70">This first version uses English lesson content in every language. No AI API, account, personal data submission or real money is required.</p>
 </main>;
}
function safe(value:unknown):number[]{return Array.isArray(value)?value.filter((v):v is number=>Number.isInteger(v)&&v>=0&&v<5):[]}
