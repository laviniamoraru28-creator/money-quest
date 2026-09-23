/**
 * Structural (English-only, not translated) mapping from a canonical
 * lesson id to its printable worksheet PDF, mirroring how
 * curriculum/structures.ts separates structural data from translated
 * text. Worksheets are a standalone printable resource — deliberately
 * NOT part of the 9-language translation system (see
 * public/worksheets/README.txt) — so this file lives outside
 * messages/*.json on purpose. Only the 20 lessons listed here have a
 * worksheet; every other lesson simply isn't in this map, and pages
 * should check for that (no worksheet button shown) rather than
 * guessing or falling back.
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
