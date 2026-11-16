import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, isAbsolute, relative, resolve, sep} from 'node:path';

const dir = resolve(process.argv[2] ?? 'test-results/audit');
const previousFile = process.argv[3];
mkdirSync(dir, {recursive: true});
const read = path => path && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const previous = read(previousFile);
const broad = process.env.WEBSITE_AUDIT_PROFILE === 'broad';
const groups = ['chromium', 'safari', 'tablet'];
const stageNames = {setup: 'Dependency installation', browsers: 'Browser installation', lint: 'Lint', types: 'TypeScript', unit: 'Unit suites', certificates: 'Certificate PDFs',
  build: 'Production build', package: 'Namecheap package rehearsal', browser: 'Server and browser setup',
  chromium: 'Chromium journeys', safari: 'iPhone and iPad journeys', tablet: 'Additional iPad journeys',
  content: 'Educational content audit', lighthouse: 'Lighthouse', artwork: 'Library artwork'};
const stages = JSON.parse(process.env.WEBSITE_AUDIT_STAGES ?? '{}');
const findings = [];
const gaps = [];
const skipped = [];
const browserLaunchFailures = new Set();
const stats = {passed: 0, failed: 0, skipped: 0, flaky: 0};
const incompleteBrowsers = new Set();

const escape = value => String(value ?? '').replace(/\x1b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, ' ')
  .replace(/[\\|`\[\]<>*]/g, '\\$&');
const attempt = error => String(error?.message ?? error ?? '').replace(/\x1b\[[0-9;]*m/g, '').split('\n')
  .filter(line => line.trim()).slice(0, 8).join('\n');

for (const group of groups) {
  const report = read(resolve(dir, `${group}.json`));
  if (!report) {
    incompleteBrowsers.add(group);
    gaps.push(`${stageNames[group]}: no result file. Stage status: ${stages[group] ?? 'not run'}.`);
    continue;
  }
  stats.passed += report.stats.expected;
  stats.failed += report.stats.unexpected;
  stats.skipped += report.stats.skipped;
  stats.flaky += report.stats.flaky;
  if (report.errors?.length || !report.suites.length) incompleteBrowsers.add(group);
  for (const error of report.errors ?? []) gaps.push(`${stageNames[group]} stopped early: ${attempt(error)}`);
  function visit(suite, path) {
    const parent = [...path, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const name = [...parent.slice(1), spec.title].join(' › ');
        const project = test.projectName;
        const result = test.results.at(-1);
        const annotation = test.annotations?.find(item => item.type === 'audit-location');
        const annotated = annotation?.description ? JSON.parse(annotation.description) : {};
        const error = attempt(result?.errors?.[0]);
        const routeFromError = error.match(/\/(?:en|ro|es|fr|de|it|pt|nl|pl)(?:\/[a-zA-Z0-9_-]+)+/)?.[0];
        const route = annotated.route ?? routeFromError ?? name.match(/(?:^|\s)(\/(?:en|ro|es|fr|de|it|pt|nl|pl)\S*)/)?.[1]?.replace(/:$/, '');
        const locale = annotated.locale ?? route?.split('/')[1] ?? name.match(/\b(en|ro|es|fr|de|it|pt|nl|pl)(?=[/:]|\b)/)?.[1];
        if (test.status === 'skipped') {
          skipped.push(`${project} · ${name}: ${test.annotations?.find(item => item.type === 'skip')?.description ?? 'No skip reason supplied. A run may also have stopped early.'}`);
        }
        if (!['unexpected', 'flaky'].includes(test.status)) continue;
        if (/browserType.launch:|Playwright Host validation warning|Executable doesn't exist/.test(error)) {
          incompleteBrowsers.add(group);
          stats[test.status === 'flaky' ? 'flaky' : 'failed']--;
          stats.skipped++;
          if (!browserLaunchFailures.has(group)) {
            browserLaunchFailures.add(group);
            findings.push({id: `browser-setup:${group}`, severity: 'High',
              title: `${stageNames[group]} could not launch the browser`, evidence: error,
              reproduction: 'Check the browser launch output in this run.',
              correction: 'Install the expected browser revision and its system dependencies on the runner.'});
          }
          continue;
        }
        const screenshots = (result?.attachments ?? []).filter(item => item.contentType?.startsWith('image/') && item.path)
          .map(item => relative(dir, resolve(item.path))).filter(path => !isAbsolute(path) &&
            resolve(dir, path).startsWith(dir + sep) && existsSync(resolve(dir, path)));
        const accessibility = /accessibility|wcag|aria/.test(spec.file);
        const severity = test.status === 'flaky' ? 'Medium' : /page crashed|document.*HTTP 5\d\d/i.test(error)
          ? 'Critical' : accessibility || /clipping|single.row|visual/i.test(name) && !/JavaScript|HTTP/.test(error)
            ? 'Medium' : 'High';
        findings.push({id: `browser:${spec.file}:${project}:${name}`, severity, title: name, route, locale,
          evidence: error || (test.status === 'flaky' ? 'Passed after retry.' : result?.status ?? 'No failure detail recorded.'),
          reproduction: `On the isolated build, run \`npx playwright test ${basename(spec.file)} --project=${project} -g ${JSON.stringify(spec.title)}\`.`,
          correction: accessibility ? 'Inspect the reported element and repeat the interaction with keyboard navigation and assistive technology.'
            : 'Repeat the steps in the test and correct the first failed interaction, page or asset shown in the evidence.',
          screenshots});
      }
    }
    for (const child of suite.suites ?? []) visit(child, parent);
  }
  for (const suite of report.suites) visit(suite, []);
}
const units = read(resolve(dir, 'unit.json'));
if (!units) gaps.push('Unit-suite counts are unavailable.');
for (const unit of units ?? []) {
  stats[unit.passed ? 'passed' : 'failed']++;
  if (!unit.passed) findings.push({id: `unit:${unit.file}`, severity: 'High', title: `Unit suite failed: ${unit.file}`,
    reproduction: `Run \`node --import tsx scripts/${unit.file}\`.`, correction: 'Read the first failed assertion and check the referenced lesson, data or behavior.'});
}
const content = read(resolve(dir, 'content.json'));
if (!content) gaps.push('Educational content checks did not produce a report.');
for (const finding of content?.findings ?? []) {
  findings.push({...finding, id: `content:${finding.locale}:${finding.id}`,
    reproduction: `Open ${finding.route} and compare its source entry in messages/${finding.locale}.json${finding.id.startsWith('comic-') ? ' and review the corresponding comic file' : ''}.`});
}
gaps.push(...(content?.skipped ?? []));
for (const [key, status] of Object.entries(stages)) {
  if (status === 'failure' && !['chromium', 'safari', 'tablet', 'unit', 'lighthouse'].includes(key)) {
    findings.push({id: `stage:${key}`, severity: 'High', title: `${stageNames[key] ?? key} failed`,
      reproduction: 'Open this run in GitHub Actions and expand the named step.',
      correction: 'Use the first error in the step log to fix the check or restore its inputs.'});
  }
  if (status === 'skipped' && key !== 'lighthouse' && !incompleteBrowsers.has(key)) gaps.push(`${stageNames[key] ?? key}: workflow step skipped.`);
}
const metrics = {};
const lines = ['# Money Quest website audit', '', `Generated ${new Date().toISOString()}`, '',
  `Scope: ${broad ? 'Broad' : 'Essential'} · ${process.env.GITHUB_SHA?.slice(0, 12) ?? 'local build'}`,
  '', '| Passed | Failed | Skipped | Flaky |', '| ---: | ---: | ---: | ---: |',
  `| ${stats.passed} | ${stats.failed} | ${stats.skipped} | ${stats.flaky} |`,
  '', 'Counts combine browser cases and unit suites. Cases blocked by a browser launch error count as skipped. Build steps and editorial findings are reported separately.'];

