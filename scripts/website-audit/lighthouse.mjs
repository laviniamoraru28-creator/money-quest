import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const dir = resolve(process.argv[2] ?? 'test-results/audit');
const chrome = process.env.CHROME_PATH ?? spawnSync('node', [
  '-e', 'process.stdout.write(require("playwright").chromium.executablePath())',
], {encoding: 'utf8'}).stdout.trim();
const samples = [['home', '/en'], ['play-ro', '/ro/play']];
for (const [name, route] of samples) {
  const result = spawnSync('npm', ['exec', '--yes', '--package=lighthouse@12.8.2', '--', 'lighthouse',
    `http://localhost:3000${route}`, '--quiet', '--output=json', `--output-path=${dir}/lighthouse-${name}.json`,
    '--only-categories=performance,accessibility,seo', '--chrome-flags=--headless --no-sandbox'],
  {env: {...process.env, CHROME_PATH: chrome}, stdio: 'inherit', timeout: 90_000});
  if (result.status !== 0) {
    console.error(`Lighthouse could not complete ${route} (${result.error?.message ?? result.status}).`);
    process.exitCode = 1;
  }
}
