export const questBadges = {
  money: "curiosity",
  entrepreneur: "building",
  leadership: "decision",
  ai: "ai",
} as const;

export type QuestKey = keyof typeof questBadges;

// Messages follow the canonical completion rule for each Quest.
export const milestones = {
 en: ["Next Quest","Completed","You completed the money lessons and games.","You presented your business idea.","You completed the final leadership challenge.","You completed your AI challenge."],
 ro: ["Următorul Quest","Finalizat","Ai terminat lecțiile și jocurile despre bani.","Ți-ai prezentat ideea de afacere.","Ai încheiat provocarea finală de leadership.","Ai finalizat provocarea despre inteligența artificială."],
 fr: ["Prochaine quête","Terminée","Tu as terminé les leçons et les jeux sur l’argent.","Tu as présenté ton idée d’entreprise.","Tu as terminé le dernier défi de leadership.","Tu as terminé ton défi sur l’IA."],
 de: ["Nächste Quest","Abgeschlossen","Du hast die Lektionen und Spiele rund ums Geld abgeschlossen.","Du hast deine Geschäftsidee vorgestellt.","Du hast die letzte Führungsaufgabe abgeschlossen.","Du hast deine KI-Aufgabe abgeschlossen."],
 es: ["Siguiente misión","Completada","Has terminado las lecciones y los juegos sobre el dinero.","Has presentado tu idea de negocio.","Has completado el reto final de liderazgo.","Has completado tu reto de inteligencia artificial."],
 it: ["Prossima missione","Completata","Hai completato le lezioni e i giochi sul denaro.","Hai presentato la tua idea di impresa.","Hai completato la sfida finale di leadership.","Hai completato la tua sfida sull’intelligenza artificiale."],
 pt: ["Próxima missão","Concluída","Completaste as lições e os jogos sobre dinheiro.","Apresentaste a tua ideia de negócio.","Completaste o desafio final de liderança.","Completaste o teu desafio sobre inteligência artificial."],
 nl: ["Volgende missie","Voltooid","Je hebt de lessen en spellen over geld afgerond.","Je hebt je bedrijfsidee gepresenteerd.","Je hebt de laatste leiderschapsopdracht afgerond.","Je hebt je AI-opdracht afgerond."],
 pl: ["Następna misja","Ukończono","Lekcje i gry o pieniądzach za tobą.","Twój pomysł na biznes został zaprezentowany.","Ostatnie wyzwanie z przywództwa za tobą.","Twoje wyzwanie dotyczące sztucznej inteligencji za tobą."],
} as const;

export const milestoneIndex = {money:2, entrepreneur:3, leadership:4, ai:5} as const;
