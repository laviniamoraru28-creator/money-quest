/**
 * Ad-hoc validator for a single locale's long-form content translation
 * drafts (original books + laboratories), run as:
 *   npx tsx scripts/validate-locale-content-draft.ts <locale>
 *
 * This mirrors the checks in test-content-translation-drafts.ts and
 * test-laboratory-translation-drafts.ts (which are hard-coded to "ro")
 * so a new locale's draft files can be self-checked before those
 * shared test files are generalized to loop over every locale.
 */
import {readFileSync, existsSync} from "node:fs";
import {originalBooks} from "../src/content/library";
import {learningLabs} from "../src/content/learning-labs";
import {labAgeVariants, labTaskAtLevel} from "../src/content/lab-age-variants";
import {
  bookTranslationSource, draftTranslatedBook,
  laboratoryTranslationSource, draftTranslatedLaboratory,
  assertTranslationShape,
} from "../src/lib/i18n/content-translations";

const locale = process.argv[2];
if (!locale) { console.error("Usage: npx tsx scripts/validate-locale-content-draft.ts <locale>"); process.exit(1); }

let failures = 0;
const fail = (msg: string) => { failures++; console.error(`FAIL: ${msg}`); };

// --- Books ---
const booksPath = `src/content/translations/books.${locale}.json`;
const booksSourcesPath = `src/content/translations/books.${locale}.sources.json`;
if (!existsSync(booksPath)) fail(`Missing ${booksPath}`);
else if (!existsSync(booksSourcesPath)) fail(`Missing ${booksSourcesPath}`);
else {
  const bookTranslations = JSON.parse(readFileSync(booksPath, "utf8"));
  const bookManifest = JSON.parse(readFileSync(booksSourcesPath, "utf8"));
  const expectedSlugs = originalBooks.map(b => b.slug).sort();
  const gotSlugs = Object.keys(bookTranslations).sort();
  if (JSON.stringify(expectedSlugs) !== JSON.stringify(gotSlugs)) {
    fail(`books.${locale}.json slugs mismatch.\n  expected: ${expectedSlugs}\n  got: ${gotSlugs}`);
  } else {
    let totalStrings = 0;
    for (const book of originalBooks) {
      try {
        totalStrings += assertTranslationShape(bookTranslationSource(book), bookTranslations[book.slug], book.slug);
        const translated = draftTranslatedBook(book, bookTranslations[book.slug], bookManifest.sources[book.slug]);
        if (translated.cover !== book.cover) fail(`${book.slug}: cover path changed`);
        if (translated.title === book.title) fail(`${book.slug}: title not translated (identical to English)`);
        if (translated.chapters.length !== book.chapters.length) fail(`${book.slug}: chapter count mismatch`);
        book.chapters.forEach((chapter, index) => {
          const next = translated.chapters[index]!;
          if (next.paragraphs.length !== chapter.paragraphs.length) fail(`${book.slug} ch${index}: paragraph count mismatch`);
          const correctIdx = next.choices.findIndex(c => c.correct);
          const expectedIdx = chapter.choices.findIndex(c => c.correct);
          if (correctIdx !== expectedIdx) fail(`${book.slug} ch${index}: correct-answer position changed (${correctIdx} vs ${expectedIdx})`);
          const gotAmounts = JSON.stringify(next).match(/£[0-9]+/g);
          const wantAmounts = JSON.stringify(chapter).match(/£[0-9]+/g);
          if (JSON.stringify(gotAmounts) !== JSON.stringify(wantAmounts)) fail(`${book.slug} ch${index}: £ amounts changed (${gotAmounts} vs ${wantAmounts})`);
        });
      } catch (e) { fail(`${book.slug}: ${(e as Error).message}`); }
    }
    console.log(`books.${locale}: ${totalStrings} strings checked across ${originalBooks.length} books`);
  }
}

