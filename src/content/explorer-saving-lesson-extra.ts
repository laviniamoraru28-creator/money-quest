import type { Locale } from "@/i18n/config";

/**
 * Lesson 3, Saving — fills the gap beyond the existing ExplorerSavingJar
 * (fill a jar, watch the progress bar): a fictional bank-account concept,
 * and an explicit saving-vs-spending choice.
 */
type Fields =
  | "bankPrompt" | "bankChoice" | "groundChoice"
  | "choicePrompt" | "saveChoice" | "spendChoice"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "bankPrompt", "bankChoice", "groundChoice",
  "choicePrompt", "saveChoice", "spendChoice",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "You can also save money in a bank account instead of a jar. Where does your money stay safe?|In a bank account|Left outside on the ground|You get a coin. What does saving mean?|Keep it for later|Spend it right away|Listen|Try again|Well done!|Continue",
  ro: "Poți economisi bani și într-un cont bancar, nu doar într-un borcan. Unde rămân banii tăi în siguranță?|Într-un cont bancar|Lăsați afară pe jos|Primești o monedă. Ce înseamnă să economisești?|O păstrezi pentru mai târziu|O cheltuiești imediat|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "También puedes ahorrar dinero en una cuenta bancaria, no solo en un tarro. ¿Dónde queda tu dinero seguro?|En una cuenta bancaria|Dejado fuera en el suelo|Recibes una moneda. ¿Qué significa ahorrar?|Guardarla para más tarde|Gastarla enseguida|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Tu peux aussi épargner dans un compte bancaire, pas seulement dans un bocal. Où ton argent reste-t-il en sécurité ?|Dans un compte bancaire|Laissé dehors par terre|Tu reçois une pièce. Que signifie épargner ?|La garder pour plus tard|La dépenser tout de suite|Écouter|Réessaie|Bravo !|Continuer",
  de: "Du kannst Geld auch auf einem Bankkonto sparen, nicht nur in einem Glas. Wo bleibt dein Geld sicher?|Auf einem Bankkonto|Draußen auf dem Boden liegen gelassen|Du bekommst eine Münze. Was bedeutet Sparen?|Sie für später aufheben|Sie sofort ausgeben|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Puoi risparmiare anche in un conto bancario, non solo in un barattolo. Dove rimangono al sicuro i tuoi soldi?|In un conto bancario|Lasciati fuori per terra|Ricevi una moneta. Cosa significa risparmiare?|Tenerla per dopo|Spenderla subito|Ascolta|Riprova|Bravo!|Continua",
  pt: "Também podes poupar numa conta bancária, não só num frasco. Onde fica o teu dinheiro seguro?|Numa conta bancária|Deixado lá fora no chão|Recebes uma moeda. O que significa poupar?|Guardá-la para depois|Gastá-la já|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Je kunt ook sparen op een bankrekening, niet alleen in een pot. Waar blijft je geld veilig?|Op een bankrekening|Buiten op de grond gelaten|Je krijgt een munt. Wat betekent sparen?|Bewaren voor later|Meteen uitgeven|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Możesz też oszczędzać na koncie bankowym, nie tylko w słoiku. Gdzie twoje pieniądze są bezpieczne?|Na koncie bankowym|Zostawione na zewnątrz na ziemi|Dostajesz monetę. Co oznacza oszczędzanie?|Zachowanie jej na później|Wydanie jej od razu|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const savingExtraLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-saving-lesson-extra copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
