"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {Link} from "@/i18n/navigation";
import {AI_QUEST_STORAGE_KEY, parseAIQuestProgress, completeAIMission} from "@/lib/ai-quest/progress";

type Band = "explorer" | "builder" | "strategist";
const units = [
  {title:"Meet Your New Teammate",concept:"AI predicts patterns from examples. It can help, but it can be wrong.",task:"Choose a helpful job for AI.",choices:["Ask AI to suggest three names for our lemonade stand.","Ask AI to decide who deserves to be your friend.","Tell AI your home address so it knows you."],correct:0,feedback:"AI is useful for brainstorming. People make personal decisions."},
  {title:"Talking Like a Leader",concept:"A good prompt explains the goal, audience and constraints. Check the result.",task:"Choose the clearest instruction.",choices:["Do something.","Suggest three friendly names for a children's bookshop, each under four words.","Make the perfect business and never ask questions."],correct:1,feedback:"Specific goals and limits help. Review the output yourself."},
  {title:"AI & Money",concept:"AI can help compare options, but it cannot guarantee profit or accurate prices.",task:"Choose the safest business decision.",choices:["Trust an AI profit prediction without checking.","Spend all your savings on an AI recommendation.","Compare costs yourself and ask an adult before spending real money."],correct:2,feedback:"Check the numbers and risks. AI suggestions are not financial guarantees."},
  {title:"The Truth Detective",concept:"AI sometimes produces convincing but false claims.",task:"An AI says your product will sell 1,000 units tomorrow. What now?",choices:["Check evidence, ask how it knows, and avoid presenting the claim as fact.","Publish it immediately.","Add more zeros to make it exciting."],correct:0,feedback:"Evidence matters more than a confident answer."},
  {title:"The Golden Rules",concept:"Protect privacy, respect people, verify claims and keep a human responsible.",task:"Choose the responsible way to use AI.",choices:["Upload a classmate's photo without permission.","Use AI to draft an advert, check its claims and ask permission before using anyone's data.","Copy AI output and pretend you created every idea."],correct:1,feedback:"Responsible AI use protects privacy and gives credit."}
] as const;
const romanian = [
 {title:"Noul tău coleg",concept:"AI învață tipare din exemple. Te poate ajuta, dar poate greși.",task:"Alege o activitate potrivită pentru AI.",choices:["Cere trei nume pentru un stand de limonadă.","Lasă AI să decidă cine îți este prieten.","Spune-i AI adresa ta de acasă."],feedback:"AI poate propune idei. Oamenii iau deciziile personale."},
 {title:"Vorbește clar",concept:"Spune ce dorești, pentru cine și cu ce limite. Verifică răspunsul.",task:"Alege instrucțiunea cea mai clară.",choices:["Fă ceva.","Propune trei nume prietenoase pentru o librărie pentru copii, fiecare cu maximum patru cuvinte.","Construiește afacerea perfectă fără întrebări."],feedback:"Un scop clar și limitele ajută. Tu verifici rezultatul."},
 {title:"AI și banii",concept:"AI poate compara opțiuni, dar nu garantează profit sau prețuri corecte.",task:"Alege decizia financiară sigură.",choices:["Crede o predicție de profit fără verificare.","Cheltuiește toate economiile la recomandarea AI.","Compară costurile și cere ajutorul unui adult înainte de a cheltui bani reali."],feedback:"Verifică cifrele și riscurile."},
 {title:"Detectivul adevărului",concept:"AI poate prezenta informații false într-un mod convingător.",task:"AI spune că vei vinde 1.000 de produse mâine. Ce faci?",choices:["Caută dovezi și nu prezenta afirmația ca fapt sigur.","Publică imediat.","Mărește cifra ca să impresionezi."],feedback:"Dovezile sunt mai importante decât un răspuns sigur pe sine."},
 {title:"Regulile de aur",concept:"Protejează datele, respectă oamenii și verifică afirmațiile.",task:"Alege utilizarea responsabilă a AI.",choices:["Încarcă fotografia unui coleg fără permisiune.","Folosește AI pentru o reclamă, verifică afirmațiile și cere acordul pentru orice date personale.","Copiază răspunsul AI și spune că toate ideile sunt ale tale."],feedback:"Protejează datele și recunoaște contribuțiile."}
] as const;
const explorerTranslations: Record<string, readonly {title:string;concept:string;task:string;choices:readonly string[];feedback:string}[]> = {
 "es": [
  {
   "title": "Tu nuevo compañero",
   "concept": "La IA aprende patrones de ejemplos. Puede equivocarse.",
   "task": "Elige una tarea útil para la IA.",
   "choices": [
    "Pedir tres nombres para un puesto de limonada.",
    "Dejar que la IA elija tus amistades.",
    "Dar tu dirección a la IA."
   ],
   "feedback": "La IA propone ideas. Tú tomas decisiones personales."
  },
  {
   "title": "Habla con claridad",
   "concept": "Una buena instrucción incluye objetivo y límites.",
   "task": "Elige la instrucción más clara.",
   "choices": [
    "Haz algo.",
    "Propón tres nombres cortos para una librería infantil.",
    "Crea un negocio perfecto sin preguntas."
   ],
   "feedback": "Explica el objetivo y revisa el resultado."
  },
  {
   "title": "IA y dinero",
   "concept": "La IA no garantiza beneficios ni precios correctos.",
   "task": "Elige una decisión segura.",
   "choices": [
    "Confiar en una predicción sin comprobar.",
    "Gastar todos los ahorros por consejo de la IA.",
    "Comparar costes y consultar a un adulto."
   ],
   "feedback": "Comprueba los números y riesgos."
  },
  {
   "title": "Detectives de la verdad",
   "concept": "La IA puede dar información falsa con seguridad.",
   "task": "La IA predice mil ventas mañana. ¿Qué haces?",
   "choices": [
    "Buscar pruebas antes de compartirlo.",
    "Publicarlo de inmediato.",
    "Aumentar la cifra."
   ],
   "feedback": "Las pruebas importan más que la confianza."
  },
  {
   "title": "Reglas de oro",
   "concept": "Protege la privacidad y comprueba las afirmaciones.",
   "task": "Elige el uso responsable.",
   "choices": [
    "Subir la foto de un compañero sin permiso.",
    "Revisar un anuncio y pedir permiso para usar datos.",
    "Copiar ideas sin reconocer la ayuda."
   ],
   "feedback": "Protege los datos y reconoce las fuentes."
  }
 ],
 "fr": [
  {
   "title": "Ton nouvel équipier",
   "concept": "L’IA apprend des modèles et peut se tromper.",
   "task": "Choisis un bon usage de l’IA.",
   "choices": [
    "Demander trois noms pour un stand de limonade.",
    "Laisser l’IA choisir tes amis.",
    "Donner ton adresse à l’IA."
   ],
   "feedback": "L’IA suggère des idées. Les humains décident."
  },
  {
   "title": "Parle clairement",
   "concept": "Une consigne précise indique un but et des limites.",
   "task": "Choisis la consigne la plus claire.",
   "choices": [
    "Fais quelque chose.",
    "Propose trois noms courts pour une librairie jeunesse.",
    "Crée une entreprise parfaite sans questions."
   ],
   "feedback": "Précise le but et vérifie le résultat."
  },
  {
   "title": "IA et argent",
   "concept": "L’IA ne garantit ni bénéfices ni prix exacts.",
   "task": "Choisis une décision prudente.",
   "choices": [
    "Croire une prévision sans vérifier.",
    "Dépenser toutes tes économies sur conseil de l’IA.",
    "Comparer les coûts et demander à un adulte."
   ],
   "feedback": "Vérifie les chiffres et les risques."
  },
  {
   "title": "Détective du vrai",
   "concept": "L’IA peut inventer des informations convaincantes.",
   "task": "L’IA prédit mille ventes demain. Que fais-tu ?",
   "choices": [
    "Chercher des preuves avant de publier.",
    "Publier immédiatement.",
    "Augmenter le chiffre."
   ],
   "feedback": "Les preuves comptent davantage."
  },
  {
   "title": "Règles d’or",
   "concept": "Protège les données et vérifie les affirmations.",
   "task": "Choisis un usage responsable.",
   "choices": [
    "Partager la photo d’un camarade sans accord.",
    "Vérifier une publicité et demander la permission.",
    "Copier les idées sans mentionner l’aide."
   ],
   "feedback": "Protège les données et cite les contributions."
  }
 ],
 "de": [
  {
   "title": "Dein neuer Helfer",
   "concept": "KI erkennt Muster und kann Fehler machen.",
   "task": "Wähle eine sinnvolle KI-Aufgabe.",
   "choices": [
    "Drei Namen für einen Limonadenstand vorschlagen lassen.",
    "KI über deine Freunde entscheiden lassen.",
    "Der KI deine Adresse geben."
   ],
   "feedback": "KI liefert Ideen. Menschen entscheiden."
  },
  {
   "title": "Sprich deutlich",
   "concept": "Eine gute Anfrage nennt Ziel und Grenzen.",
   "task": "Wähle die klarste Anfrage.",
   "choices": [
    "Mach irgendwas.",
    "Nenne drei kurze Namen für einen Kinderbuchladen.",
    "Erstelle ein perfektes Geschäft ohne Fragen."
   ],
   "feedback": "Nenne dein Ziel und prüfe das Ergebnis."
  },
  {
   "title": "KI und Geld",
   "concept": "KI garantiert weder Gewinn noch richtige Preise.",
   "task": "Wähle eine sichere Entscheidung.",
   "choices": [
    "Einer Prognose ungeprüft glauben.",
    "Alle Ersparnisse nach KI-Rat ausgeben.",
    "Kosten vergleichen und Erwachsene fragen."
   ],
   "feedback": "Prüfe Zahlen und Risiken."
  },
  {
   "title": "Wahrheitsdetektiv",
   "concept": "KI kann überzeugend falsche Aussagen machen.",
   "task": "KI sagt tausend Verkäufe voraus. Was tust du?",
   "choices": [
    "Vor dem Teilen Belege prüfen.",
    "Sofort veröffentlichen.",
    "Die Zahl erhöhen."
   ],
   "feedback": "Belege sind wichtiger als Sicherheit."
  },
  {
   "title": "Goldene Regeln",
   "concept": "Schütze Daten und prüfe Aussagen.",
   "task": "Wähle verantwortliche KI-Nutzung.",
   "choices": [
    "Fotos anderer ohne Erlaubnis hochladen.",
    "Werbung prüfen und um Erlaubnis bitten.",
    "KI-Ideen als eigene ausgeben."
   ],
   "feedback": "Schütze Daten und nenne Beiträge."
  }
 ],
 "it": [
  {
   "title": "Il tuo nuovo aiutante",
   "concept": "L’IA riconosce schemi e può sbagliare.",
   "task": "Scegli un compito utile per l’IA.",
   "choices": [
    "Chiedere tre nomi per un chiosco di limonata.",
    "Far scegliere gli amici all’IA.",
    "Dare il tuo indirizzo all’IA."
   ],
   "feedback": "L’IA suggerisce idee. Le persone decidono."
  },
  {
   "title": "Parla chiaramente",
   "concept": "Una buona richiesta indica obiettivo e limiti.",
   "task": "Scegli la richiesta più chiara.",
   "choices": [
    "Fai qualcosa.",
    "Suggerisci tre nomi brevi per una libreria per bambini.",
    "Crea un’attività perfetta senza domande."
   ],
   "feedback": "Specifica l’obiettivo e verifica il risultato."
  },
  {
   "title": "IA e denaro",
   "concept": "L’IA non garantisce profitti o prezzi corretti.",
   "task": "Scegli una decisione prudente.",
   "choices": [
    "Credere a una previsione senza verificarla.",
    "Spendere tutti i risparmi su consiglio dell’IA.",
    "Confrontare i costi e chiedere a un adulto."
   ],
   "feedback": "Controlla numeri e rischi."
  },
  {
   "title": "Detective della verità",
   "concept": "L’IA può produrre affermazioni false.",
   "task": "L’IA prevede mille vendite domani. Che fai?",
   "choices": [
    "Cercare prove prima di condividere.",
    "Pubblicare subito.",
    "Aumentare la cifra."
   ],
   "feedback": "Le prove contano più della sicurezza."
  },
  {
   "title": "Regole d’oro",
   "concept": "Proteggi i dati e verifica le affermazioni.",
   "task": "Scegli un uso responsabile.",
   "choices": [
    "Caricare foto altrui senza permesso.",
    "Controllare la pubblicità e chiedere il consenso.",
    "Copiare idee senza citare l’aiuto."
   ],
   "feedback": "Proteggi i dati e riconosci i contributi."
  }
 ],
 "pt": [
  {
   "title": "O teu novo ajudante",
   "concept": "A IA aprende padrões e pode errar.",
   "task": "Escolhe uma tarefa útil para a IA.",
   "choices": [
    "Pedir três nomes para uma banca de limonada.",
    "Deixar a IA escolher os teus amigos.",
    "Dar a tua morada à IA."
   ],
   "feedback": "A IA sugere ideias. As pessoas decidem."
  },
  {
   "title": "Fala com clareza",
   "concept": "Um bom pedido indica objetivo e limites.",
   "task": "Escolhe o pedido mais claro.",
   "choices": [
    "Faz alguma coisa.",
    "Sugere três nomes curtos para uma livraria infantil.",
    "Cria um negócio perfeito sem perguntas."
   ],
   "feedback": "Define o objetivo e verifica o resultado."
  },
  {
   "title": "IA e dinheiro",
   "concept": "A IA não garante lucros nem preços certos.",
   "task": "Escolhe uma decisão segura.",
   "choices": [
    "Acreditar numa previsão sem verificar.",
    "Gastar todas as poupanças por conselho da IA.",
    "Comparar custos e perguntar a um adulto."
   ],
   "feedback": "Verifica os números e riscos."
  },
  {
   "title": "Detetive da verdade",
   "concept": "A IA pode apresentar informações falsas.",
   "task": "A IA prevê mil vendas amanhã. O que fazes?",
   "choices": [
    "Procurar provas antes de partilhar.",
    "Publicar imediatamente.",
    "Aumentar o número."
   ],
   "feedback": "As provas são mais importantes."
  },
  {
   "title": "Regras de ouro",
   "concept": "Protege os dados e verifica afirmações.",
   "task": "Escolhe um uso responsável.",
   "choices": [
    "Enviar fotos de colegas sem autorização.",
    "Verificar anúncios e pedir consentimento.",
    "Copiar ideias sem reconhecer a ajuda."
   ],
   "feedback": "Protege os dados e reconhece contribuições."
  }
 ],
 "nl": [
  {
   "title": "Je nieuwe helper",
   "concept": "AI herkent patronen en kan fouten maken.",
   "task": "Kies een nuttige taak voor AI.",
   "choices": [
    "Drie namen voor een limonadekraam bedenken.",
    "AI je vrienden laten kiezen.",
    "Je adres aan AI geven."
   ],
   "feedback": "AI geeft ideeën. Mensen beslissen."
  },
  {
   "title": "Wees duidelijk",
   "concept": "Een goede opdracht heeft een doel en grenzen.",
   "task": "Kies de duidelijkste opdracht.",
   "choices": [
    "Doe iets.",
    "Bedenk drie korte namen voor een kinderboekwinkel.",
    "Maak een perfect bedrijf zonder vragen."
   ],
   "feedback": "Noem je doel en controleer het antwoord."
  },
  {
   "title": "AI en geld",
   "concept": "AI garandeert geen winst of juiste prijzen.",
   "task": "Kies een veilige beslissing.",
   "choices": [
    "Een voorspelling zonder controle geloven.",
    "Al je spaargeld uitgeven op advies van AI.",
    "Kosten vergelijken en een volwassene vragen."
   ],
   "feedback": "Controleer cijfers en risico's."
  },
  {
   "title": "Waarheidsdetective",
   "concept": "AI kan overtuigend onjuiste informatie geven.",
   "task": "AI voorspelt duizend verkopen morgen. Wat doe je?",
   "choices": [
    "Eerst bewijs zoeken.",
    "Meteen publiceren.",
    "Het getal verhogen."
   ],
   "feedback": "Bewijs is belangrijker dan zekerheid."
  },
  {
   "title": "Gouden regels",
   "concept": "Bescherm gegevens en controleer beweringen.",
   "task": "Kies verantwoord AI-gebruik.",
   "choices": [
    "Foto's van anderen zonder toestemming delen.",
    "Een advertentie controleren en toestemming vragen.",
    "AI-ideeën als eigen werk presenteren."
   ],
   "feedback": "Bescherm gegevens en erken bijdragen."
  }
 ],
 "pl": [
  {
   "title": "Twój nowy pomocnik",
   "concept": "AI rozpoznaje wzorce i może się mylić.",
   "task": "Wybierz dobre zadanie dla AI.",
   "choices": [
    "Poprosić o trzy nazwy stoiska z lemoniadą.",
    "Pozwolić AI wybrać przyjaciół.",
    "Podać AI swój adres."
   ],
   "feedback": "AI podsuwa pomysły. Ludzie podejmują decyzje."
  },
  {
   "title": "Mów jasno",
   "concept": "Dobre polecenie określa cel i ograniczenia.",
   "task": "Wybierz najjaśniejsze polecenie.",
   "choices": [
    "Zrób coś.",
    "Zaproponuj trzy krótkie nazwy księgarni dziecięcej.",
    "Stwórz idealną firmę bez pytań."
   ],
   "feedback": "Określ cel i sprawdź wynik."
  },
  {
   "title": "AI i pieniądze",
   "concept": "AI nie gwarantuje zysków ani poprawnych cen.",
   "task": "Wybierz bezpieczną decyzję.",
   "choices": [
    "Uwierzyć prognozie bez sprawdzenia.",
    "Wydać wszystkie oszczędności za radą AI.",
    "Porównać koszty i zapytać dorosłego."
   ],
   "feedback": "Sprawdź liczby i ryzyko."
  },
  {
   "title": "Detektyw prawdy",
   "concept": "AI może podawać przekonujące nieprawdy.",
   "task": "AI przewiduje tysiąc sprzedaży jutro. Co robisz?",
   "choices": [
    "Sprawdzić dowody przed publikacją.",
    "Od razu opublikować.",
    "Zwiększyć liczbę."
   ],
   "feedback": "Dowody są ważniejsze niż pewność."
  },
  {
   "title": "Złote zasady",
   "concept": "Chroń dane i sprawdzaj twierdzenia.",
   "task": "Wybierz odpowiedzialne użycie AI.",
   "choices": [
    "Wysłać zdjęcie kolegi bez zgody.",
    "Sprawdzić reklamę i poprosić o zgodę.",
    "Przypisać sobie pomysły AI."
   ],
   "feedback": "Chroń dane i uznawaj wkład innych."
  }
 ]
};
const explorerIcons=[["💡","👫","🏠"],["❓","📚","✨"],["🎲","💸","🧮"],["🔎","📢","🔢"],["📸","🛡️","📝"]] as const;
const ageTasks:Record<Band,readonly string[]> = {
  explorer:["🧠 AI helps us think of ideas. Which choice is kind and safe?","🗣️ Which request gives AI a clear job?","🪙 Which choice keeps our money safe?","🔎 Which choice checks if a story is true?","🛡️ Which choice protects other people?"],
  builder:["Junior mission: pick an appropriate use of AI for a small project.","Junior mission: improve a vague prompt with a goal and a limit.","Junior mission: compare costs before trusting an AI suggestion.","Junior mission: verify a claim before sharing it.","Junior mission: apply privacy, fairness and credit rules."],
  strategist:["Pro mission: decide which decisions to delegate and which require human judgement.","Pro mission: design a testable prompt with audience, format and constraints.","Pro mission: evaluate uncertainty, pricing and profit claims.","Pro mission: challenge unsupported marketing predictions.","Pro mission: apply an ethical review to AI-assisted advertising."]
};
const advanced:Record<"builder"|"strategist",readonly {task:string;choices:readonly [string,string,string];correct:number;feedback:string}[]> = {
 builder:[
 {task:"Your team wants to design a school garden poster. What should AI do?",choices:["Suggest a few slogans for you to review.","Decide which classmate is the smartest.","Ask for everyone's phone numbers."],correct:0,feedback:"Use AI to brainstorm, not to judge classmates or collect private data."},
 {task:"You want ideas for a low-cost school fair stall. Which prompt works best?",choices:["Make it amazing.","Tell me everything.","Suggest three stall ideas under £10, with materials and safety checks."],correct:2,feedback:"A clear goal and budget make suggestions easier to evaluate."},
 {task:"An AI suggests selling 20 items at £3 each. Supplies cost £25. What is the profit before other costs?",choices:["£60","£35","£85"],correct:1,feedback:"Revenue is £60. Subtract £25 in supplies to get £35 before other costs."},
 {task:"AI says a new game is suitable for every child. What should you do?",choices:["Check age guidance and other reliable sources.","Trust it because AI sounds confident.","Repeat the claim without checking."],correct:0,feedback:"Check independent evidence and age guidance."},
 {task:"You want an AI poster featuring your friend. What is the first step?",choices:["Upload their photo without asking.","Ask permission and avoid sharing personal details.","Publish their name and address."],correct:1,feedback:"Consent and privacy come before publishing."}
 ],
 strategist:[
 {task:"A founder wants AI to reject job applicants automatically. Which safeguard is essential?",choices:["Let AI decide secretly.","Remove human review.","Use human oversight and check for unfair outcomes."],correct:2,feedback:"High-impact decisions need accountability and bias checks."},
 {task:"Write a prompt to assess a business idea. Which is most testable?",choices:["Compare two reusable bottle ideas for ages 12–14 using cost, risks, assumptions and evidence gaps.","Tell me the best idea ever.","Guarantee a successful launch."],correct:0,feedback:"A good evaluation makes assumptions and uncertainty visible."},
 {task:"Your AI forecast says 200 sales at £5, variable cost £3 each, fixed cost £250. What is estimated profit?",choices:["£750","£150","£400"],correct:1,feedback:"Contribution is 200 × (£5−£3) = £400. After £250 fixed costs, profit is £150, if assumptions hold."},
 {task:"An AI invents a customer quote praising your product. What is ethical?",choices:["Publish it as a real review.","Change the name and publish it.","Do not present invented testimony as real evidence."],correct:2,feedback:"Fabricated testimonials mislead customers. Collect genuine feedback."},
 {task:"A teammate enters customer email addresses into a public AI tool. What should the team do?",choices:["Stop, minimize exposure, follow the privacy process and use anonymized examples.","Add phone numbers for accuracy.","Keep using the tool because it is convenient."],correct:0,feedback:"Minimize personal data and assess tools before using them."}
 ]
};
const advancedRomanian:Record<"builder"|"strategist",readonly {task:string;choices:readonly [string,string,string];feedback:string}[]> = {
 "builder": [
  {
   "task": "Pregătești un afiș pentru grădina școlii. Cum te poate ajuta AI?",
   "choices": [
    "Să propună sloganuri pe care le verifici.",
    "Să decidă cine este cel mai inteligent coleg.",
    "Să ceară numerele de telefon ale tuturor."
   ],
   "feedback": "Folosește AI pentru idei, nu pentru evaluarea colegilor sau colectarea datelor."
  },
  {
   "task": "Vrei idei pentru un stand la târgul școlii. Care cerere este mai bună?",
   "choices": [
    "Fă-l minunat.",
    "Spune-mi tot.",
    "Propune trei idei de stand sub 10 lire, cu materiale și verificări de siguranță."
   ],
   "feedback": "Un obiectiv și un buget clar te ajută să verifici propunerile."
  },
  {
   "task": "AI propune să vinzi 20 de produse la 3 lire. Materialele costă 25 de lire. Care este profitul înaintea altor costuri?",
   "choices": [
    "60 de lire",
    "35 de lire",
    "85 de lire"
   ],
   "feedback": "Încasezi 60 de lire și scazi 25 de lire. Rămân 35 de lire înaintea altor costuri."
  },
  {
   "task": "AI spune că un joc nou este potrivit pentru toți copiii. Ce faci?",
   "choices": [
    "Verifici recomandările de vârstă și alte surse credibile.",
    "Crezi AI pentru că pare sigur.",
    "Repeti afirmația fără verificare."
   ],
   "feedback": "Verifică dovezile și recomandările de vârstă."
  },
  {
   "task": "Vrei un afiș AI cu fotografia unui prieten. Ce faci mai întâi?",
   "choices": [
    "Încarci fotografia fără să întrebi.",
    "Ceri permisiunea și eviți datele personale.",
    "Publici numele și adresa prietenului."
   ],
   "feedback": "Acordul și protejarea datelor sunt esențiale."
  }
 ],
 "strategist": [
  {
   "task": "Un antreprenor vrea ca AI să respingă automat candidați. Ce măsură este necesară?",
   "choices": [
    "Lași AI să decidă în secret.",
    "Elimini verificarea umană.",
    "Păstrezi supravegherea umană și verifici discriminarea."
   ],
   "feedback": "Deciziile importante au nevoie de responsabilitate și verificarea prejudecăților."
  },
  {
   "task": "Vrei să evaluezi o idee de afacere. Care cerere AI poate fi verificată?",
   "choices": [
    "Compară două idei de sticle reutilizabile pentru 12–14 ani, cu costuri, riscuri și dovezi lipsă.",
    "Spune-mi cea mai bună idee din lume.",
    "Garantează lansarea reușită."
   ],
   "feedback": "O evaluare bună arată presupunerile și incertitudinea."
  },
  {
   "task": "AI estimează 200 de vânzări la 5 lire, cost variabil de 3 lire și cost fix de 250 de lire. Ce profit estimezi?",
   "choices": [
    "750 de lire",
    "150 de lire",
    "400 de lire"
   ],
   "feedback": "200 × (5 − 3) = 400 de lire. Scazi 250 de lire și obții 150, dacă estimările se confirmă."
  },
  {
   "task": "AI inventează o recenzie favorabilă pentru produs. Ce este corect?",
   "choices": [
    "O publici drept recenzie reală.",
    "Schimbi numele și o publici.",
    "Nu prezinți mărturia inventată ca dovadă reală."
   ],
   "feedback": "Recenziile inventate induc clienții în eroare. Cere feedback autentic."
  },
  {
   "task": "Un coleg introduce adresele de email ale clienților într-un AI public. Ce face echipa?",
   "choices": [
    "Oprește introducerea datelor, verifică incidentul și folosește exemple anonime.",
    "Adaugă și numere de telefon.",
    "Continuă pentru că este comod."
   ],
   "feedback": "Redu la minimum datele personale și verifică instrumentele înainte de folosire."
  }
 ]
};
const advancedTranslations:Record<string,Record<"builder"|"strategist",readonly {task:string;choices:readonly string[];feedback:string}[]>> = {"es":{"builder":[{"task":"Tu equipo diseña un cartel escolar. ¿Qué puede hacer la IA?","choices":["Proponer lemas para revisar.","Decidir quién es más inteligente.","Pedir teléfonos de todos."],"feedback":"Usa IA para ideas, no para juzgar personas."},{"task":"Quieres un puesto en la feria escolar. ¿Qué petición es mejor?","choices":["Hazlo increíble.","Dime todo.","Propón tres puestos por menos de £10 con materiales y seguridad."],"feedback":"Un objetivo y presupuesto ayudan a evaluar."},{"task":"Vendes 20 artículos a £3. Los materiales cuestan £25. ¿Beneficio antes de otros costes?","choices":["£60","£35","£85"],"feedback":"Ingresos £60 menos £25 son £35."},{"task":"La IA dice que un juego sirve para todos los niños. ¿Qué haces?","choices":["Comprobar edades y fuentes fiables.","Creerlo sin revisar.","Repetirlo sin pruebas."],"feedback":"Comprueba las recomendaciones y pruebas."},{"task":"Quieres un cartel con la foto de un amigo. ¿Primero?","choices":["Subirla sin preguntar.","Pedir permiso y evitar datos privados.","Publicar su dirección."],"feedback":"El consentimiento protege la privacidad."}],"strategist":[{"task":"Una empresa usa IA para rechazar candidatos. ¿Qué protección necesita?","choices":["Dejar decidir a la IA en secreto.","Eliminar supervisión.","Revisión humana y controles de sesgo."],"feedback":"Las decisiones importantes requieren supervisión."},{"task":"¿Qué petición permite evaluar una idea empresarial?","choices":["Compara dos botellas reutilizables: costes, riesgos y pruebas.","Dime la mejor idea.","Garantiza el éxito."],"feedback":"Expón supuestos e incertidumbre."},{"task":"200 ventas a £5, coste variable £3 por unidad y coste fijo £250. ¿Beneficio estimado?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"La IA inventa una reseña positiva. ¿Qué es correcto?","choices":["Publicarla como real.","Cambiar el nombre.","No presentarla como testimonio real."],"feedback":"Las reseñas inventadas engañan."},{"task":"Alguien introduce correos de clientes en una IA pública. ¿Qué hacer?","choices":["Detenerlo y usar ejemplos anónimos.","Añadir teléfonos.","Continuar."],"feedback":"Minimiza la exposición de datos."}]},"fr":{"builder":[{"task":"Ton équipe crée une affiche scolaire. Que peut faire l’IA ?","choices":["Proposer des slogans à vérifier.","Classer les élèves par intelligence.","Demander les téléphones de tous."],"feedback":"L’IA aide à imaginer, pas à juger."},{"task":"Tu prépares un stand scolaire. Quelle demande est précise ?","choices":["Fais quelque chose de génial.","Dis-moi tout.","Propose trois stands à moins de £10, avec matériel et sécurité."],"feedback":"Un but et un budget aident à vérifier."},{"task":"20 objets à £3, matériel £25. Quel bénéfice avant autres frais ?","choices":["£60","£35","£85"],"feedback":"£60 de recettes moins £25 de matériel = £35."},{"task":"L’IA dit qu’un jeu convient à tous. Que fais-tu ?","choices":["Vérifier les âges et des sources fiables.","La croire sans vérifier.","Répéter sans preuve."],"feedback":"Vérifie les preuves."},{"task":"Tu veux utiliser la photo d’un ami. D’abord ?","choices":["La publier sans demander.","Demander son accord et protéger ses données.","Publier son adresse."],"feedback":"Le consentement est essentiel."}],"strategist":[{"task":"Une entreprise utilise l’IA pour refuser des candidats. Quelle garantie ?","choices":["Laisser l’IA décider seule.","Supprimer les contrôles.","Contrôle humain et recherche de biais."],"feedback":"Les décisions importantes exigent un contrôle."},{"task":"Quelle demande aide à évaluer un projet ?","choices":["Compare deux gourdes : coûts, risques et preuves manquantes.","Donne la meilleure idée.","Garantis le succès."],"feedback":"Montre les hypothèses et incertitudes."},{"task":"200 ventes à £5, coût variable £3 et frais fixes £250. Bénéfice ?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"L’IA invente un avis client. Que faire ?","choices":["Le publier comme vrai.","Changer le nom.","Ne pas le présenter comme authentique."],"feedback":"Un faux avis trompe les clients."},{"task":"Un collègue saisit des emails clients dans une IA publique. Que faire ?","choices":["Arrêter et utiliser des exemples anonymes.","Ajouter des numéros.","Continuer."],"feedback":"Réduis les données personnelles."}]},"de":{"builder":[{"task":"Dein Team erstellt ein Schulplakat. Wobei hilft KI?","choices":["Slogans vorschlagen, die ihr prüft.","Kinder nach Intelligenz bewerten.","Alle Telefonnummern sammeln."],"feedback":"KI liefert Ideen, keine Urteile über Menschen."},{"task":"Du planst einen Schulstand. Welche Anfrage ist klar?","choices":["Mach etwas Tolles.","Sag mir alles.","Nenne drei Stände unter £10 mit Material und Sicherheit."],"feedback":"Ziel und Budget helfen beim Prüfen."},{"task":"20 Artikel zu £3, Material £25. Gewinn vor weiteren Kosten?","choices":["£60","£35","£85"],"feedback":"£60 Einnahmen minus £25 Material = £35."},{"task":"KI sagt, ein Spiel passe für alle Kinder. Was tust du?","choices":["Altersangaben und Quellen prüfen.","Einfach glauben.","Ungeprüft wiederholen."],"feedback":"Prüfe unabhängige Belege."},{"task":"Du möchtest ein Foto eines Freundes verwenden. Zuerst?","choices":["Ohne Frage hochladen.","Erlaubnis einholen und Daten schützen.","Adresse veröffentlichen."],"feedback":"Einwilligung schützt die Privatsphäre."}],"strategist":[{"task":"KI soll Bewerber automatisch ablehnen. Welche Sicherung?","choices":["KI heimlich entscheiden lassen.","Kontrollen abschaffen.","Menschliche Kontrolle und Prüfung auf Benachteiligung."],"feedback":"Wichtige Entscheidungen brauchen Aufsicht."},{"task":"Welche Anfrage bewertet eine Geschäftsidee?","choices":["Vergleiche zwei Trinkflaschen: Kosten, Risiken und Belege.","Nenne die beste Idee.","Garantiere Erfolg."],"feedback":"Lege Annahmen offen."},{"task":"200 Verkäufe zu £5, variable Kosten £3, Fixkosten £250. Gewinn?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"KI erfindet eine Kundenbewertung. Was ist richtig?","choices":["Als echt veröffentlichen.","Namen ändern.","Nicht als echte Bewertung ausgeben."],"feedback":"Erfundene Bewertungen täuschen."},{"task":"Kunden-E-Mails landen in öffentlicher KI. Was tun?","choices":["Stoppen und anonymisierte Beispiele nutzen.","Telefonnummern ergänzen.","Weitermachen."],"feedback":"Schütze personenbezogene Daten."}]}};
const moreAdvancedTranslations:Record<string,Record<"builder"|"strategist",readonly {task:string;choices:readonly string[];feedback:string}[]>> = {"it":{"builder":[{"task":"La squadra prepara un poster scolastico. Come aiuta l’IA?","choices":["Propone slogan da controllare.","Giudica i compagni.","Chiede tutti i numeri di telefono."],"feedback":"Usa l’IA per idee, non per giudicare."},{"task":"Organizzi uno stand scolastico. Quale richiesta è migliore?","choices":["Fai qualcosa di fantastico.","Dimmi tutto.","Proponi tre stand sotto £10, con materiali e sicurezza."],"feedback":"Obiettivo e budget aiutano."},{"task":"Vendi 20 articoli a £3. Materiali £25. Utile prima di altre spese?","choices":["£60","£35","£85"],"feedback":"£60 meno £25 = £35."},{"task":"L’IA dice che un gioco va bene per tutti. Cosa fai?","choices":["Controlli età e fonti affidabili.","Ci credi subito.","Ripeti senza verificare."],"feedback":"Controlla le prove."},{"task":"Vuoi usare la foto di un amico. Prima cosa?","choices":["Caricarla senza chiedere.","Chiedere consenso e proteggere i dati.","Pubblicare l’indirizzo."],"feedback":"Il consenso è importante."}],"strategist":[{"task":"L’IA rifiuta candidati automaticamente. Quale tutela?","choices":["Lasciarla decidere da sola.","Eliminare i controlli.","Supervisione umana e verifica dei pregiudizi."],"feedback":"Serve responsabilità umana."},{"task":"Quale richiesta valuta un’idea d’impresa?","choices":["Confronta due borracce: costi, rischi e prove mancanti.","Dimmi l’idea migliore.","Garantisci il successo."],"feedback":"Rendi visibili ipotesi e incertezze."},{"task":"200 vendite a £5, costo variabile £3, costo fisso £250. Utile?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"L’IA inventa una recensione. Cosa fai?","choices":["La pubblichi come vera.","Cambi il nome.","Non la presenti come autentica."],"feedback":"Le recensioni false ingannano."},{"task":"Email dei clienti inserite in un’IA pubblica. Cosa fare?","choices":["Fermarsi e usare esempi anonimi.","Aggiungere telefoni.","Continuare."],"feedback":"Riduci l’esposizione dei dati."}]},"pt":{"builder":[{"task":"A equipa cria um cartaz escolar. Como ajuda a IA?","choices":["Sugere frases para verificar.","Julga os colegas.","Pede todos os telefones."],"feedback":"Usa IA para ideias, não para julgar."},{"task":"Planeias uma banca escolar. Qual pedido é melhor?","choices":["Faz algo incrível.","Diz-me tudo.","Sugere três bancas até £10, com materiais e segurança."],"feedback":"Objetivo e orçamento ajudam."},{"task":"Vendes 20 artigos a £3. Materiais custam £25. Lucro antes de outros custos?","choices":["£60","£35","£85"],"feedback":"£60 menos £25 = £35."},{"task":"A IA diz que um jogo serve para todos. O que fazes?","choices":["Verificas idades e fontes fiáveis.","Acreditas sem verificar.","Repetes sem provas."],"feedback":"Confirma as provas."},{"task":"Queres usar a foto de um amigo. Primeiro?","choices":["Envias sem perguntar.","Pedes autorização e proteges os dados.","Publicas a morada."],"feedback":"O consentimento protege as pessoas."}],"strategist":[{"task":"A IA rejeita candidatos automaticamente. Que proteção?","choices":["Deixar a IA decidir sozinha.","Eliminar verificações.","Supervisão humana e avaliação de preconceitos."],"feedback":"Decisões importantes precisam de supervisão."},{"task":"Que pedido avalia uma ideia de negócio?","choices":["Compara duas garrafas: custos, riscos e provas em falta.","Diz a melhor ideia.","Garante o sucesso."],"feedback":"Mostra pressupostos e incertezas."},{"task":"200 vendas a £5, custo variável £3, fixo £250. Lucro?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"A IA inventa uma avaliação positiva. O que fazes?","choices":["Publicas como real.","Mudas o nome.","Não a apresentas como verdadeira."],"feedback":"Avaliações falsas enganam."},{"task":"Emails de clientes numa IA pública. O que fazer?","choices":["Parar e usar exemplos anónimos.","Adicionar telefones.","Continuar."],"feedback":"Protege os dados pessoais."}]},"nl":{"builder":[{"task":"Je team maakt een schoolposter. Waarbij helpt AI?","choices":["Slogans bedenken die je controleert.","Klasgenoten beoordelen.","Iedereens telefoonnummer vragen."],"feedback":"AI helpt met ideeën, niet met oordelen."},{"task":"Je plant een schoolkraam. Welke opdracht is duidelijk?","choices":["Maak iets geweldigs.","Vertel alles.","Bedenk drie kramen onder £10, met materialen en veiligheid."],"feedback":"Doel en budget helpen."},{"task":"20 producten à £3, materiaal £25. Winst vóór andere kosten?","choices":["£60","£35","£85"],"feedback":"£60 omzet min £25 = £35."},{"task":"AI zegt dat een spel voor iedereen geschikt is. Wat doe je?","choices":["Leeftijdsadvies en bronnen controleren.","AI direct geloven.","Zonder bewijs herhalen."],"feedback":"Controleer betrouwbare bronnen."},{"task":"Je wilt een foto van een vriend gebruiken. Eerst?","choices":["Zonder vragen uploaden.","Toestemming vragen en gegevens beschermen.","Het adres publiceren."],"feedback":"Toestemming beschermt privacy."}],"strategist":[{"task":"AI wijst sollicitanten automatisch af. Welke bescherming?","choices":["AI geheim laten beslissen.","Toezicht schrappen.","Menselijk toezicht en controle op vooroordelen."],"feedback":"Belangrijke beslissingen vragen toezicht."},{"task":"Welke opdracht beoordeelt een bedrijfsplan?","choices":["Vergelijk twee drinkflessen: kosten, risico's en ontbrekend bewijs.","Geef het beste idee.","Garandeer succes."],"feedback":"Maak aannames en onzekerheid zichtbaar."},{"task":"200 verkopen à £5, variabele kosten £3, vaste kosten £250. Winst?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"AI verzint een positieve review. Wat doe je?","choices":["Als echt publiceren.","Naam veranderen.","Niet als echte beoordeling tonen."],"feedback":"Nepreviews misleiden."},{"task":"Klantmails in openbare AI ingevoerd. Wat nu?","choices":["Stoppen en anonieme voorbeelden gebruiken.","Telefoonnummers toevoegen.","Doorgaan."],"feedback":"Beperk persoonsgegevens."}]},"pl":{"builder":[{"task":"Zespół tworzy plakat szkolny. Jak pomoże AI?","choices":["Zaproponuje hasła do sprawdzenia.","Oceni inteligencję kolegów.","Zbierze numery telefonów."],"feedback":"AI pomaga tworzyć pomysły, nie oceniać ludzi."},{"task":"Planujesz stoisko szkolne. Które polecenie jest jasne?","choices":["Zrób coś świetnego.","Powiedz wszystko.","Podaj trzy stoiska poniżej £10, z materiałami i zasadami bezpieczeństwa."],"feedback":"Cel i budżet ułatwiają ocenę."},{"task":"20 produktów po £3, materiały £25. Zysk przed innymi kosztami?","choices":["£60","£35","£85"],"feedback":"£60 przychodu minus £25 = £35."},{"task":"AI twierdzi, że gra pasuje wszystkim. Co robisz?","choices":["Sprawdzasz wiek i wiarygodne źródła.","Wierzysz bez sprawdzania.","Powtarzasz bez dowodów."],"feedback":"Sprawdzaj niezależne dowody."},{"task":"Chcesz użyć zdjęcia kolegi. Najpierw?","choices":["Przesyłasz bez pytania.","Pytasz o zgodę i chronisz dane.","Publikujesz adres."],"feedback":"Zgoda chroni prywatność."}],"strategist":[{"task":"AI automatycznie odrzuca kandydatów. Co jest potrzebne?","choices":["Tajne decyzje AI.","Brak kontroli.","Nadzór człowieka i kontrola uprzedzeń."],"feedback":"Ważne decyzje wymagają nadzoru."},{"task":"Które polecenie pomaga ocenić pomysł biznesowy?","choices":["Porównaj dwie butelki: koszty, ryzyko i brakujące dowody.","Podaj najlepszy pomysł.","Zagwarantuj sukces."],"feedback":"Ujawnij założenia i niepewność."},{"task":"200 sprzedaży po £5, koszt zmienny £3, stały £250. Zysk?","choices":["£750","£150","£400"],"feedback":"200 × (£5 − £3) − £250 = £150."},{"task":"AI wymyśla pozytywną opinię. Co robisz?","choices":["Publikujesz jako prawdziwą.","Zmieniasz imię.","Nie udajesz, że to prawdziwa opinia."],"feedback":"Fałszywe opinie wprowadzają w błąd."},{"task":"Adresy email klientów trafiają do publicznej AI. Co robić?","choices":["Przerwać i używać anonimowych przykładów.","Dodać telefony.","Kontynuować."],"feedback":"Ograniczaj dane osobowe."}]}};
const ui:Record<string,[string,string,string,string,string,string,string,string]> = {
  en:["AI Quest","Five missions about using AI responsibly","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Try another answer","Mission complete","Next mission"],
  ro:["AI Quest","Cinci misiuni despre folosirea responsabilă a AI","Explorer (6–8 ani)","Builder (9–11 ani)","Strategist (12–14 ani)","Încearcă alt răspuns","Misiune finalizată","Misiunea următoare"],
  es:["AI Quest","Cinco misiones para usar la IA de forma responsable","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Prueba otra respuesta","Misión completada","Siguiente misión"],
  fr:["AI Quest","Cinq missions pour utiliser l’IA de manière responsable","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Essaie une autre réponse","Mission terminée","Mission suivante"],
  de:["AI Quest","Fünf Missionen zum verantwortungsvollen Umgang mit KI","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Versuche eine andere Antwort","Mission geschafft","Nächste Mission"],
  it:["AI Quest","Cinque missioni per usare l'IA in modo responsabile","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Riprova","Missione completata","Missione successiva"],
  pt:["AI Quest","Cinco missões para usar a IA com responsabilidade","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Tenta outra resposta","Missão concluída","Próxima missão"],
  nl:["AI Quest","Vijf missies om verantwoord met AI om te gaan","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Probeer een ander antwoord","Missie voltooid","Volgende missie"],
  pl:["AI Quest","Pięć misji o odpowiedzialnym korzystaniu z AI","Explorer (6–8)","Builder (9–11)","Strategist (12–14)","Spróbuj ponownie","Misja ukończona","Następna misja"]
};
const key=AI_QUEST_STORAGE_KEY;
export default function AIQuestPage(){
 const locale=useLocale();const labels=ui[locale]??ui.en;
 const [band,setBand]=useState<Band>("explorer");const [index,setIndex]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [completed,setCompleted]=useState<Record<Band,number[]>>({explorer:[],builder:[],strategist:[]});
 const [loaded,setLoaded]=useState(false);
 const [speechAvailable,setSpeechAvailable]=useState(false);
 useEffect(()=>{setSpeechAvailable(typeof window!=="undefined"&&"speechSynthesis" in window);const read=()=>{try{const raw=localStorage.getItem(key);setCompleted(parseAIQuestProgress(raw?JSON.parse(raw):null))}catch{setCompleted(parseAIQuestProgress(null))}};read();setLoaded(true);const sync=(event:StorageEvent)=>{if(event.key===key||event.key===null)read()};window.addEventListener("storage",sync);return()=>{window.removeEventListener("storage",sync);window.speechSynthesis?.cancel()}},[]);
 const unit=units[index]!;const translated=locale==="ro"?(romanian[index]??unit):(explorerTranslations[locale]?.[index]??unit);const activity=band==="explorer"?unit:(locale==="ro"?{...advanced[band][index]!,...advancedRomanian[band][index]!}:{...advanced[band][index]!,...(advancedTranslations[locale]?.[band]?.[index]??moreAdvancedTranslations[locale]?.[band]?.[index]??{})});const correct=selected===activity.correct;
 function speak(){if(typeof window==="undefined"||!("speechSynthesis" in window))return;try{window.speechSynthesis.cancel();const words=[translated.title,translated.concept,band==="explorer"?translated.task:activity.task,...(band==="explorer"?translated.choices:activity.choices)].join(". ");const utterance=new SpeechSynthesisUtterance(words);utterance.lang=({en:"en-GB",ro:"ro-RO",es:"es-ES",fr:"fr-FR",de:"de-DE",it:"it-IT",pt:"pt-PT",nl:"nl-NL",pl:"pl-PL"} as Record<string,string>)[locale]??"en-GB";utterance.rate=0.85;window.speechSynthesis.speak(utterance)}catch{setSpeechAvailable(false)}}
 function finish(){if(!loaded||!correct)return;let latest=completed;try{const raw=localStorage.getItem(key);if(raw)latest=parseAIQuestProgress(JSON.parse(raw))}catch{}const next=completeAIMission(latest,band,index);setCompleted(next);try{localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new CustomEvent("moneyquest-ai-quest-progress",{detail:{band,completedMissionIds:next[band]}}))}catch{}}
 return <main id="main-content" className="mx-auto max-w-3xl px-sm py-xl text-ink">
  <Link href="/play" className="text-teal-text underline">← Money Quest</Link>
  <h1 className="mt-md font-display text-3xl font-bold">{labels[0]}</h1><p className="mt-2 text-ink/75">{labels[1]}</p>
  <div className="mt-md flex flex-wrap gap-2" role="group" aria-label={({en:"Age level",ro:"Nivel de vârstă",es:"Nivel de edad",fr:"Tranche d’âge",de:"Altersstufe",it:"Fascia d’età",pt:"Faixa etária",nl:"Leeftijdsniveau",pl:"Poziom wiekowy"} as Record<string,string>)[locale]??"Age level"}>{(["explorer","builder","strategist"] as const).map((b,i)=><button type="button" key={b} aria-pressed={band===b} onClick={()=>{setBand(b);setSelected(null)}} className={`rounded-xl border px-3 py-3 font-bold ${band===b?"bg-teal text-white":"bg-white text-ink"}`}>{labels[i+2]}</button>)}</div>
  <div className="mt-lg grid grid-cols-5 gap-2" aria-label={({en:"Mission progress",ro:"Progresul misiunilor",es:"Progreso de misiones",fr:"Progression des missions",de:"Missionsfortschritt",it:"Progresso missioni",pt:"Progresso das missões",nl:"Missievoortgang",pl:"Postęp misji"} as Record<string,string>)[locale]??"Mission progress"}>{units.map((u,i)=><button key={u.title} type="button" onClick={()=>{setIndex(i);setSelected(null)}} aria-current={index===i?"step":undefined} className={`min-h-12 rounded-lg border font-bold ${index===i?"border-teal bg-cream":"bg-white"}`}>{completed[band].includes(i)?"✓":i+1}</button>)}</div>
  <article className="mt-md rounded-2xl border border-teal/20 bg-white p-md">
    <p className="text-sm text-ink/70">{index+1} / {units.length}</p><h2 className="mt-2 font-display text-2xl font-bold">{translated.title}</h2>
    <p className="mt-sm">{translated.concept}</p>
    <p className="mt-sm">{band==="explorer"?translated.task:activity.task}</p>
    <button type="button" onClick={speak} disabled={!speechAvailable} className="mt-3 min-h-12 rounded-xl border border-teal px-4 py-2 font-bold text-teal-text">🔊 {({en:"Listen",ro:"Ascultă",es:"Escuchar",fr:"Écouter",de:"Anhören",it:"Ascolta",pt:"Ouvir",nl:"Luisteren",pl:"Posłuchaj"} as Record<string,string>)[locale]??"Listen"}</button>
    <div className="mt-md grid gap-3">{(band==="explorer"?translated.choices:activity.choices).map((choice,i)=><button type="button" key={choice} disabled={!loaded||correct} onClick={()=>setSelected(i)} className={`min-h-14 rounded-xl border-2 p-3 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal ${selected===i?"border-teal bg-cream":"border-ink/20 bg-white"}`}>{band==="explorer"&&<span aria-hidden="true" className="mr-3 text-2xl">{explorerIcons[index]?.[i]}</span>}{choice}</button>)}</div>
    {loaded&&selected!==null&&<div role="status" aria-live="polite" className="mt-md rounded-xl bg-cream p-4"><p>{correct?(band==="explorer"?translated.feedback:activity.feedback):labels[5]}</p>{correct&&<button type="button" onClick={()=>{finish();if(index<units.length-1){setIndex(index+1);setSelected(null)}}} className="mt-3 min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white">{index<units.length-1?labels[7]:labels[6]}</button>}</div>}
  </article>
  {completed[band].length===units.length&&<p role="status" className="mt-md rounded-xl bg-cream p-4 font-bold">✓ {labels[6]}: 5 / 5</p>}
  <p className="mt-md text-sm text-ink/70">{({en:"No AI API, account, personal data submission or real money is required.",ro:"Nu ai nevoie de cont, API AI, date personale sau bani reali.",es:"No necesitas cuenta, API de IA, datos personales ni dinero real.",fr:"Aucun compte, service IA, donnée personnelle ou argent réel n’est nécessaire.",de:"Kein Konto, KI-Dienst, persönliche Daten oder echtes Geld nötig.",it:"Non servono account, API IA, dati personali o denaro reale.",pt:"Não precisas de conta, API de IA, dados pessoais ou dinheiro real.",nl:"Geen account, AI-dienst, persoonsgegevens of echt geld nodig.",pl:"Nie potrzebujesz konta, usługi AI, danych osobowych ani prawdziwych pieniędzy."} as Record<string,string>)[locale]}</p>
 </main>;
}
