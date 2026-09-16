import { defineConfig, devices } from "@playwright/test";

/**
 * Honest status, stated here rather than only in
 * money-quest-testing-strategy.md: these specs are written to run
 * against a real, deployed (or locally-running `next dev`/`next
 * start`) instance of this app, with a real Supabase project behind
 * it. This sandbox has neither a browser runtime nor a live server, so
 * none of these have been executed — they are real, complete,
 * structurally-correct Playwright specs, checked against this
 * codebase's actual component markup (form field `name`s, button
 * text, ARIA labels — grepped from the real source, not invented),
 * ready to run in CI the moment a target `baseURL` exists. Treat a
 * fresh `npx playwright test` run against a real environment as a
 * required step before trusting these as passing — this file does not
 * claim they already do.
 */
export default defineConfig({
  testDir: "./e2e/journeys",
  fullyParallel: false, // each journey creates its own account; parallel runs are safe in principle (isolated fixtures) but sequential is the safer default until that's proven against a real environment
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "tablet-safari",
      use: { ...devices["iPad Mini"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
