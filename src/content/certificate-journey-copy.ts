import type {Locale} from "@/i18n/config";
export const certificateJourneyCopy:Record<Locale,{heading:string;steps:string;print:string}> = {
 en:{heading:"How it works",steps:"Choose Explorer (6–8), Builder (9–11) or Strategist (12–14). Complete the lessons and games in your chosen level.",print:"After finishing Money Quest, Entrepreneur Quest, Leadership Quest and AI Quest, you can download one free certificate. Download and print it, then write your name in the blank space."},
 ro:{heading:"Cum funcționează",steps:"Alege nivelul Explorator (6–8 ani), Constructor (9–11 ani) sau Strateg (12–14 ani). Finalizează lecțiile și jocurile nivelului ales.",print:"După ce finalizezi Money Quest, Entrepreneur Quest, Leadership Quest și AI Quest, poți descărca un singur certificat gratuit. Îl poți descărca, imprima și completa cu numele copilului."},
 es:{heading:"Cómo funciona",steps:"Elige Explorador (6–8), Constructor (9–11) o Estratega (12–14). Completa las lecciones y los juegos de tu nivel.",print:"Tras completar Money Quest, Entrepreneur Quest, Leadership Quest y AI Quest, podrás descargar un único certificado gratuito. Descárgalo, imprímelo y escribe tu nombre en el espacio en blanco."},
 fr:{heading:"Comment ça marche",steps:"Choisis Explorateur (6–8 ans), Bâtisseur (9–11 ans) ou Stratège (12–14 ans). Termine les leçons et les jeux de ton niveau.",print:"Après avoir terminé Money Quest, Entrepreneur Quest, Leadership Quest et AI Quest, tu pourras télécharger un seul certificat gratuit. Télécharge-le, imprime-le et inscris ton nom dans l’espace prévu."},
 de:{heading:"So funktioniert es",steps:"Wähle Entdecker (6–8), Gestalter (9–11) oder Stratege (12–14). Schließe die Lektionen und Spiele deiner Stufe ab.",print:"Nach Money Quest, Entrepreneur Quest, Leadership Quest und AI Quest kannst du eine einzige kostenlose Urkunde herunterladen. Lade sie herunter, drucke sie aus und trage deinen Namen ein."},
 it:{heading:"Come funziona",steps:"Scegli Esploratore (6–8), Costruttore (9–11) o Stratega (12–14). Completa le lezioni e i giochi del tuo livello.",print:"Dopo aver completato Money Quest, Entrepreneur Quest, Leadership Quest e AI Quest, potrai scaricare un unico certificato gratuito. Scaricalo, stampalo e scrivi il tuo nome nello spazio vuoto."},
 pt:{heading:"Como funciona",steps:"Escolhe Explorador (6–8), Construtor (9–11) ou Estratega (12–14). Conclui as lições e os jogos do teu nível.",print:"Depois de concluíres Money Quest, Entrepreneur Quest, Leadership Quest e AI Quest, podes transferir um único certificado gratuito. Transfere-o, imprime-o e escreve o teu nome no espaço em branco."},
 nl:{heading:"Hoe het werkt",steps:"Kies Ontdekker (6–8), Bouwer (9–11) of Strateeg (12–14). Voltooi de lessen en spellen van je niveau.",print:"Na het afronden van Money Quest, Entrepreneur Quest, Leadership Quest en AI Quest kun je één gratis certificaat downloaden. Download en print het en schrijf je naam in het lege vak."},
 pl:{heading:"Jak to działa",steps:"Wybierz Odkrywcę (6–8), Budowniczego (9–11) lub Stratega (12–14). Ukończ lekcje i gry na swoim poziomie.",print:"Po ukończeniu Money Quest, Entrepreneur Quest, Leadership Quest i AI Quest możesz pobrać jeden bezpłatny certyfikat. Pobierz go, wydrukuj i wpisz swoje imię w pustym miejscu."},
};

/** Shown in place of the certificate reward once Money Quest (or
 * Money Quest + Entrepreneur Quest) is done for the selected level,
 * but the three-quest journey isn't finished yet - a visible nudge
 * for the MQ -> EQ -> LQ -> certificate order, never a forced redirect
 * (every quest stays voluntary and revisitable). */
export const journeyContinueCopy:Record<Locale,{heading:string;toEntrepreneurQuest:string;toLeadershipQuest:string}> = {
 en:{heading:"Great progress! Keep your quest going.",toEntrepreneurQuest:"Continue to Entrepreneur Quest",toLeadershipQuest:"Continue to Leadership Quest"},
 ro:{heading:"Progres grozav! Continuă aventura.",toEntrepreneurQuest:"Continuă cu Entrepreneur Quest",toLeadershipQuest:"Continuă cu Leadership Quest"},
 es:{heading:"¡Gran progreso! Sigue con tu aventura.",toEntrepreneurQuest:"Continuar con Entrepreneur Quest",toLeadershipQuest:"Continuar con Leadership Quest"},
 fr:{heading:"Beau progrès ! Continue ton aventure.",toEntrepreneurQuest:"Continuer avec Entrepreneur Quest",toLeadershipQuest:"Continuer avec Leadership Quest"},
 de:{heading:"Toller Fortschritt! Mach mit deinem Abenteuer weiter.",toEntrepreneurQuest:"Weiter mit Entrepreneur Quest",toLeadershipQuest:"Weiter mit Leadership Quest"},
 it:{heading:"Ottimo progresso! Continua la tua avventura.",toEntrepreneurQuest:"Continua con Entrepreneur Quest",toLeadershipQuest:"Continua con Leadership Quest"},
 pt:{heading:"Ótimo progresso! Continua a tua aventura.",toEntrepreneurQuest:"Continuar com o Entrepreneur Quest",toLeadershipQuest:"Continuar com o Leadership Quest"},
 nl:{heading:"Goed bezig! Ga verder met je avontuur.",toEntrepreneurQuest:"Verder met Entrepreneur Quest",toLeadershipQuest:"Verder met Leadership Quest"},
 pl:{heading:"Świetny postęp! Kontynuuj swoją przygodę.",toEntrepreneurQuest:"Przejdź do Entrepreneur Quest",toLeadershipQuest:"Przejdź do Leadership Quest"},
};
