import { defineConfig, devices } from "@playwright/test";

/** Production journeys. Local browser installation may be restricted.
 * Results belong to each recorded CI run; this configuration is not a pass claim.
 */
export default defineConfig({
  testDir: "./e2e/journeys",
  fullyParallel: false, // isolated local progress per test context
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
