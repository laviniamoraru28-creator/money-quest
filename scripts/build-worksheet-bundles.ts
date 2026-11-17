// Builds the "Download All/Explorer/Builder/Strategist Worksheets" ZIPs for
// the Printable Resources page, one set per locale, as static files next to
// the worksheets they bundle. Must run after generate-localized-worksheets.py
// (which produces public/worksheets/{locale}/*.pdf) and before `next build`,
// so the ZIPs end up as ordinary static assets Next.js just serves — no
// runtime zip dependency, and no reliance on a `zip` binary being present on
// the actual Namecheap host, only in this build step.
import {existsSync, mkdtempSync, rmSync, mkdirSync, copyFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {LESSON_WORKSHEETS, type WorksheetBand} from "../src/content/worksheets";
import {LOCALES} from "../src/i18n/config";

const root = process.cwd();
const BANDS: WorksheetBand[] = ["explorer", "builder", "strategist"];
const BAND_FOLDER: Record<WorksheetBand, string> = {explorer: "Explorer", builder: "Builder", strategist: "Strategist"};

function filenamesForBand(band: WorksheetBand): string[] {
  return Object.entries(LESSON_WORKSHEETS)
    .filter(([lessonId]) => lessonId.startsWith(band + "-"))
    .map(([, filename]) => filename);
}

function zipDirectory(stageDir: string, zipPath: string) {
  rmSync(zipPath, {force: true});
  execFileSync("zip", ["-q", "-r", zipPath, "."], {cwd: stageDir});
}

for (const locale of LOCALES) {
  const localeDir = path.join(root, "public/worksheets", locale);
  if (!existsSync(localeDir)) {
    console.error(`::error::public/worksheets/${locale} is missing — run generate-localized-worksheets.py first`);
    process.exit(1);
  }
  const answerKey = path.join(localeDir, "money-quest-worksheets-answer-key.pdf");

  // One combined ZIP, worksheets organised into Explorer/Builder/Strategist folders.
  const stageAll = mkdtempSync(path.join(tmpdir(), "mq-worksheets-all-"));
  for (const band of BANDS) {
    const bandDir = path.join(stageAll, BAND_FOLDER[band]);
    mkdirSync(bandDir, {recursive: true});
    for (const filename of filenamesForBand(band)) {
      copyFileSync(path.join(localeDir, filename), path.join(bandDir, filename));
    }
  }
  copyFileSync(answerKey, path.join(stageAll, "money-quest-worksheets-answer-key.pdf"));
  zipDirectory(stageAll, path.join(localeDir, "all-worksheets.zip"));
  rmSync(stageAll, {recursive: true, force: true});

  // One ZIP per band, flat (already scoped to one age level, no subfolder needed).
  for (const band of BANDS) {
    const stageBand = mkdtempSync(path.join(tmpdir(), `mq-worksheets-${band}-`));
    for (const filename of filenamesForBand(band)) {
      copyFileSync(path.join(localeDir, filename), path.join(stageBand, filename));
    }
    copyFileSync(answerKey, path.join(stageBand, "money-quest-worksheets-answer-key.pdf"));
    zipDirectory(stageBand, path.join(localeDir, `${band}-worksheets.zip`));
    rmSync(stageBand, {recursive: true, force: true});
  }
}

console.log(`Built worksheet bundle ZIPs (all + 3 age bands) for ${LOCALES.length} locales.`);
