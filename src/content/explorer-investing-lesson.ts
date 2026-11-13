import type { Locale } from "@/i18n/config";

/**
 * Lesson 9, Investing Basics — a plant-growth patience sequence
 * (ExplorerSequence), then two PictureChoice rounds: saving vs investing,
 * and "values can rise or fall, never guaranteed only up".
 */
type Fields =
  | "prompt1" | "seed" | "sprout" | "bud" | "flower"
  | "prompt2" | "investingChoice" | "savingChoice"
  | "prompt3" | "upOrDown" | "alwaysUp"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "seed", "sprout", "bud", "flower",
  "prompt2", "investingChoice", "savingChoice",
  "prompt3", "upOrDown", "alwaysUp",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "Good things take time. Put the plant’s growth in order.|Seed|Sprout|Bud|Flower|Saving keeps your money the same. Which one can grow bigger or smaller over time?|Investing|Saving|Can money that is invested only ever go up?|No, it can go up or down|Yes, it always goes up|Listen|Try again|Well done!|Continue",
  ro: "Lucrurile bune au nevoie de timp. Pune creșterea plantei în ordine.|Sămânță|Lăstar|Mugur|Floare|Ce poate valora mai mult sau mai puțin în timp?|Investiția|Economisirea|Poți pierde o parte din banii investiți?|Da, poți pierde bani|Nu, banii cresc mereu|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Las cosas buenas llevan tiempo. Pon el crecimiento de la planta en orden.|Semilla|Brote|Capullo|Flor|Ahorrar mantiene tu dinero igual. ¿Cuál puede crecer o encoger con el tiempo?|Invertir|Ahorrar|¿El dinero invertido solo puede subir?|No, puede subir o bajar|Sí, siempre sube|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Les bonnes choses prennent du temps. Mets la croissance de la plante dans l’ordre.|Graine|Pousse|Bourgeon|Fleur|Épargner garde ton argent pareil. Lequel peut grandir ou rétrécir avec le temps ?|Investir|Épargner|L’argent investi ne peut-il que monter ?|Non, il peut monter ou descendre|Oui, il monte toujours|Écouter|Réessaie|Bravo !|Continuer",
  de: "Gute Dinge brauchen Zeit. Bring das Wachstum der Pflanze in die richtige Reihenfolge.|Samen|Keimling|Knospe|Blüte|Sparen hält dein Geld gleich. Was kann mit der Zeit wachsen oder schrumpfen?|Investieren|Sparen|Kann investiertes Geld nur steigen?|Nein, es kann steigen oder fallen|Ja, es steigt immer|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Le cose belle richiedono tempo. Metti in ordine la crescita della pianta.|Seme|Germoglio|Bocciolo|Fiore|Risparmiare mantiene i tuoi soldi uguali. Quale può crescere o rimpicciolire nel tempo?|Investire|Risparmiare|I soldi investiti possono solo salire?|No, possono salire o scendere|Sì, salgono sempre|Ascolta|Riprova|Bravo!|Continua",
  pt: "As coisas boas demoram tempo. Põe o crescimento da planta em ordem.|Semente|Rebento|Botão|Flor|Poupar mantém o teu dinheiro igual. Qual pode crescer ou diminuir com o tempo?|Investir|Poupar|O dinheiro investido só pode subir?|Não, pode subir ou descer|Sim, sobe sempre|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Goede dingen kosten tijd. Zet de groei van de plant in de juiste volgorde.|Zaadje|Kiem|Knop|Bloem|Sparen houdt je geld hetzelfde. Wat kan groter of kleiner worden met de tijd?|Beleggen|Sparen|Kan belegd geld alleen maar stijgen?|Nee, het kan stijgen of dalen|Ja, het stijgt altijd|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Dobre rzeczy wymagają czasu. Ułóż wzrost rośliny w kolejności.|Nasiono|Kiełek|Pąk|Kwiat|Oszczędzanie utrzymuje twoje pieniądze takie same. Co może urosnąć lub zmaleć z czasem?|Inwestowanie|Oszczędzanie|Czy zainwestowane pieniądze mogą tylko rosnąć?|Nie, mogą rosnąć lub maleć|Tak, zawsze rosną|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const investingLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-investing-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
