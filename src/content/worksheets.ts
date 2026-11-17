/** Canonical lesson-to-filename mapping. Build generates all nine
 * language editions from each locale's own lesson text, as the first
 * step of `npm run build` (scripts/generate-localized-worksheets.py),
 * into public/worksheets/{locale}/ — build output, not committed to
 * git, same as .next/ itself; it won't exist in an unbuilt checkout.
 * The flat public/worksheets/*.pdf files (no locale folder) are an
 * older, English-only generation kept only so links made before the
 * per-locale rebuild don't break. Only these twenty lessons have
 * worksheets; other lessons must not guess a download path.
 */
export const LESSON_WORKSHEETS: Record<string, string> = {
  "explorer-money_basics-l1": "01-what-is-money.pdf",
  "builder-money_basics-l1": "02-where-does-money-come-from.pdf",
  "explorer-saving-l1": "03-what-does-saving-mean.pdf",
  "builder-saving-l1": "04-saving-for-something-bigger.pdf",
  "strategist-saving-l1": "05-saving-vs-spending.pdf",
  "strategist-currencies-l1": "06-understanding-exchange-rates.pdf",
  "explorer-scams-l1": "07-some-promises-are-too-good.pdf",
  "builder-scams-l1": "08-spotting-a-scam.pdf",
  "strategist-scams-l1": "09-scams-target-emotions.pdf",
  "builder-giving-l1": "10-giving-on-purpose.pdf",
  "explorer-digital_money-l1": "11-money-you-cant-hold.pdf",
  "builder-digital_money-l1": "12-how-a-card-payment-works.pdf",
  "strategist-digital_money-l1": "13-staying-safe-with-digital-money.pdf",
  "explorer-investing_basics-l1": "14-saving-vs-growing-your-money.pdf",
  "builder-investing_basics-l1": "15-owning-a-small-piece-of-a-company.pdf",
  "builder-junior_isa-l1": "16-locked-until-18-junior-isa.pdf",
  "strategist-junior_isa-l1": "17-junior-isa-milestones.pdf",
  "explorer-needs_wants-l1": "18-need-it-or-want-it.pdf",
  "builder-needs_wants-l1": "19-the-grey-area.pdf",
  "strategist-needs_wants-l1": "20-needs-wants-social-pressure.pdf",
};

export function getWorksheetFilename(lessonId: string): string | undefined {
  return LESSON_WORKSHEETS[lessonId];
}

export type WorksheetBand = "explorer" | "builder" | "strategist";

export interface WorksheetEntry {
  lessonId: string;
  filename: string;
  band: WorksheetBand;
}

/** The single source of truth the Printable Resources page and the
 * per-lesson worksheet button both read from — adding, renaming or
 * removing an entry in LESSON_WORKSHEETS above changes both places at
 * once, by construction, rather than needing two lists kept in sync. */
export function listAllWorksheets(): WorksheetEntry[] {
  return Object.entries(LESSON_WORKSHEETS).map(([lessonId, filename]) => ({
    lessonId,
    filename,
    band: lessonId.split("-")[0] as WorksheetBand,
  }));
}