for (const [name, route] of [['home', '/en'], ['play-ro', '/ro/play']]) {
  const result = read(resolve(dir, `lighthouse-${name}.json`));
  if (!result || result.runtimeError) {
    gaps.push(`Lighthouse ${route}: ${result?.runtimeError?.message ?? (broad ? 'no measurement available' : 'broad run only')}.`);
    continue;
  }
  const audits = result.audits;
  metrics[name] = {
    Performance: result.categories.performance.score === null ? null : result.categories.performance.score * 100,
    Accessibility: result.categories.accessibility.score === null ? null : result.categories.accessibility.score * 100,
    SEO: result.categories.seo.score === null ? null : result.categories.seo.score * 100,
    'LCP (ms)': audits['largest-contentful-paint'].numericValue,
    CLS: audits['cumulative-layout-shift'].numericValue,
    'TBT (ms)': audits['total-blocking-time'].numericValue,
  };
  for (const id of ['document-title', 'meta-description', 'link-text', 'crawlable-anchors',
    'modern-image-formats', 'uses-optimized-images', 'uses-responsive-images']) {
    const audit = audits[id];
    if (typeof audit?.score !== 'number' || audit.score >= 0.9) continue;
    findings.push({id: `lighthouse:${name}:${id}`, severity: 'Low', title: audit.title, route,
      locale: route.split('/')[1], evidence: audit.displayValue ?? audit.description,
      reproduction: `Open lighthouse-${name}.json and look for the ${id} audit.`,
      correction: id.includes('image') ? 'Review the listed image sizes, formats and potential byte savings.'
        : 'Review the listed elements and update the affected metadata or link text.'});
  }
}
const failedStage = Object.values(stages).includes('failure');
const incomplete = !units || incompleteBrowsers.size > 0 || !content ||
  (broad && Object.keys(metrics).length !== 2);
