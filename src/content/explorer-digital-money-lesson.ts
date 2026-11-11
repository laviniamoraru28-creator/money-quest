import type { Locale } from "@/i18n/config";

/**
 * Lesson 8, Digital Money — reuses ExplorerMiniShop (already shows a card
 * payment with a visible, immediate balance decrease) for its first
 * activity, then two PictureChoice rounds: cash-vs-card comparison, and
 * card-tied-to-bank-account understanding.
 */
type Fields =
  | "prompt1" | "sameWay" | "fromNowhere"
  | "prompt2" | "bankAccount" | "freeFromCard"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "sameWay", "fromNowhere",
  "prompt2", "bankAccount", "freeFromCard",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "When you pay with a card instead of coins, does your money still go down?|Yes, it goes down either way|No, card money never goes down|Where does the money for a card payment come from?|Your bank account|Free money inside the card|Listen|Try again|Well done!|Continue",
  ro: "Când plătești cu cardul în loc de monede, banii tăi scad tot?|Da, scad oricum ai plăti|Nu, banii de pe card nu scad niciodată|De unde vin banii pentru o plată cu cardul?|Din contul tău bancar|Bani gratis din card|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Cuando pagas con tarjeta en lugar de monedas, ¿tu dinero baja igual?|Sí, baja de cualquier forma|No, el dinero de la tarjeta nunca baja|¿De dónde viene el dinero de un pago con tarjeta?|De tu cuenta bancaria|Dinero gratis dentro de la tarjeta|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Quand tu paies par carte au lieu de pièces, ton argent diminue-t-il quand même ?|Oui, il diminue dans les deux cas|Non, l’argent de la carte ne diminue jamais|D’où vient l’argent d’un paiement par carte ?|De ton compte bancaire|De l’argent gratuit dans la carte|Écouter|Réessaie|Bravo !|Continuer",
  de: "Wenn du mit Karte statt mit Münzen bezahlst, sinkt dein Geld trotzdem?|Ja, es sinkt so oder so|Nein, Kartengeld sinkt nie|Woher kommt das Geld für eine Kartenzahlung?|Von deinem Bankkonto|Gratisgeld in der Karte|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Quando paghi con la carta invece delle monete, i tuoi soldi diminuiscono comunque?|Sì, diminuiscono in entrambi i casi|No, i soldi della carta non diminuiscono mai|Da dove vengono i soldi di un pagamento con carta?|Dal tuo conto bancario|Soldi gratis dentro la carta|Ascolta|Riprova|Bravo!|Continua",
  pt: "Quando pagas com cartão em vez de moedas, o teu dinheiro desce na mesma?|Sim, desce de qualquer forma|Não, o dinheiro do cartão nunca desce|De onde vem o dinheiro de um pagamento com cartão?|Da tua conta bancária|Dinheiro grátis dentro do cartão|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Als je met een pas betaalt in plaats van munten, gaat je geld dan toch omlaag?|Ja, het gaat hoe dan ook omlaag|Nee, geld van de pas gaat nooit omlaag|Waar komt het geld voor een pasbetaling vandaan?|Van je bankrekening|Gratis geld in de pas|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Gdy płacisz kartą zamiast monetami, czy twoje pieniądze i tak maleją?|Tak, maleją tak czy inaczej|Nie, pieniądze z karty nigdy nie maleją|Skąd biorą się pieniądze na płatność kartą?|Z twojego konta bankowego|Darmowe pieniądze wewnątrz karty|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const digitalMoneyLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-digital-money-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
