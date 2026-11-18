import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createDefaultState as createLocalProgressDefault } from "../../src/lib/local-progress/state";
import { createDefaultState as createEqDefaultState } from "../../src/lib/entrepreneur-quest/state";

const messages = JSON.parse(readFileSync("messages/en.json", "utf8"));

/**
 * Builder/Strategist redesign: Entrepreneur Quest's Run Your Business,
 * Rescue & Grow and AI Business Lab, and Leadership Quest's Uh-oh
 * events, are reserved for Strategist (12-14) - their subject matter
 * (cash flow, business ethics, AI literacy, pivoting a struggling
 * company, unplanned disruption) matches the brief's Strategist
 * activity list, not Builder's. See
 * docs/eq-lq-age-band-redesign.md section 7. Builder (and Explorer)
 * keep the full core Build/Mission path and everything else
 * (Simulator, Challenges, Real-World Missions, Leadership Lab) -
 * nothing in THIS file tests those, see
 * entrepreneur-quest-age-bands.spec.ts / leadership-quest-age-bands.spec.ts.
 */

async function seedBand(page: Page, band: "builder" | "strategist") {
  const eq = createEqDefaultState();
  eq.pitchCompleted = true;
  eq.completedProblemIds = ["not-enough-customers"];
  await page.addInitScript(
    ([localProgress, eqState]) => {
      localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(localProgress));
      localStorage.setItem("moneyquest_entrepreneur_quest_v1", JSON.stringify(eqState));
    },
    [{ ...createLocalProgressDefault(), ageBand: band }, { byBand: { [band]: eq } }]
  );
}

for (const band of ["builder"] as const) {
  test(`${band} sees a Strategist-level message instead of Run Your Business, not the activity`, async ({ page }) => {
    await seedBand(page, band);
    await page.goto("/en/entrepreneur-quest/run");
    await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toBeVisible();
    await expect(page.getByText(messages.entrepreneurQuest.run.hubTitle, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: messages.entrepreneurQuest.hubTitle, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/entrepreneur-quest$/);
  });

  test(`${band} sees a Strategist-level message instead of Rescue & Grow`, async ({ page }) => {
    await seedBand(page, band);
    await page.goto("/en/entrepreneur-quest/rescue-grow");
    await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toBeVisible();
    await expect(page.getByText(messages.entrepreneurQuest.rescueGrow.hubTitle, { exact: true })).toHaveCount(0);
  });

  test(`${band} sees a Strategist-level message instead of the AI Business Lab`, async ({ page }) => {
    await seedBand(page, band);
    await page.goto("/en/entrepreneur-quest/ai-lab");
    await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: messages.entrepreneurQuest.aiLab.hubTitle, exact: true })).toHaveCount(0);
  });

  test(`${band} does not see Run Your Business or Rescue & Grow tiles on the Entrepreneur Quest hub even when their own unlock conditions are met`, async ({ page }) => {
    await seedBand(page, band);
    await page.goto("/en/entrepreneur-quest");
    await expect(page.getByText(messages.entrepreneurQuest.run.hubTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText(messages.entrepreneurQuest.rescueGrow.hubTitle, { exact: true })).toHaveCount(0);
  });

  test(`${band}'s Strategist-only gate has no accessibility violations and fits a 320px mobile screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await seedBand(page, band);
    await page.goto("/en/entrepreneur-quest/run");
    await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("strategist can open Run Your Business, Rescue & Grow and the AI Business Lab from the hub", async ({ page }) => {
  await seedBand(page, "strategist");
  await page.goto("/en/entrepreneur-quest");
  await expect(page.getByText(messages.entrepreneurQuest.run.hubTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(messages.entrepreneurQuest.rescueGrow.hubTitle, { exact: true })).toBeVisible();

  await page.goto("/en/entrepreneur-quest/run");
  await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages.entrepreneurQuest.run.hubTitle, exact: true })).toBeVisible();

  await page.goto("/en/entrepreneur-quest/rescue-grow");
  await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toHaveCount(0);

  await page.goto("/en/entrepreneur-quest/ai-lab");
  await expect(page.getByRole("heading", { name: messages.bandGate.strategistOnly.title, exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: messages.entrepreneurQuest.aiLab.hubTitle, exact: true })).toBeVisible();
});

/** Completes Leadership Quest's "First Challenge" mission (a single
 * 4-pair match event, no retry needed) up to the point where the
 * mission's own Uh-oh trigger ("uh-oh-printer") would fire. */
async function completeFirstChallengeMatch(page: Page) {
  await page.goto("/en/leadership-quest/missions/first-challenge");
  const pairs: { taskId: string; characterId: "nadia" | "oren" | "priya" | "theo" }[] = [
    { taskId: "design-the-poster", characterId: "nadia" },
    { taskId: "build-the-display", characterId: "oren" },
    { taskId: "explain-it-to-visitors", characterId: "priya" },
    { taskId: "make-the-plan", characterId: "theo" },
  ];
  for (const pair of pairs) {
    await page.getByRole("button", { name: messages.leadershipQuest.missions["first-challenge"].tasks[pair.taskId], exact: true }).click();
    await page.getByRole("button", { name: messages.leadershipQuest.characters[pair.characterId].name, exact: true }).click();
  }
  await page.getByRole("button", { name: messages.leadershipQuest.continueButton, exact: true }).click();
}

test("builder's Leadership Quest mission never shows an Uh-oh event", async ({ page }) => {
  await page.addInitScript((localProgress) => {
    localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(localProgress));
  }, { ...createLocalProgressDefault(), ageBand: "builder" });
  await completeFirstChallengeMatch(page);
  await expect(page.getByText(messages.leadershipQuest.uhOh["uh-oh-printer"].title, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: messages.leadershipQuest.finishMissionButton, exact: true })).toBeVisible();
});

test("strategist's Leadership Quest mission shows the Uh-oh event before finishing", async ({ page }) => {
  await page.addInitScript((localProgress) => {
    localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(localProgress));
  }, { ...createLocalProgressDefault(), ageBand: "strategist" });
  await completeFirstChallengeMatch(page);
  await expect(page.getByText(messages.leadershipQuest.uhOh["uh-oh-printer"].title, { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: messages.leadershipQuest.finishMissionButton, exact: true })).toHaveCount(0);
});
