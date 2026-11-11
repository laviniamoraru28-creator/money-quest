import type { Locale } from "@/i18n/config";

/**
 * Lesson 6, Long-Term Thinking — four activities: choose a savings goal,
 * save over several fictional weeks (ExplorerSequence), choose where
 * saved money lives, and arrange a simple financial plan's steps
 * (ExplorerSequence again, with different content).
 */
type Fields =
  | "prompt1" | "goalBike" | "goalSpendNow"
  | "prompt2" | "week1" | "week2" | "week3" | "week4"
  | "prompt3" | "jarChoice" | "pocketChoice"
  | "prompt4" | "planGoal" | "planSave" | "planCheck" | "planReach"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "goalBike", "goalSpendNow",
  "prompt2", "week1", "week2", "week3", "week4",
  "prompt3", "jarChoice", "pocketChoice",
  "prompt4", "planGoal", "planSave", "planCheck", "planReach",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "You want a bike later. What helps you get it?|Save a little money each week|Spend all your money today|Put the weeks in order: save a little each week.|Week 1|Week 2|Week 3|Week 4|Where should money you are saving for later live?|A savings jar or account|Loose in your pocket|Put the plan in the right order.|Pick a goal|Save a little each week|Check how close you are|Reach your goal!|Listen|Try again|Well done!|Continue",
  ro: "Vrei o bicicletă mai târziu. Ce te ajută să o obții?|Economisești puțini bani în fiecare săptămână|Cheltuiești toți banii azi|Pune săptămânile în ordine: economisești puțin în fiecare săptămână.|Săptămâna 1|Săptămâna 2|Săptămâna 3|Săptămâna 4|Unde ar trebui să stea banii pe care îi economisești?|Într-un borcan sau cont de economii|Liberi în buzunar|Pune planul în ordinea corectă.|Alege un obiectiv|Economisește puțin în fiecare săptămână|Verifică cât de aproape ești|Atinge-ți obiectivul!|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Quieres una bici más adelante. ¿Qué te ayuda a conseguirla?|Ahorrar un poco de dinero cada semana|Gastar todo tu dinero hoy|Pon las semanas en orden: ahorra un poco cada semana.|Semana 1|Semana 2|Semana 3|Semana 4|¿Dónde debería estar el dinero que ahorras para más tarde?|Un tarro o cuenta de ahorros|Suelto en tu bolsillo|Pon el plan en el orden correcto.|Elige una meta|Ahorra un poco cada semana|Comprueba cuánto te falta|¡Alcanza tu meta!|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Tu veux un vélo plus tard. Qu’est-ce qui t’aide à l’obtenir ?|Économiser un peu d’argent chaque semaine|Dépenser tout ton argent aujourd’hui|Mets les semaines dans l’ordre : économise un peu chaque semaine.|Semaine 1|Semaine 2|Semaine 3|Semaine 4|Où devrait vivre l’argent que tu économises pour plus tard ?|Une tirelire ou un compte d’épargne|En vrac dans ta poche|Mets le plan dans le bon ordre.|Choisis un objectif|Économise un peu chaque semaine|Vérifie où tu en es|Atteins ton objectif !|Écouter|Réessaie|Bravo !|Continuer",
  de: "Du möchtest später ein Fahrrad. Was hilft dir dabei?|Jede Woche ein bisschen Geld sparen|Heute dein ganzes Geld ausgeben|Bring die Wochen in die richtige Reihenfolge: jede Woche ein bisschen sparen.|Woche 1|Woche 2|Woche 3|Woche 4|Wo sollte Geld sein, das du für später sparst?|Ein Sparglas oder Sparkonto|Lose in deiner Tasche|Bring den Plan in die richtige Reihenfolge.|Ein Ziel wählen|Jede Woche ein bisschen sparen|Prüfen, wie nah du dran bist|Dein Ziel erreichen!|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Vuoi una bici più avanti. Cosa ti aiuta a ottenerla?|Risparmiare un po’ di soldi ogni settimana|Spendere tutti i tuoi soldi oggi|Metti le settimane in ordine: risparmia un po’ ogni settimana.|Settimana 1|Settimana 2|Settimana 3|Settimana 4|Dove dovrebbero stare i soldi che risparmi per dopo?|Un barattolo o conto di risparmio|Sciolti in tasca|Metti il piano nell’ordine giusto.|Scegli un obiettivo|Risparmia un po’ ogni settimana|Controlla quanto manca|Raggiungi il tuo obiettivo!|Ascolta|Riprova|Bravo!|Continua",
  pt: "Queres uma bicicleta mais tarde. O que te ajuda a consegui-la?|Poupar um pouco de dinheiro todas as semanas|Gastar todo o teu dinheiro hoje|Põe as semanas em ordem: poupa um pouco todas as semanas.|Semana 1|Semana 2|Semana 3|Semana 4|Onde deve ficar o dinheiro que poupas para mais tarde?|Um frasco ou conta poupança|Solto no teu bolso|Põe o plano na ordem certa.|Escolhe um objetivo|Poupa um pouco todas as semanas|Verifica quão perto estás|Alcança o teu objetivo!|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Je wilt later een fiets. Wat helpt je om die te krijgen?|Elke week een beetje geld sparen|Vandaag al je geld uitgeven|Zet de weken in de juiste volgorde: elke week een beetje sparen.|Week 1|Week 2|Week 3|Week 4|Waar moet geld dat je spaart voor later blijven?|Een spaarpot of spaarrekening|Los in je zak|Zet het plan in de juiste volgorde.|Kies een doel|Spaar elke week een beetje|Controleer hoe dichtbij je bent|Bereik je doel!|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Chcesz później rower. Co ci w tym pomoże?|Oszczędzanie trochę pieniędzy co tydzień|Wydanie wszystkich pieniędzy dzisiaj|Ułóż tygodnie w kolejności: oszczędzaj trochę co tydzień.|Tydzień 1|Tydzień 2|Tydzień 3|Tydzień 4|Gdzie powinny być pieniądze, które oszczędzasz na później?|Słoik lub konto oszczędnościowe|Luzem w kieszeni|Ułóż plan we właściwej kolejności.|Wybierz cel|Oszczędzaj trochę co tydzień|Sprawdź, jak blisko jesteś|Osiągnij swój cel!|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const longtermLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-longterm-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
