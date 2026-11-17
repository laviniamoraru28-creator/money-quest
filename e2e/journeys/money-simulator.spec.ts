import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {journeyCopy} from "../../src/content/journey-copy";

/**
 * Drives the Money Life Simulator through a full scenario for real,
 * rather than only checking it renders — this is the only coverage
 * that would have caught the SimulatorShell bug where weekIndex
 * reaching scenario.weeks.length one render before phase flips to
 * "finished" made the component return null on the last week's
 * summary, leaving the child stuck with no "See my final report"
 * button and no way to ever finish the scenario.
 */
test("Money Life Simulator can be played to completion and offers the next section", async ({page}) => {
 test.setTimeout(60000);
 const messages = JSON.parse(readFileSync("messages/en.json", "utf8"));
 await page.addInitScript(() => localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify({ageBand: "explorer", completedActivityIds: []})));
 await page.goto("/en/play/simulator");

 const confirmBtn = page.getByRole("button", {name: "Confirm my plan for this week", exact: true});
 const weekContinueBtn = page.getByRole("button", {name: /See my final report|Continue to next week/});
 const navLabels = /^(← World Map|🏠 Home)/;

 for (let week = 0; week < 20; week++) {
  if (await page.getByRole("heading", {name: messages.simulator.reportTitle, exact: true}).count() > 0) break;
  if (await confirmBtn.count() > 0) {
   const increaseBtn = page.getByRole("button", {name: /^Increase /}).first();
   for (let i = 0; i < 500 && !(await confirmBtn.isEnabled()); i++) await increaseBtn.click();
   await confirmBtn.click();
   continue;
  }
  if (await weekContinueBtn.count() > 0) { await weekContinueBtn.first().click(); continue; }
  const choice = page.locator("main").getByRole("button").filter({hasNotText: navLabels}).first();
  await choice.click();
 }

 // The real completion screen - including the required report figures
 // and the shared journey Continue button, not a dead end.
 await expect(page.getByRole("heading", {name: messages.simulator.reportTitle, exact: true})).toBeVisible();
 const continueLink = page.getByRole("link", {name: journeyCopy.en.continueToAria.replace("{section}", messages.navMenu.futureSkills), exact: true});
 await expect(continueLink).toHaveCount(1);
 await expect(continueLink).toHaveAttribute("href", "/en/future-skills");
 const box = await continueLink.boundingBox();
 expect(box!.height).toBeGreaterThanOrEqual(44);

 await expect(page.getByRole("button", {name: messages.simulator.backToMyWorld, exact: true})).toBeVisible();
});
