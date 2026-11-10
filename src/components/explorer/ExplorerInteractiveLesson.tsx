"use client";

import {useState} from "react";
import {useLocale} from "next-intl";
import {ExplorerPictureChoice} from "@/components/explorer/ExplorerPictureChoice";
import {ExplorerCoinCount} from "@/components/explorer/ExplorerCoinCount";
import {ExplorerMiniShop} from "@/components/explorer/ExplorerMiniShop";
import {explorerOtherTopics,explorerScenario,type ExplorerOtherTopic} from "@/content/explorer-other-lessons";
import {isSupportedLocale, type Locale} from "@/i18n/config";

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
   {topicId==="money_basics" && (stage===0?
     <ExplorerCoinCount target={3} prompt={t.count} coinLabel={t.coin} addLabel={t.add} removeLabel={t.remove}
       replayLabel={t.listen} checkLabel={t.check} successMessage={t.success} retryMessage={t.retry}
       onComplete={()=>setStage(1)}/>:
     <ExplorerMiniShop locale={locale} onComplete={complete}/>)}
   {topicId==="needs_wants" && <ExplorerPictureChoice prompt={t.needs}
     options={[{id:"food",label:t.food,symbol:"🍎",explanation:""},{id:"toy",label:t.toy,symbol:"🧸",explanation:""}]}
     correctId="food" successMessage={t.success} retryMessage={t.retry}
     replayLabel={t.listen} nextLabel={t.next} onComplete={complete}/>}
   {topicId==="saving" && <ExplorerPictureChoice prompt={t.save}
     options={[{id:"save",label:t.jar,symbol:"🐷",explanation:""},{id:"spend",label:t.spend,symbol:"🛍️",explanation:""}]}
     correctId="save" successMessage={t.success} retryMessage={t.retry}
     replayLabel={t.listen} nextLabel={t.next} onComplete={complete}/>}
   {scenario&&<ExplorerPictureChoice prompt={scenario.prompt}
     options={[{id:"yes",label:scenario.correct,symbol:scenario.correctSymbol,explanation:""},{id:"no",label:scenario.wrong,symbol:scenario.wrongSymbol,explanation:""}]}
     correctId="yes" successMessage={t.success} retryMessage={t.retry}
     replayLabel={t.listen} nextLabel={t.next} onComplete={complete}/>}
   {finished&&<p role="status" className="rounded-xl bg-teal/10 p-4 text-xl font-bold">{t.done}</p>}
 </section>;
}
