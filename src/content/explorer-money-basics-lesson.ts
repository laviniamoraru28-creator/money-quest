import type { Locale } from "@/i18n/config";

/**
 * Lesson 1, Money Basics — fills the two gaps beyond the existing
 * ExplorerCoinCount (recognize/compare values) and ExplorerMiniShop (buy
 * with coins/banknote/card) stages: a tap-to-discover intro to coins,
 * banknotes and cards, and a closing check that a card payment comes
 * from a bank account.
 */
type Fields =
  | "discoverPrompt" | "coin" | "coinDesc" | "banknote" | "banknoteDesc" | "card" | "cardDesc" | "continueLabel"
  | "cardPrompt" | "bankAccount" | "freeMoney"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "discoverPrompt", "coin", "coinDesc", "banknote", "banknoteDesc", "card", "cardDesc", "continueLabel",
  "cardPrompt", "bankAccount", "freeMoney",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "Tap each one to learn what it is.|Coin|A coin is a form of money, usually round and made of metal.|Banknote|A banknote is money printed on special paper or a durable material.|Debit card|A debit card lets you pay using money from your bank account.|Continue|When you pay with a card, where does the money come from?|Your bank account|Magic, free money|Listen|Try again|Well done!|Continue",
  ro: "Atinge fiecare obiect ca să afli ce este.|Monedă|O monedă este o formă de bani, de obicei rotundă și făcută din metal.|Bancnotă|O bancnotă este o formă de bani tipărită pe hârtie specială sau pe un material rezistent.|Card de debit|Cu un card de debit poți plăti folosind banii din contul bancar.|Continuă|Când plătești cu cardul, de unde vin banii?|Din contul tău bancar|Bani magici, gratis|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Toca cada uno para saber qué es.|Moneda|Una moneda es una forma de dinero, normalmente redonda y hecha de metal.|Billete|Un billete es dinero impreso en papel especial o en un material resistente.|Tarjeta de débito|Con una tarjeta de débito puedes pagar usando el dinero de tu cuenta bancaria.|Continuar|Cuando pagas con tarjeta, ¿de dónde viene el dinero?|De tu cuenta bancaria|Dinero mágico y gratis|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Touche chacun pour savoir ce que c’est.|Pièce|Une pièce est une forme d’argent, généralement ronde et faite de métal.|Billet|Un billet est de l’argent imprimé sur du papier spécial ou un matériau résistant.|Carte de débit|Avec une carte de débit, tu peux payer en utilisant l’argent de ton compte bancaire.|Continuer|Quand tu paies par carte, d’où vient l’argent ?|De ton compte bancaire|De l’argent magique et gratuit|Écouter|Réessaie|Bravo !|Continuer",
  de: "Tippe auf jedes, um zu lernen, was es ist.|Münze|Eine Münze ist eine Form von Geld, meist rund und aus Metall.|Geldschein|Ein Geldschein ist Geld, das auf Spezialpapier oder einem haltbaren Material gedruckt ist.|Debitkarte|Mit einer Debitkarte kannst du mit dem Geld von deinem Bankkonto bezahlen.|Weiter|Wenn du mit Karte bezahlst, woher kommt das Geld?|Von deinem Bankkonto|Magisches Gratisgeld|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Tocca ciascuno per scoprire cos’è.|Moneta|Una moneta è una forma di denaro, di solito rotonda e fatta di metallo.|Banconota|Una banconota è denaro stampato su carta speciale o su un materiale resistente.|Carta di debito|Con una carta di debito puoi pagare usando il denaro del tuo conto bancario.|Continua|Quando paghi con la carta, da dove vengono i soldi?|Dal tuo conto bancario|Soldi magici e gratis|Ascolta|Riprova|Bravo!|Continua",
  pt: "Toca em cada um para aprender o que é.|Moeda|Uma moeda é uma forma de dinheiro, normalmente redonda e feita de metal.|Nota|Uma nota é dinheiro impresso em papel especial ou num material resistente.|Cartão de débito|Com um cartão de débito podes pagar usando o dinheiro da tua conta bancária.|Continuar|Quando pagas com cartão, de onde vem o dinheiro?|Da tua conta bancária|Dinheiro mágico e grátis|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Tik op elk om te leren wat het is.|Munt|Een munt is een vorm van geld, meestal rond en gemaakt van metaal.|Bankbiljet|Een bankbiljet is geld dat op speciaal papier of stevig materiaal is gedrukt.|Betaalpas|Met een betaalpas kun je betalen met het geld van je bankrekening.|Verder|Als je met een pas betaalt, waar komt het geld dan vandaan?|Van je bankrekening|Magisch, gratis geld|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Dotknij każdego, aby dowiedzieć się, co to jest.|Moneta|Moneta to forma pieniędzy, zwykle okrągła i wykonana z metalu.|Banknot|Banknot to pieniądz wydrukowany na specjalnym papierze lub trwałym materiale.|Karta debetowa|Kartą debetową możesz płacić pieniędzmi z twojego konta bankowego.|Dalej|Gdy płacisz kartą, skąd biorą się pieniądze?|Z twojego konta bankowego|Magiczne, darmowe pieniądze|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const moneyBasicsLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-money-basics-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