// --- Laboratories ---
const labsPath = `src/content/translations/laboratories.${locale}.json`;
if (!existsSync(labsPath)) fail(`Missing ${labsPath}`);
else {
  const translations = JSON.parse(readFileSync(labsPath, "utf8"));
  const manifest = JSON.parse(readFileSync("src/content/translations/laboratories.sources.json", "utf8"));
  const expectedSlugs = learningLabs.map(l => l.slug).sort();
  const gotSlugs = Object.keys(translations).sort();
  if (JSON.stringify(expectedSlugs) !== JSON.stringify(gotSlugs)) {
    fail(`laboratories.${locale}.json slugs mismatch.\n  expected: ${expectedSlugs}\n  got: ${gotSlugs}`);
  } else {
    let strings = 0, tasks = 0;
    for (const lab of learningLabs) {
      const source = laboratoryTranslationSource(lab, labAgeVariants);
      const copy = translations[lab.slug];
      try {
        strings += assertTranslationShape(source, copy, lab.slug);
        if (!manifest.sources[lab.slug]) { fail(`${lab.slug}: no source hash recorded for this locale in laboratories.sources.json yet (add it before final validation)`); continue; }
        const translated = draftTranslatedLaboratory(lab, labAgeVariants, copy, manifest.sources[lab.slug]);
        if (translated.lab.title === lab.title) fail(`${lab.slug}: title not translated`);
        if (translated.lab.description === lab.description) fail(`${lab.slug}: description not translated`);
        lab.tasks.forEach((task, index) => {
          tasks++;
          const result = translated.lab.tasks[index]!;
          if (result.id !== task.id) fail(`${lab.slug}/${task.id}: id changed`);
          if (result.correct !== task.correct) fail(`${lab.slug}/${task.id}: correct index changed`);
          if (result.tryIt.length !== 3 || new Set(result.tryIt).size !== 3) fail(`${lab.slug}/${task.id}: tryIt must have 3 distinct entries`);
          const levels = [0, 1, 2].map(level => labTaskAtLevel(lab.slug, result, level, translated.variants));
          if (new Set(levels.map(r => r.idea)).size !== 3) fail(`${lab.slug}/${task.id}: the 3 age levels must have distinct "idea" text`);
          if (new Set(levels.map(r => r.situation)).size !== 3) fail(`${lab.slug}/${task.id}: the 3 age levels must have distinct "situation" text`);
          for (const reading of levels) {
            if (reading.correct !== task.correct) fail(`${lab.slug}/${task.id}: an age reading changed the correct answer`);
            if (new Set(reading.choices).size !== 3) fail(`${lab.slug}/${task.id}: an age reading's 3 choices must be distinct`);
            if (reading.explanation.length <= 30) fail(`${lab.slug}/${task.id}: an age reading's explanation looks too short`);
          }
        });
      } catch (e) { fail(`${lab.slug}: ${(e as Error).message}`); }
    }
    console.log(`laboratories.${locale}: ${strings} strings, ${tasks} tasks checked (English has 490 strings, 22 tasks)`);
  }
}

// --- Prose sanity checks shared across both content groups ---
for (const path of [booksPath, labsPath]) {
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, "utf8");
  const text = JSON.stringify(JSON.parse(raw));
  if (text.normalize("NFC") !== text) fail(`${path}: not NFC-normalized Unicode`);
  if (/�/.test(text)) fail(`${path}: contains a Unicode replacement character (mangled encoding)`);
  const englishTells = /\b(remember|choose|trusted|situation|feedback|explanation|correct|allowance|pocket money)\b/gi;
  const hits = raw.match(englishTells);
  if (hits && hits.length > 0) console.warn(`WARN: ${path}: possible leftover English words: ${[...new Set(hits)].join(", ")} (double-check these are not false positives / loanwords)`);
}

if (failures > 0) { console.error(`\n${failures} FAILURE(S) for locale "${locale}"`); process.exit(1); }
console.log(`\nAll structural checks passed for locale "${locale}". (This does NOT certify translation quality or native-speaker accuracy.)`);
