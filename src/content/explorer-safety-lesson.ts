import type { Locale } from "@/i18n/config";

/**
 * Lesson 5, Money Safety — four real activities per the brief: protect
 * cash/card, keep a PIN private, recognize a suspicious request, ask a
 * trusted adult for help. Each is a two-option safe/unsafe choice, which
 * keeps every scenario concrete and age-appropriate rather than abstract
 * "stranger danger" theory.
 */
type Fields =
  | "prompt1" | "safe1" | "unsafe1"
  | "prompt2" | "safe2" | "unsafe2"
  | "prompt3" | "safe3" | "unsafe3"
  | "prompt4" | "safe4" | "unsafe4"
  | "replay" | "retry" | "success" | "next";

const fields: readonly Fields[] = [
  "prompt1", "safe1", "unsafe1",
  "prompt2", "safe2", "unsafe2",
  "prompt3", "safe3", "unsafe3",
  "prompt4", "safe4", "unsafe4",
  "replay", "retry", "success", "next",
];

const rows: Record<Locale, string> = {
  en: "What keeps your money safe?|Keep it in a safe place|Leave it where anyone can take it|Who should know your secret card code (PIN)?|Only me|Anyone who asks me|A stranger online asks for your card number. What do you do?|Don’t share it, tell a trusted adult|Give them the number|You are not sure if something about money is safe. What do you do?|Ask a parent or trusted adult|Decide it alone and say nothing|Listen|Try again|Well done!|Continue",
  ro: "Ce ține banii tăi în siguranță?|Îi păstrez într-un loc sigur|Îi las unde oricine îi poate lua|Cine ar trebui să știe codul secret al cardului tău (PIN)?|Doar eu|Oricine mă întreabă|Un necunoscut online îți cere numărul cardului. Ce faci?|Nu-l dau și spun unui adult de încredere|Îi dau numărul|Nu ești sigur dacă ceva legat de bani e sigur. Ce faci?|Întreabă un părinte sau un adult de încredere|Decizi singur și nu spui nimănui|Ascultă|Mai încearcă|Bravo!|Continuă",
  es: "¿Qué mantiene tu dinero seguro?|Guardarlo en un lugar seguro|Dejarlo donde cualquiera pueda cogerlo|¿Quién debe saber el código secreto de tu tarjeta (PIN)?|Solo yo|Cualquiera que me lo pida|Un desconocido en internet pide el número de tu tarjeta. ¿Qué haces?|No lo doy y se lo cuento a un adulto de confianza|Le doy el número|No estás seguro si algo sobre dinero es seguro. ¿Qué haces?|Preguntar a un adulto de confianza|Decidirlo solo y no decir nada|Escuchar|Inténtalo de nuevo|¡Muy bien!|Continuar",
  fr: "Qu’est-ce qui garde ton argent en sécurité ?|Le garder dans un endroit sûr|Le laisser où n’importe qui peut le prendre|Qui doit connaître le code secret de ta carte (PIN) ?|Seulement moi|N’importe qui me le demande|Un inconnu en ligne demande le numéro de ta carte. Que fais-tu ?|Je ne le donne pas et je le dis à un adulte de confiance|Je lui donne le numéro|Tu n’es pas sûr qu’une chose liée à l’argent soit sûre. Que fais-tu ?|Demander à un adulte de confiance|Décider seul et ne rien dire|Écouter|Réessaie|Bravo !|Continuer",
  de: "Was hält dein Geld sicher?|Es an einem sicheren Ort aufbewahren|Es dort lassen, wo es jeder nehmen kann|Wer sollte deinen geheimen Kartencode (PIN) kennen?|Nur ich|Jeder, der mich fragt|Ein Fremder im Internet fragt nach deiner Kartennummer. Was tust du?|Nicht weitergeben und einer Vertrauensperson sagen|Die Nummer geben|Du bist dir bei etwas mit Geld nicht sicher. Was tust du?|Eine Vertrauensperson fragen|Allein entscheiden und nichts sagen|Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Cosa tiene al sicuro i tuoi soldi?|Tenerli in un posto sicuro|Lasciarli dove chiunque può prenderli|Chi dovrebbe conoscere il codice segreto della tua carta (PIN)?|Solo io|Chiunque me lo chieda|Uno sconosciuto online chiede il numero della tua carta. Che fai?|Non lo do e lo dico a un adulto fidato|Gli do il numero|Non sei sicuro che qualcosa sui soldi sia sicuro. Che fai?|Chiedo a un adulto fidato|Decido da solo e non dico niente|Ascolta|Riprova|Bravo!|Continua",
  pt: "O que mantém o teu dinheiro seguro?|Guardá-lo num lugar seguro|Deixá-lo onde qualquer um o pode levar|Quem deve saber o código secreto do teu cartão (PIN)?|Só eu|Qualquer pessoa que me pergunte|Um desconhecido online pede o número do teu cartão. O que fazes?|Não dou e conto a um adulto de confiança|Dou o número|Não tens a certeza se algo sobre dinheiro é seguro. O que fazes?|Perguntar a um adulto de confiança|Decidir sozinho e não dizer nada|Ouvir|Tenta novamente|Muito bem!|Continuar",
  nl: "Wat houdt je geld veilig?|Het op een veilige plek bewaren|Het achterlaten waar iedereen het kan pakken|Wie moet je geheime kaartcode (pincode) weten?|Alleen ik|Iedereen die het mij vraagt|Een vreemde online vraagt je kaartnummer. Wat doe je?|Niet geven en het aan een vertrouwde volwassene vertellen|Het nummer geven|Je weet niet zeker of iets met geld veilig is. Wat doe je?|Een vertrouwde volwassene vragen|Alleen beslissen en niets zeggen|Luisteren|Probeer opnieuw|Goed gedaan!|Verder",
  pl: "Co chroni twoje pieniądze?|Trzymanie ich w bezpiecznym miejscu|Zostawienie ich tam, gdzie każdy może je wziąć|Kto powinien znać tajny kod twojej karty (PIN)?|Tylko ja|Każdy, kto mnie zapyta|Obcy w internecie prosi o numer twojej karty. Co robisz?|Nie podaję go i mówię zaufanemu dorosłemu|Podaję numer|Nie jesteś pewien, czy coś związanego z pieniędzmi jest bezpieczne. Co robisz?|Pytam zaufanego dorosłego|Decyduję sam i nic nie mówię|Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const safetyLessonCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-safety-lesson copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
