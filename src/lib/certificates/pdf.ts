import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { certificateCopy, certificateCompetencies } from "@/content/certificate-copy";
import { REGIONAL_LOCALES, type Locale } from "@/i18n/config";
import type { AgeBand } from "@/types/database.types";

export type CertificateAssetLoader = (path: string) => Promise<Uint8Array>;
export const CERTIFICATE_ASSETS = "/certificates";
export function formatCertificateDate(timestamp: string | undefined, locale: Locale): string {
  // Use the persisted completion-day part, even if the family later changes time zone.
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return "";
  const day = timestamp.slice(0, 10);
  return new Intl.DateTimeFormat(REGIONAL_LOCALES[locale], {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}
const ages = {explorer: "6–8", builder: "9–11", strategist: "12–14"};
function wordWrap(value: string, width: number, actual: number, font: PDFFont): string[] {
  const result: string[] = []; let line = "";
  for (const word of value.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, actual) > width) { result.push(line); line = word; }
    else line = candidate;
  }
  if (line) result.push(line);
  return result;
}
/** Exported for its own regression test: finding the fewest lines (matching
 * the competency ribbon graphic's own height) before shrinking below a
 * readable floor, rather than accepting whatever the full-size font wraps
 * into. Pure/font-only, independent of the page it's eventually drawn on. */
export function fitLines(value: string, width: number, size: number, font: PDFFont, maxLines: number, floor = 7): {result: string[]; actual: number} {
  // A single word longer than `width` is still placed on its own line by
  // wordWrap (it can't be split further), so the line-count check alone
  // can accept a result whose line is actually too wide - confirmed with
  // the Dutch "Verantwoordelijkheid" ("Responsibility"), which passed at
  // full size purely because it never needed a 2nd line. Checking every
  // line's real width, not just how many lines there are, catches that.
  let best: {result: string[]; actual: number} | null = null;
  for (let lineBudget = Math.min(2, maxLines); lineBudget <= maxLines && !best; lineBudget++) {
    for (let actual = size; actual >= floor; actual -= 0.25) {
      const result = wordWrap(value, width, actual, font);
      if (result.length <= lineBudget && result.every((line) => font.widthOfTextAtSize(line, actual) <= width)) { best = {result, actual}; break; }
    }
  }
  return best ?? {result: wordWrap(value, width, floor, font), actual: floor};
}
/** Fully local PDF. The loader requests only static artwork/fonts; no progress/name is sent. */
export async function generateCertificatePdf(band: AgeBand, locale: Locale, timestamp: string | undefined, load: CertificateAssetLoader): Promise<Uint8Array> {
  const [art, serifBytes, sansBytes, signatureBytes] = await Promise.all([
    load(`${CERTIFICATE_ASSETS}/${band}-background.jpg`),
    load(`${CERTIFICATE_ASSETS}/fonts/DejaVuSerif.ttf`),
    load(`${CERTIFICATE_ASSETS}/fonts/DejaVuSans.ttf`),
    load(`${CERTIFICATE_ASSETS}/fonts/Allura-Regular.ttf`),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [serif, sans, signature, background] = await Promise.all([
    doc.embedFont(serifBytes, {subset: true}), doc.embedFont(sansBytes, {subset: true}),
    doc.embedFont(signatureBytes), doc.embedJpg(art),
  ]);
  doc.setTitle(`MONEY QUEST ACADEMY · ${certificateCopy[locale][band]}`);
  doc.setAuthor("Money Quest Education");
  doc.setSubject(certificateCopy[locale].title);
  doc.setLanguage(REGIONAL_LOCALES[locale]);
  // A4 landscape, with a 5 mm print-safe inset on every side. Do not crop the border.
  const page = doc.addPage([841.8898, 595.2756]);
  const scale = Math.min((page.getWidth() - 28.346) / 1536, (page.getHeight() - 28.346) / 1087);
  const left = (page.getWidth() - 1536 * scale) / 2;
  const top = (page.getHeight() - 1087 * scale) / 2;
  page.drawImage(background, {x:left, y:top, width:1536*scale, height:1087*scale});
  const navy = rgb(0.035,0.10,0.20), gold = rgb(0.40,0.30,0.14), cream = rgb(1,0.96,0.82);
  function text(value: string, cx: number, y: number, width: number, size: number, font: PDFFont = serif, color = navy) {
    let actual = size;
    while (font.widthOfTextAtSize(value, actual) > width && actual > 7) actual -= 0.25;
    page.drawText(value, {x:left+(cx-font.widthOfTextAtSize(value,actual)/2)*scale,
      y:page.getHeight()-top-y*scale, size:actual*scale, font, color});
  }
  function lines(value: string, cx:number, y:number, width:number, size:number, font:PDFFont = sans, color = navy, maxLines=2) {
    const best = fitLines(value, width, size, font, maxLines);
    best.result.forEach((line,i)=>text(line,cx,y+i*best.actual*1.2,width,best.actual,font,color));
  }
  const copy = certificateCopy[locale];
  text("MONEY QUEST ACADEMY",768,251,1000,57);
  text(copy.programme,768,308,1030,18,serif,gold);
  text(copy.title.toLocaleUpperCase(REGIONAL_LOCALES[locale]),768,414,1080,57,serif,navy);
  text(`${locale === "en" ? `${copy[band]} ${copy.level}` : `${copy.level}: ${copy[band]}`} (${ages[band]})`,768,503,500,27,serif,cream);
  // The large framed name field, y=540..678, deliberately contains no text.
  lines(copy.message,768,707,1080,20,serif,navy,1);
  // Width is deliberately narrower than the 166.5pt column spacing: the
  // ribbon graphic's own visible width varies a little between the three
  // backgrounds, and some translations (observed in Romanian, German and
  // Polish) need a 3rd line to stay inside it at a readable size. 104pt
  // leaves padding on every ribbon; allowing a 3rd line trades the ample
  // vertical room below this row (next content starts 109pt lower) for
  // horizontal room, instead of forcing an oversized single line.
  certificateCompetencies[band].forEach((key,i)=>lines(copy[key],350+i*166.5,875,104,11,sans,cream,3));
  text(formatCertificateDate(timestamp,locale),425,984,230,21,serif);
  text(copy.date,425,1021,230,14,sans);
  text("Money Quest",1094,984,245,49,signature);
  text(copy.signature,1094,1021,235,14,sans);
  return doc.save();
}