const status = stats.failed || failedStage ? 'Failures detected' : incomplete ? 'Incomplete'
  : findings.length || stats.flaky ? 'Review needed' : 'Passed';
lines.splice(6, 0, `Overall status: ${status}`, '');
lines.push('', `Comparison: ${previous ? `baseline from ${previous.generated} (${previous.commit ?? 'local'})` : 'first result or baseline unavailable'}.`);
lines.push('', '## Check results', '', '| Check | Status |', '| --- | --- |');
for (const [key, value] of Object.entries(stages)) lines.push(`| ${stageNames[key] ?? key} | ${escape(value)} |`);
if (!Object.keys(stages).length) lines.push('| Workflow steps | No workflow stage data supplied |');
lines.push('', '## Findings', '');
const priorIds = new Set(previous?.findingIds ?? []);
for (const [heading, list] of [
  ['Newly detected', previous ? findings.filter(item => !priorIds.has(item.id)) : []],
  ['Previously observed', findings.filter(item => priorIds.has(item.id))],
  ['Awaiting a baseline', previous ? [] : findings],
]) {
  lines.push(`### ${heading} (${list.length})`, '');
  if (!list.length) lines.push('None to list.', '');
  for (const item of list) {
    lines.push(`#### ${item.severity} · ${escape(item.title)}`, '',
      `- Page or lesson: ${escape(item.route ?? 'See test or workflow step')}`,
      `- Language: ${escape(item.locale ?? 'See test or applies across languages')}`,
      `- To reproduce: ${item.reproduction ?? 'Open the named workflow or browser step and read its log.'}`, `- Suggested correction: ${item.correction}`);
    if (item.evidence) lines.push(`- What happened: ${escape(item.evidence)}`);
    for (const file of item.screenshots ?? []) lines.push(`- [Failure screenshot](${file.split(sep).map(encodeURIComponent).join('/')})`);
    lines.push('');
  }
}
lines.push('## Performance and SEO', '');
for (const [sample, values] of Object.entries(metrics)) {
  lines.push(`### ${sample === 'home' ? '/en' : '/ro/play'}`, '',
    `[Lighthouse details](lighthouse-${sample}.json)`, '', '| Metric | Current | Change from baseline |', '| --- | ---: | ---: |');
  for (const [key, value] of Object.entries(values)) {
    const old = previous?.metrics?.[sample]?.[key];
    const rounded = Number.isFinite(value) ? Number(value.toFixed(2)) : 'Unavailable';
    const delta = Number.isFinite(value) && Number.isFinite(old) ? Number((value - old).toFixed(2)) : undefined;
    lines.push(`| ${key} | ${rounded} | ${delta === undefined ? 'Unavailable' : (delta > 0 ? '+' : '') + delta} |`);
  }
  lines.push('');
}
lines.push('LCP and CLS are lab measurements. TBT approximates main-thread responsiveness. Real-user INP and field data require separate measurement.', '',
  '## Skipped and unverified', '',
  ...gaps.map(value => `- ${escape(value)}`),
  ...skipped.map(value => `- ${escape(value)}`),
  '- Human review covers translation accuracy, text printed inside comic panels, educational accuracy, age suitability and near-duplicate activities or questions.',
  '- Confirm currency wording in prose and illustrations, real device voices, physical printing, full screen-reader journeys and subjective readability.',
  `- The link scan samples ${broad ? 'the homepage, play and first lesson in each locale' : 'English homepage links'}. External links, commerce, query strings, document downloads and in-page anchors are outside its scope.`,
  '- Visual checks measure layout and image geometry on representative pages. They cannot detect every overlap or readability issue.', '');
writeFileSync(resolve(dir, 'audit-report.md'), lines.join('\n'));
writeFileSync(resolve(dir, 'comparison.json'), JSON.stringify({
  generated: new Date().toISOString(), commit: process.env.GITHUB_SHA, complete: !incomplete,
  findingIds: [...new Set(findings.map(item => item.id))], metrics,
}, null, 2));
console.log(`${status}: ${stats.passed} passed, ${stats.failed} failed, ${stats.skipped} skipped, ${findings.length} findings.`);
