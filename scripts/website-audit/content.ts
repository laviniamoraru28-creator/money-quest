import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {EXPLORER_COMIC_TOPICS} from '../../src/content/explorer-comic-topics';
import {GAME_STRUCTURES} from '../../src/game-engine/structures';
import {LOCALES} from '../../src/i18n/config';
import type {LocalizedLessonText} from '../../src/content/curriculum/localized-types';
import type {LocalizedGameText} from '../../src/game-engine/localized-types';
import {buildGameConfigFromStructure} from '../../src/game-engine/build-config';

type Finding = {id: string; locale: string; route: string; severity: string; title: string; correction: string};
type Catalogue = {curriculum: Record<string, LocalizedLessonText>; games: Record<string, LocalizedGameText>};
const findings: Finding[] = [];
const skipped: string[] = [];
const normalize = (value: string) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
const english = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Catalogue;
const comicHashes = new Map<string, string>();
let comicFilesChecked = 0;
const comicRoot = 'public/images/money-quest/lessons/comics';
const localizedComicsPresent = LOCALES.some(locale => locale !== 'en' &&
  EXPLORER_COMIC_TOPICS.some(topic => existsSync(`${comicRoot}/${locale}/${topic}.webp`)));

for (const locale of LOCALES) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Catalogue;
  const questions = new Map<string, string>();
  const activities = new Map<string, string>();

  for (const lesson of LESSON_STRUCTURES) {
    const route = `/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`;
    const copy = messages.curriculum[lesson.id];
    if (!copy) {
      findings.push({id: `missing:${lesson.id}`, locale, route, severity: 'High',
        title: 'Lesson text is missing', correction: 'Add the localized lesson entry and check that it renders.'});
      continue;
    }
    for (const [key, text, seen] of [
      ['question', copy.quiz?.question, questions],
      ['activity', copy.interactiveActivity, activities],
    ] as const) {
      if (!text?.trim()) continue; // Missing fields are covered by the existing lesson validators.
      const value = `${lesson.ageBand}:${normalize(text)}`;
      const previous = seen.get(value);
      if (previous) findings.push({id: `duplicate:${key}:${lesson.id}:${previous}`, locale, route, severity: 'Low',
        title: `Possible repeated ${key} from ${previous}`, correction: 'Compare both lessons and confirm whether the repetition is intentional.'});
      else seen.set(value, lesson.id);
    }
    if (locale !== 'en' && [copy.title, copy.learningObjective, copy.quiz?.question].some((text, index) => {
      const source = english.curriculum[lesson.id];
      const original = [source?.title, source?.learningObjective, source?.quiz?.question][index];
      return text && original && text.length >= 35 && normalize(text) === normalize(original);
    })) findings.push({id: `english:${lesson.id}`, locale, route, severity: 'Medium',
      title: 'Long lesson text matches English exactly', correction: 'Review the title, learning objective and quiz prompt in this language.'});
  }

  for (const structure of GAME_STRUCTURES) {
    const world = `/${locale}/play/world/${structure.worldId}`;
    try {
      const game = buildGameConfigFromStructure(structure, messages.games[structure.key]!);
      for (const {ageBand, difficulty, rounds} of game.variants) {
        const seen = new Set<string>();
        const route = `${world}/game/game-${ageBand}-${structure.key}`;
        for (const round of rounds) {
          const base = {locale, route, id: `game:${structure.key}:${ageBand}:${difficulty}:${round.id}`};
          const prompt = normalize(round.prompt);
          if (seen.has(prompt)) findings.push({...base, id: `repeat:${base.id}`, severity: 'Low',
            title: `Repeated question in ${game.title} (${ageBand}, ${difficulty}, ${round.id})`,
            correction: 'Check whether the repeated prompt is intentional given the answer choices.'});
          seen.add(prompt);
          const valid = round.mechanic === 'multiple-choice'
            ? round.options.filter(option => option === round.correctOption).length === 1 &&
              round.options.length >= 2 && round.options.every(option => option.trim()) &&
              new Set(round.options.map(normalize)).size === round.options.length
            : round.mechanic === 'compare'
              ? round.options.length >= 2 &&
                round.options.filter(option => option.key === round.correctOptionKey).length === 1 &&
                round.options.every(option => option.label.trim()) &&
                new Set(round.options.map(option => option.key)).size === round.options.length
              : true;
          if (!valid) findings.push({...base, severity: 'High',
            title: `Invalid answer choices in ${game.title} (${ageBand}, ${difficulty}, ${round.id})`,
            correction: 'Restore unique choices and verify that exactly one matches the configured answer.'});
        }
      }
    } catch (error) {
      findings.push({id: `game-config:${structure.key}`, locale, route: world, severity: 'High',
        title: `Game content could not load: ${String(error)}`, correction: 'Check the game text and age variants in the locale catalogue.'});
    }
  }

  const folder = `${comicRoot}${locale === 'en' ? '' : `/${locale}`}`;
  const missing: string[] = [];
  for (const topic of EXPLORER_COMIC_TOPICS) {
    const lesson = LESSON_STRUCTURES.find(item => item.ageBand === 'explorer' && item.topicId === topic)!;
    const route = `/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`;
    const file = `${folder}/${topic}.webp`;
    if (!existsSync(file)) {
      if (locale === 'en' || localizedComicsPresent) {
        findings.push({id: `comic-missing:${topic}`, locale, route, severity: 'High',
          title: 'Expected Explorer comic asset is missing', correction: `Restore the correct lesson and language image at ${file}.`});
      } else {
        missing.push(topic);
      }
      continue;
    }
    comicFilesChecked++;
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
    const previous = comicHashes.get(hash);
    if (previous) findings.push({id: `comic-duplicate:${topic}`, locale, route, severity: 'High',
      title: `Comic file is identical to ${previous}`, correction: 'Compare the panels with the intended lesson and language, then correct the file assignment.'});
    else comicHashes.set(hash, `${locale}/${topic}`);
  }
  if (missing.length) skipped.push(`${locale}: ${missing.length} Explorer comic assets unavailable in this checkout (${missing.join(', ')}). The localized Explorer images and browser checks are tracked in PR #58.`);
}

writeFileSync(process.argv[2] ?? 'content.json', JSON.stringify({findings, skipped, comicFilesChecked}, null, 2));
console.log(`Checked ${comicFilesChecked} comic files. Flagged ${findings.length} items for review.`);
