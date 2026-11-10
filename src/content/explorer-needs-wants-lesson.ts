import type { Locale } from "@/i18n/config";

/**
 * Lesson 2, Needs vs Wants — fills the gap beyond the existing single
 * food-vs-toy ExplorerPictureChoice: a real multi-object sort, a
 * limited-budget choice, and a cash-vs-card comparison.
 */
type Fields =
  | "sortPrompt" | "needLabel" | "wantLabel"
  | "food" | "water" | "toyCar" | "candy"
  | "budgetPrompt" | "ballChoice" | "carChoice"
  | "comparePrompt" | "sameWay" | "cardFree"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "sortPrompt", "needLabel", "wantLabel",
  "food", "water", "toyCar", "candy",
  "budgetPrompt", "ballChoice", "carChoice",
  "comparePrompt", "sameWay", "cardFree",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "Sort these into Need or Want.|Need|Want|Food|Water|Toy car|Candy|You have 5. A ball costs 5. A toy car costs 10. What can you buy?|The ball|The toy car|Your friend pays with a card instead of coins. Does their money go down the same way?|Yes, the same way|No, the card is free|Listen|Try again|Well done!|Continue",
  ro: "Sortează acestea în Nevoie sau Dorință.|Nevoie|Dorință|Mâncare|Apă|Mașinuță de jucărie|Bomboane|Ai 5. O minge costă 5. O mașinuță costă 10. Ce poți cumpăra?|Mingea|Mașinuța|Prietenul tău plătește cu cardul în loc de monede. Îi scad banii la fel?|Da, la fel|Nu, cardul e gratis|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Clasifica esto en Necesidad o Deseo.|Necesidad|Deseo|Comida|Agua|Coche de juguete|Caramelos|Tienes 5. Una pelota cuesta 5. Un coche de juguete cuesta 10. ¿Qué puedes comprar?|La pelota|El coche de juguete|Tu amigo paga con tarjeta en lugar de monedas. ¿Su dinero baja igual?|Sí, igual|No, la tarjeta es gratis|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Classe ceci en Besoin ou Envie.|Besoin|Envie|Nourriture|Eau|Voiture jouet|Bonbons|Tu as 5. Un ballon coûte 5. Une voiture jouet coûte 10. Que peux-tu acheter ?|Le ballon|La voiture jouet|Ton ami paie par carte au lieu de pièces. Son argent diminue-t-il pareil ?|Oui, pareil|Non, la carte est gratuite|Écouter|Réessaie|Bravo !|Continuer",
  de: "Ordne dies in Brauchen oder Wollen ein.|Brauchen|Wollen|Essen|Wasser|Spielzeugauto|Süßigkeiten|Du hast 5. Ein Ball kostet 5. Ein Spielzeugauto kostet 10. Was kannst du kaufen?|Den Ball|Das Spielzeugauto|Dein Freund zahlt mit Karte statt Münzen. Sinkt sein Geld genauso?|Ja, genauso|Nein, die Karte ist kostenlos|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Dividi questi in Bisogno o Desiderio.|Bisogno|Desiderio|Cibo|Acqua|Macchinina|Caramelle|Hai 5. Una palla costa 5. Una macchinina costa 10. Cosa puoi comprare?|La palla|La macchinina|Il tuo amico paga con la carta invece delle monete. I suoi soldi diminuiscono allo stesso modo?|Sì, allo stesso modo|No, la carta è gratis|Ascolta|Riprova|Bravo!|Continua",
  pt: "Organiza isto em Necessidade ou Desejo.|Necessidade|Desejo|Comida|Água|Carrinho de brinquedo|Doces|Tens 5. Uma bola custa 5. Um carrinho custa 10. O que podes comprar?|A bola|O carrinho|O teu amigo paga com cartão em vez de moedas. O dinheiro dele desce da mesma forma?|Sim, da mesma forma|Não, o cartão é grátis|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Verdeel dit in Nodig of Willen.|Nodig|Willen|Eten|Water|Speelgoedauto|Snoep|Je hebt 5. Een bal kost 5. Een speelgoedauto kost 10. Wat kun je kopen?|De bal|De speelgoedauto|Je vriend betaalt met een pas in plaats van munten. Gaat zijn geld op dezelfde manier omlaag?|Ja, op dezelfde manier|Nee, de pas is gratis|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Podziel to na Potrzebę lub Zachciankę.|Potrzeba|Zachcianka|Jedzenie|Woda|Samochodzik|Cukierki|Masz 5. Piłka kosztuje 5. Samochodzik kosztuje 10. Co możesz kupić?|Piłkę|Samochodzik|Twój przyjaciel płaci kartą zamiast monetami. Czy jego pieniądze maleją tak samo?|Tak, tak samo|Nie, karta jest darmowa|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const needsWantsLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-needs-wants-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
