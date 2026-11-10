import type { Locale } from "@/i18n/config";

/**
 * Short, simple copy for the Explorer-band lab redesign (LearningLabExperience):
 * replaces the labs' own longer, reading-heavy feedback text (laboratory-copy.json's
 * "retry" is a full sentence meant for older readers) with pre-reader-appropriate
 * wording, matching the tone already used across the Explorer lesson redesign.
 */
type Fields = "listen" | "tryAgain" | "wellDone" | "next";
const fields: readonly Fields[] = ["listen", "tryAgain", "wellDone", "next"];

const rows: Record<Locale, string> = {
  en: "Listen|Try again|Well done!|Next",
  ro: "Ascultă|Mai încearcă|Bravo!|Următorul",
  es: "Escuchar|Inténtalo de nuevo|¡Muy bien!|Siguiente",
  fr: "Écouter|Réessaie|Bravo !|Suivant",
  de: "Anhören|Versuch es noch einmal|Super gemacht!|Weiter",
  it: "Ascolta|Riprova|Bravo!|Avanti",
  pt: "Ouvir|Tenta novamente|Muito bem!|Seguinte",
  nl: "Luisteren|Probeer opnieuw|Goed gedaan!|Volgende",
  pl: "Posłuchaj|Spróbuj ponownie|Brawo!|Dalej",
};

type Copy = Record<Fields, string>;
export const explorerLabCopy: Record<Locale, Copy> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => {
    const values = row.split("|");
    if (values.length !== fields.length) throw new Error(`explorer-lab-copy missing: ${locale}`);
    return [locale, Object.fromEntries(fields.map((field, i) => [field, values[i]]))];
  })
) as Record<Locale, Copy>;
