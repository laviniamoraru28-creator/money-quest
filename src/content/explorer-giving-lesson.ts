import type { Locale } from "@/i18n/config";

/**
 * Lesson 7, Giving — three screens covering the brief's four points:
 * donating 1 of 5 coins and seeing the remainder happen together (the
 * sort activity's own success message states how many are left), then a
 * free choice of cause (no "wrong" option — both are valid, so this is a
 * plain unvalidated choice, not an ExplorerPictureChoice), then a
 * fictional digital donation.
 */
type Fields =
  | "prompt1" | "coinLabel" | "giveBox" | "keepBox" | "remainderMessage"
  | "prompt2" | "cause1" | "cause2" | "causePicked"
  | "prompt3" | "sendChoice" | "closeChoice"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "coinLabel", "giveBox", "keepBox", "remainderMessage",
  "prompt2", "cause1", "cause2", "causePicked",
  "prompt3", "sendChoice", "closeChoice",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "You have 5 coins. Give 1 coin to help someone.|Coin|Give|Keep|You gave 1 coin. You have 4 coins left!|Who would you like to help?|An animal shelter|A food bank|Great choice! That helps people.|You want to send your gift with a phone app. What do you tap?|Send the gift|Close the app|Listen|Try again|Well done!|Continue",
  ro: "Ai 5 monede. Dă 1 monedă ca să ajuți pe cineva.|Monedă|Dăruiește|Păstrează|Ai dăruit 1 monedă. Mai ai 4 monede!|Pe cine ai vrea să ajuți?|Un adăpost pentru animale|O bancă de alimente|Alegere grozavă! Asta ajută oamenii.|Vrei să trimiți darul printr-o aplicație pe telefon. Pe ce apeși?|Trimite darul|Închide aplicația|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "Tienes 5 monedas. Da 1 moneda para ayudar a alguien.|Moneda|Dar|Guardar|¡Diste 1 moneda. Te quedan 4 monedas!|¿A quién te gustaría ayudar?|Un refugio de animales|Un banco de alimentos|¡Gran elección! Eso ayuda a la gente.|Quieres enviar tu regalo con una app del teléfono. ¿Qué tocas?|Enviar el regalo|Cerrar la app|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Tu as 5 pièces. Donne 1 pièce pour aider quelqu’un.|Pièce|Donner|Garder|Tu as donné 1 pièce. Il te reste 4 pièces !|Qui aimerais-tu aider ?|Un refuge pour animaux|Une banque alimentaire|Excellent choix ! Cela aide les gens.|Tu veux envoyer ton don avec une appli du téléphone. Sur quoi tapes-tu ?|Envoyer le don|Fermer l’appli|Écouter|Réessaie|Bravo !|Continuer",
  de: "Du hast 5 Münzen. Gib 1 Münze, um jemandem zu helfen.|Münze|Geben|Behalten|Du hast 1 Münze gegeben. Du hast noch 4 Münzen!|Wem möchtest du helfen?|Einem Tierheim|Einer Tafel|Tolle Wahl! Das hilft Menschen.|Du möchtest dein Geschenk mit einer Handy-App senden. Worauf tippst du?|Das Geschenk senden|Die App schließen|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Hai 5 monete. Dai 1 moneta per aiutare qualcuno.|Moneta|Dai|Tieni|Hai dato 1 moneta. Ti restano 4 monete!|Chi vorresti aiutare?|Un rifugio per animali|Un banco alimentare|Ottima scelta! Questo aiuta le persone.|Vuoi inviare il tuo regalo con un’app del telefono. Cosa tocchi?|Invia il regalo|Chiudi l’app|Ascolta|Riprova|Bravo!|Continua",
  pt: "Tens 5 moedas. Dá 1 moeda para ajudar alguém.|Moeda|Dar|Guardar|Deste 1 moeda. Ficaste com 4 moedas!|Quem gostarias de ajudar?|Um abrigo de animais|Um banco alimentar|Ótima escolha! Isso ajuda as pessoas.|Queres enviar o teu presente com uma app do telemóvel. Em que tocas?|Enviar o presente|Fechar a app|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Je hebt 5 munten. Geef 1 munt om iemand te helpen.|Munt|Geven|Houden|Je gaf 1 munt. Je hebt nog 4 munten over!|Wie zou je willen helpen?|Een dierenopvang|Een voedselbank|Goede keuze! Dat helpt mensen.|Je wilt je gift met een telefoon-app versturen. Waar tik je op?|De gift versturen|De app sluiten|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Masz 5 monet. Oddaj 1 monetę, żeby komuś pomóc.|Moneta|Oddaj|Zachowaj|Oddałeś 1 monetę. Zostały ci 4 monety!|Komu chciałbyś pomóc?|Schronisku dla zwierząt|Bankowi żywności|Świetny wybór! To pomaga ludziom.|Chcesz wysłać swój dar aplikacją w telefonie. W co stukasz?|Wyślij dar|Zamknij aplikację|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const givingLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-giving-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
