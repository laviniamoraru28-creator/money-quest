import type { Locale } from "@/i18n/config";

/**
 * Shared copy for the guided-journey "Continue" button, reused by
 * every section along the educational nav order (see
 * src/lib/navigation/next-educational-section.ts for the order
 * itself). Two variants:
 *  - "continueTo": a real completion was reached (a certificate, a
 *    finished quest, a finished scenario) — the child earned this.
 *  - "continueExploringTo": the section is open-ended (a reading
 *    collection, a sandbox, a relaxation activity) and has no
 *    "finish" state to earn — the button is just an optional next
 *    step, never gated on anything.
 * `{section}` is replaced with the real next section's own
 * translated nav-menu label at render time.
 */
export interface JourneyCopy {
  continueTo: string;
  continueToAria: string;
  continueExploringTo: string;
  continueExploringToAria: string;
}

export const journeyCopy: Record<Locale, JourneyCopy> = {
  en: {
    continueTo: "Continue to {section} →",
    continueToAria: "Continue to the next section: {section}",
    continueExploringTo: "Continue exploring: {section} →",
    continueExploringToAria: "Continue exploring the next section: {section}",
  },
  ro: {
    continueTo: "Continuă către {section} →",
    continueToAria: "Continuă către următoarea secțiune: {section}",
    continueExploringTo: "Continuă să explorezi: {section} →",
    continueExploringToAria: "Continuă să explorezi următoarea secțiune: {section}",
  },
  es: {
    continueTo: "Continuar a {section} →",
    continueToAria: "Continuar a la siguiente sección: {section}",
    continueExploringTo: "Sigue explorando: {section} →",
    continueExploringToAria: "Sigue explorando la siguiente sección: {section}",
  },
  fr: {
    continueTo: "Continuer vers {section} →",
    continueToAria: "Continuer vers la section suivante : {section}",
    continueExploringTo: "Continuer à explorer : {section} →",
    continueExploringToAria: "Continuer à explorer la section suivante : {section}",
  },
  de: {
    continueTo: "Weiter zu {section} →",
    continueToAria: "Weiter zum nächsten Abschnitt: {section}",
    continueExploringTo: "Weiter entdecken: {section} →",
    continueExploringToAria: "Weiter entdecken im nächsten Abschnitt: {section}",
  },
  it: {
    continueTo: "Continua con {section} →",
    continueToAria: "Continua alla sezione successiva: {section}",
    continueExploringTo: "Continua a esplorare: {section} →",
    continueExploringToAria: "Continua a esplorare la sezione successiva: {section}",
  },
  pt: {
    continueTo: "Continuar para {section} →",
    continueToAria: "Continuar para a próxima secção: {section}",
    continueExploringTo: "Continuar a explorar: {section} →",
    continueExploringToAria: "Continuar a explorar a próxima secção: {section}",
  },
  nl: {
    continueTo: "Verder naar {section} →",
    continueToAria: "Verder naar het volgende onderdeel: {section}",
    continueExploringTo: "Blijf ontdekken: {section} →",
    continueExploringToAria: "Blijf ontdekken in het volgende onderdeel: {section}",
  },
  pl: {
    continueTo: "Przejdź do {section} →",
    continueToAria: "Przejdź do następnej sekcji: {section}",
    continueExploringTo: "Odkrywaj dalej: {section} →",
    continueExploringToAria: "Odkrywaj dalej następną sekcję: {section}",
  },
};
