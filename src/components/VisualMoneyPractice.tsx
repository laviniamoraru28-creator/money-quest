"use client";
import {useState} from "react";
import {useLocale} from "next-intl";
import {MoneyDiagram} from "@/components/MoneyExamples";
import {ReadAloudButton} from "@/components/ui/ReadAloudButton";
import {REGIONAL_LOCALES,isSupportedLocale,type Locale} from "@/i18n/config";
import {moneyExamplesCopy} from "@/content/money-examples-copy";

type TaskText={heading:string;instruction:string;example:string;leaf:string;stone:string;yes:string;again:string;next:string;previous:string;done:string;step:string};
const rows:Record<Locale,string>={
 en:"Try with pictures|Touch the right picture.|Example: a coin is money.|Leaf|Stone|Yes! You found it.|Try the other picture.|Next activity|Previous activity|You finished. You can play again.|Activity",
 ro:"Exersează cu imagini|Atinge imaginea potrivită.|Exemplu: o monedă înseamnă bani.|Frunză|Piatră|Da! Ai găsit răspunsul.|Încearcă cealaltă imagine.|Activitatea următoare|Activitatea anterioară|Ai terminat. Poți încerca din nou.|Activitatea",
 es:"Practica con imágenes|Toca la imagen correcta.|Ejemplo: una moneda es dinero.|Hoja|Piedra|¡Sí! Lo encontraste.|Prueba la otra imagen.|Actividad siguiente|Actividad anterior|Has terminado. Puedes repetir.|Actividad",
 fr:"Apprends avec des images|Touche la bonne image.|Exemple : une pièce est de l’argent.|Feuille|Pierre|Oui ! Tu as trouvé.|Essaie l’autre image.|Activité suivante|Activité précédente|Tu as terminé. Tu peux recommencer.|Activité",
 de:"Übe mit Bildern|Tippe auf das richtige Bild.|Beispiel: Eine Münze ist Geld.|Blatt|Stein|Ja! Richtig gefunden.|Versuche das andere Bild.|Nächste Aufgabe|Vorherige Aufgabe|Fertig! Du kannst wiederholen.|Aufgabe",
 it:"Impara con le immagini|Tocca l’immagine giusta.|Esempio: una moneta è denaro.|Foglia|Pietra|Sì! Hai trovato la risposta.|Prova l’altra immagine.|Attività successiva|Attività precedente|Hai finito. Puoi riprovare.|Attività",
 pt:"Aprende com imagens|Toca na imagem certa.|Exemplo: uma moeda é dinheiro.|Folha|Pedra|Sim! Encontraste.|Experimenta a outra imagem.|Atividade seguinte|Atividade anterior|Terminaste. Podes repetir.|Atividade",
 nl:"Oefen met plaatjes|Tik op het juiste plaatje.|Voorbeeld: een munt is geld.|Blad|Steen|Ja! Goed gevonden.|Probeer het andere plaatje.|Volgende opdracht|Vorige opdracht|Klaar! Je kunt opnieuw beginnen.|Opdracht",
 pl:"Ćwicz z obrazkami|Dotknij właściwego obrazka.|Przykład: moneta to pieniądze.|Liść|Kamień|Tak! Udało się.|Spróbuj wybrać drugi obrazek.|Następne zadanie|Poprzednie zadanie|Koniec! Możesz spróbować ponownie.|Zadanie"
};
const keys=["heading","instruction","example","leaf","stone","yes","again","next","previous","done","step"] as const;
const labels=Object.fromEntries(Object.entries(rows).map(([locale,row])=>{const values=row.split("|");if(values.length!==keys.length)throw new Error("Visual task translation "+locale);return [locale,Object.fromEntries(keys.map((key,i)=>[key,values[i]]))]})) as Record<Locale,TaskText>;
type Option={kind:"coins"|"banknote"|"card"|"leaf"|"stone";label:string};
export function VisualMoneyPractice(){
 const requested=useLocale(),locale=isSupportedLocale(requested)?requested:"en";
 const t=labels[locale],money=moneyExamplesCopy[locale];
 const tasks:{question:string;choices:[Option,Option];correct:number}[]=[
  {question:money.money,choices:[{kind:"coins",label:money.coins},{kind:"leaf",label:t.leaf}],correct:0},
  {question:money.tool,choices:[{kind:"coins",label:money.coins},{kind:"card",label:money.card}],correct:1},
  {question:money.money,choices:[{kind:"stone",label:t.stone},{kind:"banknote",label:money.notes}],correct:1}
 ];
 const [step,setStep]=useState(0),[answer,setAnswer]=useState<number|null>(null);
 const task=tasks[step]!,success=answer===task.correct;
 const move=(n:number)=>{setStep(n);setAnswer(null)};
 return <section aria-labelledby="visual-practice-title" className="my-8 rounded-2xl border-2 border-teal/30 bg-white p-4 sm:p-6">
  <h2 id="visual-practice-title" className="text-2xl font-bold">{t.heading}</h2>
  <p className="mt-2">{t.example}</p>
  <p className="mt-3 font-semibold">{t.step} {step+1} / {tasks.length}</p>
  <p className="mt-2 text-lg">{t.instruction} {task.question}</p>
  <ReadAloudButton text={t.instruction+" "+task.question} uiLocale={REGIONAL_LOCALES[locale]}/>
  <div className="mt-5 grid grid-cols-2 gap-3">{task.choices.map((choice,i)=><button type="button" key={choice.kind} aria-pressed={answer===i} onClick={()=>setAnswer(i)} className={"min-h-44 rounded-2xl border-2 p-3 text-center focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal "+(answer===i?"border-teal bg-teal/10":"border-ink/20")}>
   {choice.kind==="leaf"||choice.kind==="stone"?<span aria-hidden="true" className="flex h-28 items-center justify-center text-6xl">{choice.kind==="leaf"?"🍃":"🪨"}</span>:<MoneyDiagram kind={choice.kind} locale={locale}/>}
   <span className="mt-2 block text-lg font-bold">{choice.label}</span>
  </button>)}</div>
  <p role="status" aria-live="polite" className="mt-4 min-h-7 font-semibold">{answer===null?"":success?t.yes:t.again}</p>
  <div className="mt-4 flex flex-wrap gap-3">
   {step>0&&<button type="button" onClick={()=>move(step-1)} className="min-h-12 rounded-xl border border-teal px-4 py-2">{t.previous}</button>}
   {success&&(step<tasks.length-1?<button type="button" onClick={()=>move(step+1)} className="min-h-12 rounded-xl bg-teal px-4 py-2 text-white">{t.next}</button>:<button type="button" onClick={()=>move(0)} className="min-h-12 rounded-xl bg-teal px-4 py-2 text-white">{t.done}</button>)}
  </div>
 </section>;
}
