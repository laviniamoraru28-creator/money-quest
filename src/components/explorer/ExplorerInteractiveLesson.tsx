"use client";

import {useState} from "react";
import {useLocale} from "next-intl";
import {ExplorerPictureChoice} from "@/components/explorer/ExplorerPictureChoice";
import {ExplorerPictureSort} from "@/components/explorer/ExplorerPictureSort";
import {ExplorerSequence} from "@/components/explorer/ExplorerSequence";
import {ExplorerCoinCount} from "@/components/explorer/ExplorerCoinCount";
import {ExplorerSavingJar} from "@/components/explorer/ExplorerSavingJar";
import {ExplorerMiniShop} from "@/components/explorer/ExplorerMiniShop";
import {explorerOtherTopics,explorerScenario,type ExplorerOtherTopic} from "@/content/explorer-other-lessons";
import {currenciesLessonCopy} from "@/content/explorer-currencies-lesson";
import {safetyLessonCopy} from "@/content/explorer-safety-lesson";
import {longtermLessonCopy} from "@/content/explorer-longterm-lesson";
import {givingLessonCopy} from "@/content/explorer-giving-lesson";
import {digitalMoneyLessonCopy} from "@/content/explorer-digital-money-lesson";
import {investingLessonCopy} from "@/content/explorer-investing-lesson";
import {moneyBasicsLessonCopy} from "@/content/explorer-money-basics-lesson";
import {needsWantsLessonCopy} from "@/content/explorer-needs-wants-lesson";
import {savingExtraLessonCopy} from "@/content/explorer-saving-lesson-extra";
import {isSupportedLocale, type Locale} from "@/i18n/config";
import {explorerSpeechLang} from "@/lib/explorer/speech-lang";

/** Topics with their own dedicated multi-activity flow below, instead of
 * the single generic two-option scenario question every other topic in
 * explorerOtherTopics still falls back to. */
const DEDICATED_OTHER_TOPICS = ["currencies", "scams", "long_term_thinking", "giving", "digital_money", "investing_basics"] as const;

type Copy = {intro:string;listen:string;next:string;success:string;retry:string;coin:string;add:string;remove:string;check:string;count:string;needs:string;food:string;toy:string;save:string;jar:string;spend:string;done:string};
const fields=(["intro","listen","next","success","retry","coin","add","remove","check","count","needs","food","toy","save","jar","spend","done"] as const);
const rows:Record<Locale,string>={
 en:"Let's learn with pictures!|Listen|Continue|Great job!|Try again|Coin|Add|Take away|Check|Put 3 coins in the piggy bank.|Which one do we need first?|Food|Toy|Let's save money.|Piggy bank|Spend now|You finished!",
 ro:"Învățăm cu imagini!|Ascultă|Continuă|Bravo!|Mai încearcă|Monedă|Adaugă|Scoate|Verifică|Pune 3 monede în pușculiță.|De ce avem nevoie mai întâi?|Mâncare|Jucărie|Hai să economisim.|Pușculiță|Cheltuim acum|Ai terminat!",
 es:"¡Aprendemos con imágenes!|Escuchar|Continuar|¡Muy bien!|Inténtalo otra vez|Moneda|Añadir|Quitar|Comprobar|Pon 3 monedas en la hucha.|¿Qué necesitamos primero?|Comida|Juguete|Vamos a ahorrar.|Hucha|Gastar ahora|¡Terminaste!",
 fr:"Apprenons avec des images !|Écouter|Continuer|Bravo !|Réessaie|Pièce|Ajouter|Enlever|Vérifier|Mets 3 pièces dans la tirelire.|De quoi avons-nous besoin d'abord ?|Nourriture|Jouet|Économisons.|Tirelire|Dépenser maintenant|Tu as terminé !",
 de:"Lernen wir mit Bildern!|Anhören|Weiter|Super gemacht!|Versuch es noch einmal|Münze|Hinzufügen|Wegnehmen|Prüfen|Lege 3 Münzen ins Sparschwein.|Was brauchen wir zuerst?|Essen|Spielzeug|Lass uns sparen.|Sparschwein|Jetzt ausgeben|Geschafft!",
 it:"Impariamo con le immagini!|Ascolta|Continua|Bravo!|Riprova|Moneta|Aggiungi|Togli|Controlla|Metti 3 monete nel salvadanaio.|Di cosa abbiamo bisogno prima?|Cibo|Giocattolo|Risparmiamo.|Salvadanaio|Spendere ora|Hai finito!",
 pt:"Vamos aprender com imagens!|Ouvir|Continuar|Muito bem!|Tenta novamente|Moeda|Adicionar|Retirar|Verificar|Põe 3 moedas no mealheiro.|De que precisamos primeiro?|Comida|Brinquedo|Vamos poupar.|Mealheiro|Gastar agora|Terminaste!",
 nl:"Leren met plaatjes!|Luisteren|Verder|Goed gedaan!|Probeer opnieuw|Munt|Toevoegen|Wegnemen|Controleren|Doe 3 munten in de spaarpot.|Wat hebben we eerst nodig?|Eten|Speelgoed|Laten we sparen.|Spaarpot|Nu uitgeven|Klaar!",
 pl:"Uczymy się z obrazkami!|Posłuchaj|Dalej|Brawo!|Spróbuj ponownie|Moneta|Dodaj|Zabierz|Sprawdź|Włóż 3 monety do skarbonki.|Czego potrzebujemy najpierw?|Jedzenie|Zabawka|Oszczędzajmy.|Skarbonka|Wydać teraz|Gotowe!"
};
const copy=Object.fromEntries(Object.entries(rows).map(([locale,row])=>{
 const values=row.split("|");if(values.length!==fields.length)throw new Error(`Explorer copy missing: ${locale}`);
 return [locale,Object.fromEntries(fields.map((field,index)=>[field,values[index]]))];
})) as Record<Locale,Copy>;

