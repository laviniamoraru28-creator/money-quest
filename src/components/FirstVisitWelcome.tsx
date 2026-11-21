"use client";

import {useState} from "react";
import {useLocale} from "next-intl";
import {isSupportedLocale} from "@/i18n/config";
import type {Locale} from "@/i18n/config";

type Copy = {heading: string; message: string; safe: string; continue: string; skip: string};
export const INTRO_COPY: Record<Locale, Copy> = {
 en: {heading:"Welcome to Money Quest!",message:"Explore, make choices and discover how money works.",safe:"The money here is pretend. Mistakes help you learn.",continue:"Choose my level",skip:"Skip introduction"},
 ro: {heading:"Bine ai venit la Money Quest!",message:"Explorează, ia decizii și descoperă cum funcționează banii.",safe:"Aici folosim bani de joc. Greșelile te ajută să înveți.",continue:"Aleg nivelul",skip:"Sari peste introducere"},
 es: {heading:"¡Bienvenido a Money Quest!",message:"Explora, toma decisiones y descubre cómo funciona el dinero.",safe:"Aquí el dinero es ficticio. Los errores te ayudan a aprender.",continue:"Elegir mi nivel",skip:"Saltar introducción"},
 fr: {heading:"Bienvenue dans Money Quest !",message:"Explore, fais des choix et découvre comment fonctionne l'argent.",safe:"Ici, l'argent est fictif. Les erreurs t'aident à apprendre.",continue:"Choisir mon niveau",skip:"Passer l'introduction"},
 de: {heading:"Willkommen bei Money Quest!",message:"Entdecke, entscheide und lerne, wie Geld funktioniert.",safe:"Hier ist das Geld nur Spielgeld. Aus Fehlern lernst du.",continue:"Mein Level wählen",skip:"Einführung überspringen"},
 it: {heading:"Benvenuto in Money Quest!",message:"Esplora, fai delle scelte e scopri come funziona il denaro.",safe:"Qui il denaro è finto. Gli errori ti aiutano a imparare.",continue:"Scegli il livello",skip:"Salta l'introduzione"},
 pt: {heading:"Boas-vindas ao Money Quest!",message:"Explora, faz escolhas e descobre como funciona o dinheiro.",safe:"Aqui o dinheiro é de brincar. Os erros ajudam-te a aprender.",continue:"Escolher nível",skip:"Saltar introdução"},
 nl: {heading:"Welkom bij Money Quest!",message:"Ontdek, maak keuzes en leer hoe geld werkt.",safe:"Het geld hier is nep. Van fouten kun je leren.",continue:"Kies mijn niveau",skip:"Introductie overslaan"},
 pl: {heading:"Witaj w Money Quest!",message:"Odkrywaj, podejmuj decyzje i poznawaj świat pieniędzy.",safe:"Tutaj pieniądze są na niby. Błędy pomagają się uczyć.",continue:"Wybierz poziom",skip:"Pomiń wprowadzenie"}
};

export function FirstVisitWelcome() {
 const locale = useLocale();
 const copy = INTRO_COPY[isSupportedLocale(locale) ? locale : "en"];
 const [dismissed, setDismissed] = useState(false);
 if (dismissed) return null;
 return (
  <section aria-labelledby="first-visit-heading" className="mb-md rounded-2xl border-2 border-teal/30 bg-white p-md text-left shadow-resting">
   <h2 id="first-visit-heading" className="font-display text-xl font-bold text-teal-text">{copy.heading}</h2>
   <p className="mt-2 text-base">{copy.message}</p>
   <p className="mt-2 rounded-lg bg-cream p-3 text-base">{copy.safe}</p>
   <div className="mt-sm flex flex-wrap gap-3">
    <button type="button" onClick={() => {setDismissed(true); document.getElementById("level-choices")?.focus();}}
     className="min-h-12 rounded-xl bg-teal px-5 py-3 font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">{copy.continue}</button>
    <button type="button" onClick={() => setDismissed(true)}
     className="min-h-12 rounded-xl border border-teal px-5 py-3 font-medium text-teal-text focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">{copy.skip}</button>
   </div>
  </section>
 );
}
