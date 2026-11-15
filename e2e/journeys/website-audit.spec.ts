import {expect, test} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {createDefaultState} from '../../src/lib/local-progress/state';
import {LOCALES} from '../../src/i18n/config';

for (const locale of LOCALES) {
  const lesson = LESSON_STRUCTURES.find(item => item.ageBand === 'explorer')!;
  const lessonPath = `/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`;
  const paths = [`/${locale}`, `/${locale}/play`, lessonPath];

  for (const route of paths) {
    test(`audit ${locale} ${route}: page renders without broken visible assets, crashes or clipping`, async ({page, baseURL}, info) => {
      // This suite is intentionally restricted to the local production build.
      const origin = new URL(baseURL!);
      expect(['localhost', '127.0.0.1']).toContain(origin.hostname);
      info.annotations.push({type: 'audit-location', description: JSON.stringify({route, locale})});
      const problems = new Set<string>();
      page.on('pageerror', error => problems.add(`JavaScript: ${error.message}`));
      page.on('crash', () => problems.add('The browser page crashed'));
      page.on('requestfailed', request => {
        const url = new URL(request.url());
        const error = request.failure()?.errorText ?? '';
        if (url.origin === origin.origin && !/abort|cancel/i.test(error) &&
            ['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
          problems.add(`Asset request failed: ${url.pathname} (${error})`);
        }
      });
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === origin.origin && response.status() >= 400 &&
            ['document', 'script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())) {
          problems.add(`HTTP ${response.status()} ${url.pathname}`);
        }
      });
      await page.addInitScript(state => {
        localStorage.setItem('moneyquest_local_progress_v1', JSON.stringify(state));
      }, {...createDefaultState(), ageBand: 'explorer'});
      const response = await page.goto(route);
      expect(response?.ok()).toBe(true);
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${locale}(?:-|$)`));
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page).toHaveURL(new URL(route, origin).href);

      const comic = page.locator('[data-explorer-comic-lesson] img');
      if (await comic.count()) {
        await comic.scrollIntoViewIfNeeded();
        await expect.poll(() => comic.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        const geometry = await comic.evaluate((img: HTMLImageElement) => {
          const box = img.getBoundingClientRect();
          const parent = img.parentElement!.getBoundingClientRect();
          return {
            aspectError: Math.abs(box.height - box.width * img.naturalHeight / img.naturalWidth),
            fits: box.left >= -1 && box.right <= innerWidth + 1 &&
              box.left >= parent.left - 1 && box.right <= parent.right + 1 &&
              box.top >= parent.top - 1 && box.bottom <= parent.bottom + 1,
          };
        });
        expect(geometry.fits, 'Comic exceeds its container or the viewport').toBe(true);
        expect(geometry.aspectError, 'Comic aspect ratio changed').toBeLessThanOrEqual(2);
      }
      const brokenImages = await page.locator('main img').evaluateAll(images => images
        .filter((node): node is HTMLImageElement => node instanceof HTMLImageElement)
        .filter(img => img.complete && img.naturalWidth === 0 && img.getClientRects().length > 0)
        .map(img => img.getAttribute('src')));
      expect.soft(brokenImages, 'Images that finished loading unsuccessfully').toEqual([]);
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        'Horizontal page overflow in pixels').toBeLessThanOrEqual(1);
      expect([...problems], 'Browser errors and unsuccessful local asset responses').toEqual([]);
    });
  }
}

test('audit en /en: sampled public internal links resolve', async ({page, request, baseURL}, info) => {
  const origin = new URL(baseURL!);
  expect(['localhost', '127.0.0.1']).toContain(origin.hostname);
  test.skip(info.project.name !== 'desktop-chrome', 'Link responses are sampled once in desktop Chromium.');
  info.annotations.push({type: 'audit-location', description: JSON.stringify({route: '/en', locale: 'en'})});
  await page.goto('/en');
  const hrefs = await page.locator('a[href]').evaluateAll(anchors => anchors.map(a => (a as HTMLAnchorElement).href));
  const paths = [...new Set(hrefs.map(href => new URL(href))
    .filter(url => url.origin === origin.origin && !url.search && !url.hash &&
      /^\/en(?:\/|$)/.test(url.pathname) &&
      !/\/(?:api|shop|checkout|reviews)(?:\/|$)|\.[^/]+$/.test(url.pathname))
    .map(url => url.pathname))].sort();
  expect(paths.length, 'The English homepage exposes public links').toBeGreaterThan(0);
  // Fetch only public page paths on the isolated server. A redirect is not
  // followed, so a bad link cannot send requests to another host.
  for (const route of paths) {
    const response = await request.get(route, {maxRedirects: 0, timeout: 5000});
    expect.soft(response.ok(), `Homepage link ${route} returned HTTP ${response.status()}`).toBe(true);
  }
});