export function ExplorerInteractiveLesson({topicId,onComplete}:{
 topicId:string;onComplete:()=>void;
}) {
 const requested=useLocale();
 const locale=isSupportedLocale(requested)?requested:"en";
 const t=copy[locale];
 const [stage,setStage]=useState(0);
 const [finished,setFinished]=useState(false);
 const [discovered,setDiscovered]=useState<string[]>([]);
 const complete=()=>{
   if(finished)return;
   setFinished(true);
   onComplete();
 };
 const otherTopic=explorerOtherTopics.find(topic=>topic===topicId);
 const scenario=otherTopic?explorerScenario(locale,otherTopic as ExplorerOtherTopic):null;
 if(!(["money_basics","needs_wants","saving",...explorerOtherTopics] as string[]).includes(topicId))return null;
 return <section data-explorer-interactive-lesson className="flex flex-col gap-5">
   <h2 className="text-2xl font-bold">{t.intro}</h2>
   {topicId==="money_basics" && (() => {
     const m = moneyBasicsLessonCopy[locale];
     const items = [
       {id:"coin", symbol:"🪙", label:m.coin, desc:m.coinDesc},
       {id:"banknote", symbol:"💵", label:m.banknote, desc:m.banknoteDesc},
       {id:"card", symbol:"💳", label:m.card, desc:m.cardDesc},
     ] as const;
     const speak=(message:string)=>{
       if(typeof window==="undefined"||!("speechSynthesis" in window))return;
       window.speechSynthesis.cancel();
       const utterance=new SpeechSynthesisUtterance(message);
       utterance.lang=explorerSpeechLang();
       window.speechSynthesis.speak(utterance);
     };
     if (stage === 0) return <section key="stage-0" data-explorer-discover className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
       <h3 className="text-xl font-bold">{m.discoverPrompt}</h3>
       <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
         {items.map(item=>
           <button type="button" key={item.id}
             aria-pressed={discovered.includes(item.id)}
             onClick={()=>{setDiscovered(prev=>prev.includes(item.id)?prev:[...prev,item.id]);speak(`${item.label}. ${item.desc}`);}}
             className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-4 border-white bg-gradient-to-b from-white to-cyan-50 p-5 text-center shadow-md aria-pressed:border-violet-500 aria-pressed:bg-violet-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-violet-700">
             <span aria-hidden="true" className="text-6xl">{item.symbol}</span>
             <span className="text-xl font-extrabold text-indigo-950">{item.label}</span>
           </button>)}
       </div>
       <p role="status" aria-live="polite" className="mt-4 min-h-12 text-lg">{discovered.length===items.length?items.find(i=>i.id===discovered[discovered.length-1])?.desc:""}</p>
       {discovered.length===items.length &&
         <button type="button" onClick={()=>setStage(1)} className="mt-3 min-h-12 rounded-full bg-violet-700 px-7 py-3 font-bold text-white shadow-md">{m.continueLabel}</button>}
     </section>;
     if (stage === 1) return <ExplorerCoinCount key="stage-1" target={3} prompt={t.count} coinLabel={t.coin} addLabel={t.add} removeLabel={t.remove}
       replayLabel={t.listen} checkLabel={t.check} successMessage={t.success} retryMessage={t.retry}
       onComplete={()=>setStage(2)}/>;
     if (stage === 2) return <ExplorerMiniShop key="stage-2" locale={locale} onComplete={()=>setStage(3)}/>;
     return <ExplorerPictureChoice
       key="stage-3" prompt={m.cardPrompt}
       options={[
         {id:"bank", label:m.bankAccount, symbol:"🏦", explanation:""},
         {id:"free", label:m.freeMoney, symbol:"✨", explanation:""},
       ]}
       correctId="bank" successMessage={m.success} retryMessage={m.retry}
       replayLabel={m.replay} nextLabel={m.next} onComplete={complete}/>;
   })()}
   {topicId==="needs_wants" && (() => {
     const c = needsWantsLessonCopy[locale];
     if (stage === 0) return <ExplorerPictureSort
       key="stage-0" prompt={c.sortPrompt}
       items={[
         {id:"food", symbol:"🍎", label:c.food, destinationId:"need"},
         {id:"water", symbol:"💧", label:c.water, destinationId:"need"},
         {id:"car", symbol:"🚗", label:c.toyCar, destinationId:"want"},
         {id:"candy", symbol:"🍬", label:c.candy, destinationId:"want"},
       ]}
       destinations={[
         {id:"need", symbol:"✅", label:c.needLabel},
         {id:"want", symbol:"⭐", label:c.wantLabel},
       ]}
       replayLabel={c.replay} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerPictureChoice
       key="stage-1" prompt={c.budgetPrompt}
       options={[
         {id:"ball", label:c.ballChoice, symbol:"⚽", explanation:""},
         {id:"car", label:c.carChoice, symbol:"🚗", explanation:""},
       ]}
       correctId="ball" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(2)}/>;
     return <ExplorerPictureChoice
       key="stage-2" prompt={c.comparePrompt}
       options={[
         {id:"same", label:c.sameWay, symbol:"⬇️", explanation:""},
         {id:"free", label:c.cardFree, symbol:"❓", explanation:""},
       ]}
       correctId="same" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {topicId==="saving" && (() => {
     const c = savingExtraLessonCopy[locale];
     if (stage === 0) return <ExplorerSavingJar key="stage-0" onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerPictureChoice
       key="stage-1" prompt={c.bankPrompt}
       options={[
         {id:"bank", label:c.bankChoice, symbol:"🏦", explanation:""},
         {id:"ground", label:c.groundChoice, symbol:"🍂", explanation:""},
       ]}
       correctId="bank" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(2)}/>;
     return <ExplorerPictureChoice
       key="stage-2" prompt={c.choicePrompt}
       options={[
         {id:"save", label:c.saveChoice, symbol:"🏺", explanation:""},
         {id:"spend", label:c.spendChoice, symbol:"🍬", explanation:""},
       ]}
       correctId="save" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {topicId==="currencies" && (() => {
     const c = currenciesLessonCopy[locale];
     if (stage === 0) return <ExplorerPictureSort
       key="stage-0"
       prompt={c.prompt1}
       items={[
         {id:"pound", symbol:"£", label:c.pound, destinationId:"uk"},
         {id:"leu", symbol:"lei", label:c.leu, destinationId:"romania"},
         {id:"euro", symbol:"€", label:c.euro, destinationId:"europe"},
         {id:"yen", symbol:"¥", label:c.yen, destinationId:"japan"},
       ]}
       destinations={[
         {id:"uk", symbol:"🇬🇧", label:c.uk},
         {id:"romania", symbol:"🇷🇴", label:c.romania},
         {id:"europe", symbol:"🇪🇺", label:c.europe},
         {id:"japan", symbol:"🇯🇵", label:c.japan},
       ]}
       replayLabel={t.listen} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerPictureSort
       key="stage-1"
       prompt={c.prompt2}
       items={[
         {id:"c1", symbol:"🪙", label:c.coinsLabel, destinationId:"coins"},
         {id:"c2", symbol:"🪙", label:c.coinsLabel, destinationId:"coins"},
         {id:"n1", symbol:"💵", label:c.notesLabel, destinationId:"notes"},
         {id:"n2", symbol:"💷", label:c.notesLabel, destinationId:"notes"},
       ]}
       destinations={[
         {id:"coins", symbol:"🪙", label:c.coinsBox},
         {id:"notes", symbol:"💵", label:c.notesBox},
       ]}
       replayLabel={t.listen} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={()=>setStage(2)}/>;
     if (stage === 2) return <ExplorerPictureChoice
       key="stage-2"
       prompt={c.prompt3}
       options={[
         {id:"pound", label:c.symbolPoundQuestion, symbol:"£", explanation:""},
         {id:"euro", label:c.symbolPoundWrong, symbol:"€", explanation:""},
       ]}
       correctId="pound" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(3)}/>;
     return <ExplorerPictureChoice
       key="stage-3"
       prompt={c.prompt4tripJapan}
       options={[
         {id:"yen", label:c.prompt4yen, symbol:"¥", explanation:""},
         {id:"pound", label:c.prompt4pound, symbol:"£", explanation:""},
       ]}
       correctId="yen" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {topicId==="scams" && (() => {
     const c = safetyLessonCopy[locale];
     const rounds = [
       {id:"s0", prompt:c.prompt1, safe:c.safe1, unsafe:c.unsafe1},
       {id:"s1", prompt:c.prompt2, safe:c.safe2, unsafe:c.unsafe2},
       {id:"s2", prompt:c.prompt3, safe:c.safe3, unsafe:c.unsafe3},
       {id:"s3", prompt:c.prompt4, safe:c.safe4, unsafe:c.unsafe4},
     ];
     const round = rounds[stage] ?? rounds[rounds.length-1]!;
     return <ExplorerPictureChoice
       key={`stage-${stage}`}
       prompt={round.prompt}
       options={[
         {id:"safe", label:round.safe, symbol:"🛡️", explanation:""},
         {id:"unsafe", label:round.unsafe, symbol:"⚠️", explanation:""},
       ]}
       correctId="safe" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next}
       onComplete={stage < rounds.length-1 ? () => setStage(stage+1) : complete}/>;
   })()}
   {topicId==="long_term_thinking" && (() => {
     const c = longtermLessonCopy[locale];
     if (stage === 0) return <ExplorerPictureChoice
       key="stage-0" prompt={c.prompt1}
       options={[
         {id:"save", label:c.goalBike, symbol:"🚲", explanation:""},
         {id:"spend", label:c.goalSpendNow, symbol:"🍬", explanation:""},
       ]}
       correctId="save" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerSequence
       key="stage-1" prompt={c.prompt2}
       steps={[
         {id:"w1", symbol:"1️⃣", label:c.week1, order:0},
         {id:"w2", symbol:"2️⃣", label:c.week2, order:1},
         {id:"w3", symbol:"3️⃣", label:c.week3, order:2},
         {id:"w4", symbol:"4️⃣", label:c.week4, order:3},
       ]}
       replayLabel={c.replay} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={()=>setStage(2)}/>;
     if (stage === 2) return <ExplorerPictureChoice
       key="stage-2" prompt={c.prompt3}
       options={[
         {id:"jar", label:c.jarChoice, symbol:"🏺", explanation:""},
         {id:"pocket", label:c.pocketChoice, symbol:"👖", explanation:""},
       ]}
       correctId="jar" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(3)}/>;
     return <ExplorerSequence
       key="stage-3" prompt={c.prompt4}
       steps={[
         {id:"p1", symbol:"🎯", label:c.planGoal, order:0},
         {id:"p2", symbol:"💰", label:c.planSave, order:1},
         {id:"p3", symbol:"📊", label:c.planCheck, order:2},
         {id:"p4", symbol:"🏆", label:c.planReach, order:3},
       ]}
       replayLabel={c.replay} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={complete}/>;
   })()}
   {topicId==="giving" && (() => {
     const c = givingLessonCopy[locale];
     if (stage === 0) return <ExplorerPictureSort
       key="stage-0" prompt={c.prompt1}
       items={[
         {id:"c1", symbol:"🪙", label:c.coinLabel, destinationId:"give"},
         {id:"c2", symbol:"🪙", label:c.coinLabel, destinationId:"keep"},
         {id:"c3", symbol:"🪙", label:c.coinLabel, destinationId:"keep"},
         {id:"c4", symbol:"🪙", label:c.coinLabel, destinationId:"keep"},
         {id:"c5", symbol:"🪙", label:c.coinLabel, destinationId:"keep"},
       ]}
       destinations={[
         {id:"give", symbol:"❤️", label:c.giveBox},
         {id:"keep", symbol:"👛", label:c.keepBox},
       ]}
       replayLabel={c.replay} tryAgainMessage={c.retry} successMessage={c.remainderMessage}
       onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <section key="stage-1" className="rounded-3xl border border-teal/20 bg-white p-4 md:p-6">
       <h3 className="text-xl font-bold">{c.prompt2}</h3>
       <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
         {[{id:"shelter",label:c.cause1,symbol:"🐾"},{id:"foodbank",label:c.cause2,symbol:"🥫"}].map(option=>
           <button type="button" key={option.id} onClick={()=>setStage(2)}
             className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-4 border-white bg-gradient-to-b from-white to-cyan-50 p-5 text-center shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-violet-700">
             <span aria-hidden="true" className="text-6xl">{option.symbol}</span>
             <span className="text-xl font-extrabold text-indigo-950">{option.label}</span>
           </button>)}
       </div>
     </section>;
     return <ExplorerPictureChoice
       key="stage-2" prompt={c.prompt3}
       options={[
         {id:"send", label:c.sendChoice, symbol:"📲", explanation:""},
         {id:"close", label:c.closeChoice, symbol:"❌", explanation:""},
       ]}
       correctId="send" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {topicId==="digital_money" && (() => {
     const c = digitalMoneyLessonCopy[locale];
     if (stage === 0) return <ExplorerMiniShop key="stage-0" locale={locale} onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerPictureChoice
       key="stage-1" prompt={c.prompt1}
       options={[
         {id:"sameWay", label:c.sameWay, symbol:"⬇️", explanation:""},
         {id:"fromNowhere", label:c.fromNowhere, symbol:"❓", explanation:""},
       ]}
       correctId="sameWay" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(2)}/>;
     return <ExplorerPictureChoice
       key="stage-2" prompt={c.prompt2}
       options={[
         {id:"bank", label:c.bankAccount, symbol:"🏦", explanation:""},
         {id:"free", label:c.freeFromCard, symbol:"✨", explanation:""},
       ]}
       correctId="bank" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {topicId==="investing_basics" && (() => {
     const c = investingLessonCopy[locale];
     if (stage === 0) return <ExplorerSequence
       key="stage-0" prompt={c.prompt1}
       steps={[
         {id:"seed", symbol:"🌱", label:c.seed, order:0},
         {id:"sprout", symbol:"🌿", label:c.sprout, order:1},
         {id:"bud", symbol:"🌷", label:c.bud, order:2},
         {id:"flower", symbol:"🌸", label:c.flower, order:3},
       ]}
       replayLabel={c.replay} tryAgainMessage={c.retry} successMessage={c.success}
       onComplete={()=>setStage(1)}/>;
     if (stage === 1) return <ExplorerPictureChoice
       key="stage-1" prompt={c.prompt2}
       options={[
         {id:"investing", label:c.investingChoice, symbol:"📈", explanation:""},
         {id:"saving", label:c.savingChoice, symbol:"🏺", explanation:""},
       ]}
       correctId="investing" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={()=>setStage(2)}/>;
     return <ExplorerPictureChoice
       key="stage-2" prompt={c.prompt3}
       options={[
         {id:"updown", label:c.upOrDown, symbol:"📉", explanation:""},
         {id:"alwaysup", label:c.alwaysUp, symbol:"📈", explanation:""},
       ]}
       correctId="updown" successMessage={c.success} retryMessage={c.retry}
       replayLabel={c.replay} nextLabel={c.next} onComplete={complete}/>;
   })()}
   {scenario && otherTopic && !(DEDICATED_OTHER_TOPICS as readonly string[]).includes(otherTopic) && <ExplorerPictureChoice prompt={scenario.prompt}
     options={[{id:"yes",label:scenario.correct,symbol:scenario.correctSymbol,explanation:""},{id:"no",label:scenario.wrong,symbol:scenario.wrongSymbol,explanation:""}]}
     correctId="yes" successMessage={t.success} retryMessage={t.retry}
     replayLabel={t.listen} nextLabel={t.next} onComplete={complete}/>}
   {finished&&<p role="status" className="rounded-xl bg-teal/10 p-4 text-xl font-bold">{t.done}</p>}
 </section>;
}
