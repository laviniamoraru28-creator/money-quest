"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";

type Band = "explorer" | "builder" | "strategist";
const units = [
  {title:"Meet Your New Teammate",concept:"AI predicts patterns from examples. It can help, but it can be wrong.",task:"Choose a helpful job for AI.",choices:["Ask AI to suggest three names for our lemonade stand.","Ask AI to decide who deserves to be your friend.","Tell AI your home address so it knows you."],correct:0,feedback:"AI is useful for brainstorming. People make personal decisions."},
  {title:"Talking Like a Leader",concept:"A good prompt explains the goal, audience and constraints. Check the result.",task:"Choose the clearest instruction.",choices:["Do something.","Suggest three friendly names for a children's bookshop, each under four words.","Make the perfect business and never ask questions."],correct:1,feedback:"Specific goals and limits help. Review the output yourself."},
  {title:"AI & Money",concept:"AI can help compare options, but it cannot guarantee profit or accurate prices.",task:"Choose the safest business decision.",choices:["Trust an AI profit prediction without checking.","Spend all your savings on an AI recommendation.","Compare costs yourself and ask an adult before spending real money."],correct:2,feedback:"Check the numbers and risks. AI suggestions are not financial guarantees."},
  {title:"The Truth Detective",concept:"AI sometimes produces convincing but false claims.",task:"An AI says your product will sell 1,000 units tomorrow. What now?",choices:["Check evidence, ask how it knows, and avoid presenting the claim as fact.","Publish it immediately.","Add more zeros to make it exciting."],correct:0,feedback:"Evidence matters more than a confident answer."},
  {title:"The Golden Rules",concept:"Protect privacy, respect people, verify claims and keep a human responsible.",task:"Choose the responsible way to use AI.",choices:["Upload a classmate's photo without permission.","Use AI to draft an advert, check its claims and ask permission before using anyone's data.","Copy AI output and pretend you created every idea."],correct:1,feedback:"Responsible AI use protects privacy and gives credit."}
] as const;
const romanian = [
 {title:"Noul tău coleg",concept:"AI învață tipare din exemple. Te poate ajuta, dar poate greși.",task:"Alege o activitate potrivită pentru AI.",choices:["Cere trei nume pentru un stand de limonadă.","Lasă AI să decidă cine îți este prieten.","Spune-i AI adresa ta de acasă."],feedback:"AI poate propune idei. Oamenii iau deciziile personale."},
 {title:"Vorbește clar",concept:"Spune ce dorești, pentru cine și cu ce limite. Verifică răspunsul.",task:"Alege instrucțiunea cea mai clară.",choices:["Fă ceva.","Propune trei nume prietenoase pentru o librărie pentru copii, fiecare cu maximum patru cuvinte.","Construiește afacerea perfectă fără întrebări."],feedback:"Un scop clar și limitele ajută. Tu verifici rezultatul."},
 {title:"AI și banii",concept:"AI poate compara opțiuni, dar nu garantează profit sau prețuri corecte.",task:"Alege decizia financiară sigură.",choices:["Crede o predicție de profit fără verificare.","Cheltuiește toate economiile la recomandarea AI.","Compară costurile și cere ajutorul unui adult înainte de a cheltui bani reali."],feedback:"Verifică cifrele și riscurile."},
 {title:"Detectivul adevărului",concept:"AI poate prezenta informații false într-un mod convingător.",task:"AI spune că vei vinde 1.000 de produse mâine. Ce faci?",choices:["Caută dovezi și nu prezenta afirmația ca fapt sigur.","Publică imediat.","Mărește cifra ca să impresionezi."],feedback:"Dovezile sunt mai importante decât un răspuns sigur pe sine."},
 {title:"Regulile de aur",concept:"Protejează datele, respectă oamenii și verifică afirmațiile.",task:"Alege utilizarea responsabilă a AI.",choices:["Încarcă fotografia unui coleg fără permisiune.","Folosește AI pentru o reclamă, verifică afirmațiile și cere acordul pentru orice date personale.","Copiază răspunsul AI și spune că toate ideile sunt ale tale."],feedback:"Protejează datele și recunoaște contribuțiile."}
] as const;
const explorerIcons=[["💡","👫","🏠"],["❓","📚","✨"],["🎲","💸","🧮"],["🔎","📢","🔢"],["📸","🛡️","📝"]] as const;
const ageTasks:Record<Band,readonly string[]> = {
  explorer:["🧠 AI helps us think of ideas. Which choice is kind and safe?","🗣️ Which request gives AI a clear job?","🪙 Which choice keeps our money safe?","🔎 Which choice checks if a story is true?","🛡️ Which choice protects other people?"],
  builder:["Junior mission: pick an appropriate use of AI for a small project.","Junior mission: improve a vague prompt with a goal and a limit.","Junior mission: compare costs before trusting an AI suggestion.","Junior mission: verify a claim before sharing it.","Junior mission: apply privacy, fairness and credit rules."],
  strategist:["Pro mission: decide which decisions to delegate and which require human judgement.","Pro mission: design a testable prompt with audience, format and constraints.","Pro mission: evaluate uncertainty, pricing and profit claims.","Pro mission: challenge unsupported marketing predictions.","Pro mission: apply an ethical review to AI-assisted advertising."]
};
const advanced:Record<"builder"|"strategist",readonly {task:string;choices:readonly [string,string,string];correct:number;feedback:string}[]> = {
 builder:[
 {task:"Your team wants to design a school garden poster. What should AI do?",choices:["Suggest a few slogans for you to review.","Decide which classmate is the smartest.","Ask for everyone's phone numbers."],correct:0,feedback:"Use AI to brainstorm, not to judge classmates or collect private data."},
 {task:"You want ideas for a low-cost school fair stall. Which prompt works best?",choices:["Make it amazing.","Tell me everything.","Suggest three stall ideas under £10, with materials and safety checks."],correct:2,feedback:"A clear goal and budget make suggestions easier to evaluate."},
 {task:"An AI suggests selling 20 items at £3 each. Supplies cost £25. What is the profit before other costs?",choices:["£60","£35","£85"],correct:1,feedback:"Revenue is £60. Subtract £25 in supplies to get £35 before other costs."},
 {task:"AI says a new game is suitable for every child. What should you do?",choices:["Check age guidance and other reliable sources.","Trust it because AI sounds confident.","Repeat the claim without checking."],correct:0,feedback:"Check independent evidence and age guidance."},
 {task:"You want an AI poster featuring your friend. What is the first step?",choices:["Upload their photo without asking.","Ask permission and avoid sharing personal details.","Publish their name and address."],correct:1,feedback:"Consent and privacy come before publishing."}
 ],
 strategist:[
 {task:"A founder wants AI to reject job applicants automatically. Which safeguard is essential?",choices:["Let AI decide secretly.","Remove human review.","Use human oversight and check for unfair outcomes."],correct:2,feedback:"High-impact decisions need accountability and bias checks."},
 {task:"Write a prompt to assess a business idea. Which is most testable?",choices:["Compare two reusable bottle ideas for ages 12–14 using cost, risks, assumptions and evidence gaps.","Tell me the best idea ever.","Guarantee a successful launch."],correct:0,feedback:"A good evaluation makes assumptions and uncertainty visible."},
 {task:"Your AI forecast says 200 sales at £5, variable cost £3 each, fixed cost £250. What is estimated profit?",choices:["£750","£150","£400"],correct:1,feedback:"Contribution is 200 × (£5−£3) = £400. After £250 fixed costs, profit is £150, if assumptions hold."},
 {task:"An AI invents a customer quote praising your product. What is ethical?",choices:["Publish it as a real review.","Change the name and publish it.","Do not present invented testimony as real evidence."],correct:2,feedback:"Fabricated testimonials mislead customers. Collect genuine feedback."},
 {task:"A teammate enters customer email addresses into a public AI tool. What should the team do?",choices:["Stop, minimize exposure, follow the privacy process and use anonymized examples.","Add phone numbers for accuracy.","Keep using the tool because it is convenient."],correct:0,feedback:"Minimize personal data and assess tools before using them."}
 ]
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
 const unit=units[index];const translated=locale==="ro"?romanian[index]:unit;const activity=band==="explorer"?unit:advanced[band][index];const correct=selected===activity.correct;
 function speak(){if(typeof window==="undefined"||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const words=[translated.title,translated.concept,band==="explorer"?translated.task:activity.task,...(band==="explorer"?translated.choices:activity.choices)].join(". ");const utterance=new SpeechSynthesisUtterance(words);utterance.lang=locale==="ro"?"ro-RO":"en-GB";utterance.rate=0.85;window.speechSynthesis.speak(utterance)}
 function finish(){if(!correct)return;const next={...completed,[band]:Array.from(new Set([...completed[band],index]))};setCompleted(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 return <main id="main-content" className="mx-auto max-w-3xl px-sm py-xl text-ink">
  <Link href="/play" className="text-teal-text underline">← Money Quest</Link>
  <h1 className="mt-md font-display text-3xl font-bold">{labels[0]}</h1><p className="mt-2 text-ink/75">{labels[1]}</p>
  <div className="mt-md flex flex-wrap gap-2" role="group" aria-label="Age level">{(["explorer","builder","strategist"] as const).map((b,i)=><button type="button" key={b} aria-pressed={band===b} onClick={()=>{setBand(b);setSelected(null)}} className={`rounded-xl border px-3 py-3 font-bold ${band===b?"bg-teal text-white":"bg-white text-ink"}`}>{labels[i+2]}</button>)}</div>
  <div className="mt-lg grid grid-cols-5 gap-2" aria-label="Mission progress">{units.map((u,i)=><button key={u.title} type="button" onClick={()=>{setIndex(i);setSelected(null)}} aria-current={index===i?"step":undefined} className={`min-h-12 rounded-lg border font-bold ${index===i?"border-teal bg-cream":"bg-white"}`}>{completed[band].includes(i)?"✓":i+1}</button>)}</div>
  <article className="mt-md rounded-2xl border border-teal/20 bg-white p-md">
    <p className="text-sm text-ink/70">{index+1} / {units.length}</p><h2 className="mt-2 font-display text-2xl font-bold">{translated.title}</h2>
    <p className="mt-sm">{translated.concept}</p><p className="mt-md font-bold">{ageTasks[band][index]}</p>
    <p className="mt-sm">{band==="explorer"?translated.task:activity.task}</p>
    <button type="button" onClick={speak} className="mt-3 min-h-12 rounded-xl border border-teal px-4 py-2 font-bold text-teal-text">🔊 {locale==="ro"?"Ascultă":"Listen"}</button>
    <div className="mt-md grid gap-3">{(band==="explorer"?translated.choices:activity.choices).map((choice,i)=><button type="button" key={choice} disabled={correct} onClick={()=>setSelected(i)} className={`min-h-14 rounded-xl border-2 p-3 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal ${selected===i?"border-teal bg-cream":"border-ink/20 bg-white"}`}>{band==="explorer"&&<span aria-hidden="true" className="mr-3 text-2xl">{explorerIcons[index][i]}</span>}{choice}</button>)}</div>
    {selected!==null&&<div role="status" aria-live="polite" className="mt-md rounded-xl bg-cream p-4"><p>{correct?(band==="explorer"?translated.feedback:activity.feedback):labels[5]}</p>{correct&&<button type="button" onClick={()=>{finish();if(index<units.length-1){setIndex(index+1);setSelected(null)}}} className="mt-3 min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">{index<units.length-1?labels[7]:labels[6]}</button>}</div>}
  </article>
  {completed[band].length===units.length&&<p role="status" className="mt-md rounded-xl bg-cream p-4 font-bold">✓ {labels[6]}: 5 / 5</p>}
  <p className="mt-md text-sm text-ink/70">Some activities are available only in English. No AI API, account, personal data submission or real money is required.</p>
 </main>;
}
function safe(value:unknown):number[]{return Array.isArray(value)?value.filter((v):v is number=>Number.isInteger(v)&&v>=0&&v<5):[]}
