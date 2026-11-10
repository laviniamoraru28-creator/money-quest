"use client";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";
import {LESSON_STRUCTURES} from "@/content/curriculum/structures";
import {isSupportedLocale,type Locale} from "@/i18n/config";
type Topic="money_basics"|"needs_wants"|"saving"|"currencies"|"scams"|"long_term_thinking"|"giving"|"digital_money"|"investing_basics";
const lessons:{topic:Topic;icon:string;shade:string;world:string}[]=[
 {topic:"money_basics",icon:"🪙",shade:"from-amber-50 to-rose-50",world:"coin-cove"},
 {topic:"needs_wants",icon:"🍎",shade:"from-sky-50 to-blue-100",world:"market-town"},
 {topic:"saving",icon:"🫙",shade:"from-green-50 to-emerald-100",world:"golden-vault"},
 {topic:"currencies",icon:"💷",shade:"from-violet-50 to-indigo-100",world:"sky-exchange"},
 {topic:"scams",icon:"🛡️",shade:"from-yellow-50 to-orange-100",world:"guardian-gate"},
 {topic:"long_term_thinking",icon:"🎯",shade:"from-pink-50 to-rose-100",world:"horizon-peaks"},
 {topic:"giving",icon:"💝",shade:"from-teal-50 to-green-100",world:"kindness-grove"},
 {topic:"digital_money",icon:"💳",shade:"from-cyan-50 to-blue-100",world:"sky-exchange"},
 {topic:"investing_basics",icon:"🌱",shade:"from-purple-50 to-fuchsia-100",world:"sky-exchange"}
];
const copy:Record<Locale,{heading:string;subtitle:string;progress:string;start:string;again:string;complete:string;names:string[];descs:string[]}>={
 en:{heading:"Explorer (ages 6–8)",subtitle:"Learn about money through pictures and play.",progress:"Your progress",start:"Start lesson",again:"Play again",complete:"completed",names:["What is money?","Needs and wants","Saving","Currencies","Money safety","Planning","Generosity","Digital money","Investing"],descs:["Count coins and shop","Choose what we need","Fill a jar for a bicycle","Meet pounds and euros","Keep your PIN safe","Save for a goal","Give a coin to help","Learn about card payments","Learn about risk"]},
 ro:{heading:"Nivel Explorer (6–8 ani)",subtitle:"Descoperă lumea banilor prin imagini și jocuri.",progress:"Progresul tău",start:"Începe lecția",again:"Reia lecția",complete:"finalizate",names:["Ce sunt banii?","Nevoi și dorințe","Economisirea","Monede și valute","Siguranța banilor","Planificarea","Generozitatea","Banii digitali","Investițiile"],descs:["Numără monede și cumpără","Alege ce ai nevoie","Umple borcanul pentru bicicletă","Descoperă lirele și euro","Protejează codul PIN","Strânge bani pentru un scop","Dăruiește o monedă","Descoperă plata cu cardul","Învață despre risc"]},
 es:{heading:"Explorer (6–8 años)",subtitle:"Aprende sobre dinero con imágenes y juegos.",progress:"Tu progreso",start:"Empezar",again:"Repetir",complete:"completadas",names:["¿Qué es el dinero?","Necesidades y deseos","Ahorrar","Monedas y divisas","Seguridad","Planificación","Generosidad","Dinero digital","Inversiones"],descs:["Cuenta y compra","Elige lo necesario","Llena el tarro para una bici","Conoce libras y euros","Protege tu PIN","Ahorra para una meta","Dona una moneda","Paga con tarjeta","Conoce los riesgos"]},
 fr:{heading:"Explorer (6–8 ans)",subtitle:"Découvre l'argent avec des images et des jeux.",progress:"Ta progression",start:"Commencer",again:"Rejouer",complete:"terminées",names:["L'argent","Besoins et envies","Épargne","Monnaies","Sécurité","Planification","Générosité","Argent numérique","Investissement"],descs:["Compte et achète","Choisis l'essentiel","Remplis le bocal pour un vélo","Livres et euros","Protège ton code PIN","Épargne pour un projet","Donne une pièce","Paie par carte","Comprends les risques"]},
 de:{heading:"Explorer (6–8 Jahre)",subtitle:"Entdecke Geld mit Bildern und Spielen.",progress:"Dein Fortschritt",start:"Lektion starten",again:"Noch einmal",complete:"abgeschlossen",names:["Was ist Geld?","Bedürfnisse und Wünsche","Sparen","Währungen","Sicherheit","Planung","Großzügigkeit","Digitales Geld","Investieren"],descs:["Zählen und einkaufen","Wichtiges auswählen","Sparglas fürs Fahrrad","Pfund und Euro","PIN schützen","Für ein Ziel sparen","Eine Münze spenden","Mit Karte bezahlen","Risiken verstehen"]},
 it:{heading:"Explorer (6–8 anni)",subtitle:"Scopri il denaro con immagini e giochi.",progress:"I tuoi progressi",start:"Inizia",again:"Rigioca",complete:"completate",names:["Che cos'è il denaro?","Bisogni e desideri","Risparmio","Valute","Sicurezza","Pianificazione","Generosità","Denaro digitale","Investimenti"],descs:["Conta e compra","Scegli ciò che serve","Riempi il barattolo per la bici","Sterline ed euro","Proteggi il PIN","Risparmia per un obiettivo","Dona una moneta","Paga con carta","Comprendi i rischi"]},
 pt:{heading:"Explorer (6–8 anos)",subtitle:"Descobre o dinheiro com imagens e jogos.",progress:"O teu progresso",start:"Começar",again:"Repetir",complete:"concluídas",names:["O que é dinheiro?","Necessidades e desejos","Poupar","Moedas","Segurança","Planear","Generosidade","Dinheiro digital","Investir"],descs:["Conta e compra","Escolhe o essencial","Enche o frasco para uma bicicleta","Libras e euros","Protege o PIN","Poupa para um objetivo","Dá uma moeda","Paga com cartão","Entende os riscos"]},
 nl:{heading:"Explorer (6–8 jaar)",subtitle:"Ontdek geld met plaatjes en spelletjes.",progress:"Je voortgang",start:"Start les",again:"Opnieuw",complete:"afgerond",names:["Wat is geld?","Nodig of leuk?","Sparen","Valuta","Veiligheid","Plannen","Vrijgevigheid","Digitaal geld","Beleggen"],descs:["Tel en koop","Kies wat nodig is","Vul de pot voor een fiets","Ponden en euro's","Bescherm je pincode","Spaar voor een doel","Geef een munt","Betaal met een pas","Leer over risico"]},
 pl:{heading:"Explorer (6–8 lat)",subtitle:"Poznaj pieniądze przez obrazki i zabawę.",progress:"Twoje postępy",start:"Rozpocznij",again:"Zagraj ponownie",complete:"ukończonych",names:["Czym są pieniądze?","Potrzeby i zachcianki","Oszczędzanie","Waluty","Bezpieczeństwo","Planowanie","Hojność","Pieniądze cyfrowe","Inwestowanie"],descs:["Licz i kupuj","Wybierz potrzebne rzeczy","Napełnij słoik na rower","Funty i euro","Chroń PIN","Oszczędzaj na cel","Podaruj monetę","Płać kartą","Poznaj ryzyko"]}
};
export function ExplorerLessonDashboard({completedActivityIds}:{completedActivityIds:string[]}){
 const requested=useLocale(),locale=isSupportedLocale(requested)?requested:"en",t=copy[locale];
 const finished=lessons.filter(item=>completedActivityIds.includes(`explorer-${item.topic}-l1`)).length;
 return <section aria-label={t.heading} className="mt-6 overflow-hidden rounded-[2rem] border-2 border-sky-200 bg-white p-4 shadow-xl sm:p-7">
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 via-cyan-50 to-emerald-100 p-5 sm:p-7">
   <div className="flex flex-wrap items-center justify-between gap-5">
    <div><h2 className="font-display text-3xl font-extrabold text-indigo-950">{t.heading}</h2><p className="mt-2 text-lg text-indigo-900">{t.subtitle}</p></div>
    <div className="min-w-48 rounded-2xl bg-white/90 p-4 shadow-sm"><p className="font-bold text-indigo-950">{t.progress}</p><p className="mt-1 text-sm">{finished} / {lessons.length} {t.complete}</p><div role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={finished} className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{width:`${finished/lessons.length*100}%`}}/></div></div>
   </div>
  </div>
  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   {lessons.map((item,index)=>{
    const structure=LESSON_STRUCTURES.find(lesson=>lesson.ageBand==="explorer"&&lesson.topicId===item.topic);
    if(!structure)return null;
    const done=completedActivityIds.includes(structure.id);
    return <article key={item.topic} className={`relative flex min-h-64 flex-col overflow-hidden rounded-3xl border-2 border-indigo-100 bg-gradient-to-br p-5 shadow-sm ${item.shade}`}>
     <div className="flex items-start justify-between gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-indigo-800 shadow-sm">{index+1}</span><span aria-hidden="true" className="text-6xl">{item.icon}</span></div>
     <h3 className="mt-3 font-display text-xl font-extrabold text-indigo-950">{t.names[index]}</h3>
     <p className="mt-1 flex-1 text-base text-indigo-900">{t.descs[index]}</p>
     <div className="mt-4 flex items-center gap-3">
      <Link href={`/play/world/${item.world}/lesson/${structure.id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-violet-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-violet-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-800">{done?t.again:t.start}</Link>
      {done&&<span aria-label={t.complete} className="text-2xl">⭐</span>}
     </div>
    </article>;
   })}
  </div>
 </section>;
}
