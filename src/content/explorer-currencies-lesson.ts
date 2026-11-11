import type { Locale } from "@/i18n/config";

/**
 * Lesson 4, World Currencies — four real activities per the brief:
 * match currency to country, sort coins vs banknotes, identify a symbol,
 * choose the right currency for a fictional trip. Introduces all six
 * required currencies (GBP, RON, EUR, USD, JPY, CHF) across the four
 * activities rather than cramming all six into one screen.
 *
 * Item labels ("Coins"/"Banknotes") are deliberately distinct text from
 * their destination-bin labels ("Coin box"/"Note box") even though both
 * describe the same two categories — an Explorer PictureSort's items and
 * destinations render as visually different button sizes, but giving them
 * identical accessible names too would make the two indistinguishable to
 * a screen reader or a keyboard user tabbing through the page.
 */
type Fields =
  | "prompt1" | "uk" | "romania" | "europe" | "japan"
  | "pound" | "leu" | "euro" | "yen"
  | "prompt2" | "coinsLabel" | "notesLabel" | "coinsBox" | "notesBox"
  | "prompt3" | "symbolPoundQuestion" | "symbolPoundWrong"
  | "prompt4tripJapan" | "prompt4yen" | "prompt4pound"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "uk", "romania", "europe", "japan",
  "pound", "leu", "euro", "yen",
  "prompt2", "coinsLabel", "notesLabel", "coinsBox", "notesBox",
  "prompt3", "symbolPoundQuestion", "symbolPoundWrong",
  "prompt4tripJapan", "prompt4yen", "prompt4pound",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "Match the money to its country.|United Kingdom|Romania|Europe|Japan|Pound|Leu|Euro|Yen|Put each one where it belongs: coins or banknotes.|Coins|Banknotes|Coin box|Note box|Which symbol means “pound”?|The pound symbol|The euro symbol|You are visiting Japan! Which money will you use there?|Yen|Pound|Listen|Try again|Well done!|Continue",
  ro: "Potrivește banii cu țara lor.|Regatul Unit|România|Europa|Japonia|Liră|Leu|Euro|Yen|Pune fiecare obiect unde se potrivește: monede sau bancnote.|Monede|Bancnote|Cutia de monede|Cutia de bancnote|Ce simbol înseamnă “liră”?|Simbolul lirei|Simbolul euro|Mergi în vizită în Japonia! Ce bani vei folosi acolo?|Yen|Liră|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Relaciona el dinero con su país.|Reino Unido|Rumanía|Europa|Japón|Libra|Leu|Euro|Yen|Pon cada uno donde pertenece: monedas o billetes.|Monedas|Billetes|Caja de monedas|Caja de billetes|¿Qué símbolo significa “libra”?|El símbolo de la libra|El símbolo del euro|¡Vas a visitar Japón! ¿Qué dinero usarás allí?|Yen|Libra|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Associe l’argent à son pays.|Royaume-Uni|Roumanie|Europe|Japon|Livre|Leu|Euro|Yen|Mets chaque objet à sa place : pièces ou billets.|Pièces|Billets|Boîte à pièces|Boîte à billets|Quel symbole signifie « livre » ?|Le symbole de la livre|Le symbole de l’euro|Tu rends visite au Japon ! Quel argent utiliseras-tu là-bas ?|Yen|Livre|Écouter|Réessaie|Bravo !|Continuer",
  de: "Ordne das Geld seinem Land zu.|Vereinigtes Königreich|Rumänien|Europa|Japan|Pfund|Leu|Euro|Yen|Lege jedes Stück dorthin, wohin es gehört: Münzen oder Geldscheine.|Münzen|Geldscheine|Münzbox|Scheinbox|Welches Symbol bedeutet „Pfund“?|Das Pfund-Symbol|Das Euro-Symbol|Du besuchst Japan! Welches Geld benutzt du dort?|Yen|Pfund|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Abbina i soldi al loro paese.|Regno Unito|Romania|Europa|Giappone|Sterlina|Leu|Euro|Yen|Metti ciascuno dove appartiene: monete o banconote.|Monete|Banconote|Scatola delle monete|Scatola delle banconote|Quale simbolo significa “sterlina”?|Il simbolo della sterlina|Il simbolo dell’euro|Stai visitando il Giappone! Quali soldi userai lì?|Yen|Sterlina|Ascolta|Riprova|Bravo!|Continua",
  pt: "Associa o dinheiro ao seu país.|Reino Unido|Roménia|Europa|Japão|Libra|Leu|Euro|Iene|Põe cada um onde pertence: moedas ou notas.|Moedas|Notas|Caixa de moedas|Caixa de notas|Que símbolo significa “libra”?|O símbolo da libra|O símbolo do euro|Vais visitar o Japão! Que dinheiro vais usar lá?|Iene|Libra|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Koppel het geld aan zijn land.|Verenigd Koninkrijk|Roemenië|Europa|Japan|Pond|Leu|Euro|Yen|Leg elk stuk waar het hoort: munten of bankbiljetten.|Munten|Bankbiljetten|Muntendoos|Briefjesdoos|Welk symbool betekent “pond”?|Het pond-symbool|Het euro-symbool|Je bezoekt Japan! Welk geld gebruik je daar?|Yen|Pond|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Dopasuj pieniądze do ich kraju.|Wielka Brytania|Rumunia|Europa|Japonia|Funt|Lej|Euro|Jen|Włóż każdą rzecz tam, gdzie należy: monety lub banknoty.|Monety|Banknoty|Pudełko na monety|Pudełko na banknoty|Który symbol oznacza „funta”?|Symbol funta|Symbol euro|Odwiedzasz Japonię! Jakich pieniędzy tam użyjesz?|Jen|Funt|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const currenciesLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-currencies-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
