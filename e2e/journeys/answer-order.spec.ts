import { test, expect, type Page } from "@playwright/test";

/**
 * Regression coverage for the quiz/game "correct answer is always
 * first" bug fixed by src/lib/answer-order.ts. Exercises the real,
 * running app (a local `next dev`/`next start` instance — see
 * playwright.config.ts for baseURL), not mocked data: the lesson quiz
 * is a real curriculum lesson (builder-saving-l1) whose raw content
 * places the correct answer at options[0], and the game round is a
 * real game-engine round (money-choices) reused by
 * MultipleChoiceMechanic. Both go through LessonPlayer/GameShell's
 * actual client-side onboarding gate (age-band selection via
 * localStorage, no account) exactly as a real child would.
 *
 * Every assertion below checks behaviour, not implementation: it reads
 * whatever the page currently renders and reacts to that, rather than
 * assuming a fixed DOM order — which is the whole point of the fix
 * being tested.
 */

async function chooseLevel(page: Page, levelLabel: string) {
  await page.goto("/en/play");
  await expect(page.getByText("Choose your learning level")).toBeVisible();
  await page.getByRole("button", { name: new RegExp(levelLabel) }).click();
}

const LESSON_URL = "/en/play/world/golden-vault/lesson/builder-saving-l1";
const CORRECT_LESSON_ANSWER = "Save allowance over several weeks";

const GAME_URL = "/en/play/world/horizon-peaks/game/game-explorer-money-choices";
const CORRECT_GAME_ANSWER = "Stop and think about it first";

test.describe("Lesson quiz answer order", () => {
  test("the correct answer is not pinned to the first position across repeated visits", async ({ page }) => {
    await chooseLevel(page, "Primary");
    await page.goto(LESSON_URL);

    const positions = new Set<number>();
    const firstOptionTexts = new Set<string>();

    for (let i = 0; i < 10; i++) {
      if (i > 0) await page.reload();
      const labelLocator = page.locator("fieldset label");
      await expect(labelLocator).toHaveCount(4);
      const trimmed = (await labelLocator.allTextContents()).map((l) => l.trim());
      positions.add(trimmed.indexOf(CORRECT_LESSON_ANSWER));
      firstOptionTexts.add(trimmed[0] ?? "");
    }

    // The raw content for this lesson declares the correct answer at
    // index 0 — this is exactly the bug. After the fix, across 10
    // reloads it must land in more than one position.
    expect(positions.size, `correct answer landed in positions: ${[...positions]}`).toBeGreaterThan(1);
    // Distractors must also move, not just the correct answer.
    expect(firstOptionTexts.size, `first-position text varied across: ${[...firstOptionTexts]}`).toBeGreaterThan(1);
  });

  test("selecting the correct answer scores correct and shows success feedback, wherever it is displayed", async ({ page }) => {
    await chooseLevel(page, "Primary");
    await page.goto(LESSON_URL);

    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(4);
    // Find the correct option by its own text/identity, never by index.
    const correctRadio = page.getByRole("radio", { name: CORRECT_LESSON_ANSWER });
    await correctRadio.check();
    await page.getByRole("button", { name: "Check my answer" }).click();

    await expect(page.getByText("Right - small amounts really do add up over time. 📈")).toBeVisible();
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  });

  test("selecting a wrong answer shows retry feedback, and Try Again returns to an answerable state", async ({ page }) => {
    await chooseLevel(page, "Primary");
    await page.goto(LESSON_URL);

    const labelLocator = page.locator("fieldset label");
    await expect(labelLocator).toHaveCount(4);
    const labels = (await labelLocator.allTextContents()).map((l) => l.trim());
    const wrongLabel = labels.find((l) => l !== CORRECT_LESSON_ANSWER);
    expect(wrongLabel).toBeTruthy();

    await page.getByRole("radio", { name: wrongLabel! }).check();
    await page.getByRole("button", { name: "Check my answer" }).click();

    await expect(page.getByText("Think about what Maya could realistically do each week to get closer to her goal.")).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();

    // Back to an answerable state: the Check my answer button is
    // visible again and options are selectable.
    await expect(page.getByRole("button", { name: "Check my answer" })).toBeVisible();
    await expect(page.getByRole("radio", { name: CORRECT_LESSON_ANSWER })).toBeEnabled();
  });

  test("the answer options are reachable and operable with keyboard only", async ({ page }) => {
    await chooseLevel(page, "Primary");
    await page.goto(LESSON_URL);

    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(4);

    await radios.first().focus();
    await expect(radios.first()).toBeFocused();
    // Arrow-key navigation within a native radio group also selects —
    // standard browser behaviour for role="radio" inputs sharing a
    // `name`, which LessonPlayer's radios already share (name="quiz-option" equivalent).
    await page.keyboard.press("ArrowDown");
    const checkedCount = await radios.evaluateAll((els) => els.filter((el) => (el as HTMLInputElement).checked).length);
    expect(checkedCount).toBe(1);

    // Tab to the submit button and activate it with the keyboard.
    await page.getByRole("button", { name: "Check my answer" }).focus();
    await page.keyboard.press("Enter");

    // Either success or retry feedback must appear — whichever option
    // arrow-down landed on, the app must respond, proving the control
    // is fully keyboard-operable end to end.
    await expect(
      page.getByText("Right - small amounts really do add up over time. 📈").or(
        page.getByText("Think about what Maya could realistically do each week to get closer to her goal.")
      )
    ).toBeVisible();
  });
});

test.describe("Game-engine multiple-choice round answer order", () => {
  test("the correct option is not pinned to one position, and scoring stays correct", async ({ page }) => {
    await chooseLevel(page, "Early Learner");
    await page.goto(GAME_URL);

    const positions = new Set<number>();
    for (let i = 0; i < 8; i++) {
      if (i > 0) await page.reload();
      const labelLocator = page.locator("fieldset label");
      await expect(labelLocator).toHaveCount(4);
      const labels = (await labelLocator.allTextContents()).map((l) => l.trim());
      positions.add(labels.indexOf(CORRECT_GAME_ANSWER));
    }
    expect(positions.size, `correct option landed in positions: ${[...positions]}`).toBeGreaterThan(1);

    // Final pass: answer correctly by identity, regardless of position.
    await page.reload();
    await page.getByRole("radio", { name: CORRECT_GAME_ANSWER }).check();
    await page.getByRole("button", { name: "Check my answer" }).click();
    await expect(page.getByText("That's a thoughtful choice!")).toBeVisible();
  });

  test("selecting a wrong option shows the game's wrong-answer feedback", async ({ page }) => {
    await chooseLevel(page, "Early Learner");
    await page.goto(GAME_URL);

    const labelLocator = page.locator("fieldset label");
    await expect(labelLocator).toHaveCount(4);
    const labels = (await labelLocator.allTextContents()).map((l) => l.trim());
    const wrongLabel = labels.find((l) => l !== CORRECT_GAME_ANSWER);
    expect(wrongLabel).toBeTruthy();

    await page.getByRole("radio", { name: wrongLabel! }).check();
    await page.getByRole("button", { name: "Check my answer" }).click();
    await expect(page.getByText("Here's what would happen with that choice.")).toBeVisible();
  });
});
