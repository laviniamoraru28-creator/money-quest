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
  en: "Tap each one to learn what it is.|Coin|A coin is small and round.|Banknote|A banknote is a piece of paper money.|Debit card|A debit card is a small plastic card.|Continue|When you pay with a card, where does the money come from?|Your bank account|Magic, free money|Listen|Try again|Well done!|Continue",
  ro: "Atinge fiecare obiect ca să afli ce este.|Monedă|O monedă este mică și rotundă.|Bancnotă|O bancnotă este o bucată de hârtie-bani.|Card de debit|Un card de debit este un cărticel mic de plastic.|Continuă|Când plătești cu cardul, de unde vin banii?|Din contul tău bancar|Bani magici, gratis|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Toca cada uno para saber qué es.|Moneda|Una moneda es pequeña y redonda.|Billete|Un billete es un papel de dinero.|Tarjeta de débito|Una tarjeta de débito es una tarjetita de plástico.|Continuar|Cuando pagas con tarjeta, ¿de dónde viene el dinero?|De tu cuenta bancaria|Dinero mágico y gratis|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Touche chacun pour savoir ce que c’est.|Pièce|Une pièce est petite et ronde.|Billet|Un billet est un papier-argent.|Carte de débit|Une carte de débit est une petite carte en plastique.|Continuer|Quand tu paies par carte, d’où vient l’argent ?|De ton compte bancaire|De l’argent magique et gratuit|Écouter|Réessaie|Bravo !|Continuer",
  de: "Tippe auf jedes, um zu lernen, was es ist.|Münze|Eine Münze ist klein und rund.|Geldschein|Ein Geldschein ist ein Stück Papiergeld.|Debitkarte|Eine Debitkarte ist eine kleine Plastikkarte.|Weiter|Wenn du mit Karte bezahlst, woher kommt das Geld?|Von deinem Bankkonto|Magisches Gratisgeld|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Tocca ciascuno per scoprire cos’è.|Moneta|Una moneta è piccola e rotonda.|Banconota|Una banconota è un pezzo di carta-moneta.|Carta di debito|Una carta di debito è una piccola carta di plastica.|Continua|Quando paghi con la carta, da dove vengono i soldi?|Dal tuo conto bancario|Soldi magici e gratis|Ascolta|Riprova|Bravo!|Continua",
  pt: "Toca em cada um para aprender o que é.|Moeda|Uma moeda é pequena e redonda.|Nota|Uma nota é um papel-moeda.|Cartão de débito|Um cartão de débito é um pequeno cartão de plástico.|Continuar|Quando pagas com cartão, de onde vem o dinheiro?|Da tua conta bancária|Dinheiro mágico e grátis|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Tik op elk om te leren wat het is.|Munt|Een munt is klein en rond.|Bankbiljet|Een bankbiljet is een stuk papiergeld.|Betaalpas|Een betaalpas is een klein plastic kaartje.|Verder|Als je met een pas betaalt, waar komt het geld dan vandaan?|Van je bankrekening|Magisch, gratis geld|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Dotknij każdego, aby dowiedzieć się, co to jest.|Moneta|Moneta jest mała i okrągła.|Banknot|Banknot to kawałek papieru-pieniądza.|Karta debetowa|Karta debetowa to mała plastikowa karta.|Dalej|Gdy płacisz kartą, skąd biorą się pieniądze?|Z twojego konta bankowego|Magiczne, darmowe pieniądze|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const moneyBasicsLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-money-basics-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
