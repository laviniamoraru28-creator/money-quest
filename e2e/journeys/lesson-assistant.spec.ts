import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LOCALES } from "../../src/i18n/config";
import { lessonAssistantCopy } from "../../src/i18n/lesson-assistant-copy";
import { LESSON_STRUCTURES } from "../../src/content/curriculum/structures";

const endpoint = "**/api/lesson-assistant";
const levels = ["explorer", "builder", "strategist"] as const;
const drafts = {
  en: "A concert ticket can have a price.",
  ro: "Un bilet la concert poate avea un preț.",
  es: "Una entrada para un concierto puede tener un precio.",
  fr: "Un billet de concert peut avoir un prix.",
  de: "Eine Konzertkarte kann einen Preis haben.",
  it: "Un biglietto per un concerto può avere un prezzo.",
  pt: "Um bilhete para um concerto pode ter um preço.",
  nl: "Een concertkaartje kan een prijs hebben.",
  pl: "Bilet na koncert może mieć określoną cenę.",
};

async function openLesson(page: Page, locale: string, ageBand: typeof levels[number], accessible = false) {
  const lesson = LESSON_STRUCTURES.find((item) => item.ageBand === ageBand && item.topicId === "money_basics")!;
  await page.addInitScript(({ ageBand, accessible }) => {
    window.localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify({ ageBand }));
    if (accessible) window.localStorage.setItem("moneyquest_accessibility_prefs_v1", JSON.stringify({ focusMode: true, reducedMotion: true }));
  }, { ageBand, accessible });
  await page.goto(`/${locale}/play/world/${lesson.worldId}/lesson/${lesson.id}`);
  return lesson.id;
}

for (const [index, locale] of LOCALES.entries()) {
  test(`${locale} uses its lesson, level and translated assistant labels`, async ({ page, isMobile }) => {
    const copy = lessonAssistantCopy[locale];
    if (isMobile) await page.setViewportSize({ width: 320, height: 720 });
    let requestBody: unknown;
    await page.route(endpoint, (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: { ready: true } });
      requestBody = route.request().postDataJSON();
      return route.fulfill({ json: { answer: { text: drafts[locale], challenge: null }, followUp: "mock" } });
    });
    const lessonId = await openLesson(page, locale, levels[index % levels.length]!);
    const assistant = page.locator("[data-lesson-assistant]");
    const trigger = assistant.getByRole("button", { name: copy.title });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(assistant.getByRole("button", { name: copy.understand })).toHaveCount(0);
    await trigger.click();
    for (const label of [copy.understand, copy.more, copy.challenge]) {
      await expect(assistant.getByRole("button", { name: label })).toBeVisible();
    }
    await assistant.getByRole("button", { name: copy.more }).click();
    await expect(assistant.getByText(drafts[locale])).toBeVisible();
    expect(requestBody).toEqual({ lessonId, locale, action: "more" });
    expect(await assistant.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await trigger.click();
    await expect(assistant.getByText(drafts[locale])).toHaveCount(0);
  });
}

test("challenge, keyboard, narration, focus mode and progress work together", async ({ page }) => {
  await page.addInitScript(() => {
    const speechLog: { text: string; lang: string }[] = [];
    Object.defineProperty(window, "assistantTestSpeech", { value: speechLog });
    const synth = new EventTarget();
    Object.assign(synth, {
      getVoices: () => [{ lang: "en-GB", localService: true }],
      cancel: () => undefined,
      speak: (utterance: SpeechSynthesisUtterance) => {
        speechLog.push({ text: utterance.text, lang: utterance.lang });
        utterance.onstart?.call(utterance, new Event("start") as SpeechSynthesisEvent);
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class { constructor(public text: string) {} },
    });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let turns = 0;
  await page.route(endpoint, (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { ready: true } });
    turns++;
    const input = route.request().postDataJSON();
    if (turns === 1) {
      expect(input.action).toBe("challenge");
      return route.fulfill({ json: { followUp: "mock-turn", answer: {
        text: "Which item is food?",
        challenge: {
          choices: [{ label: "Apple", icon: "food" }, { label: "Book", icon: "book" }],
          correct: 0, explanation: "An apple is food.",
        },
      } } });
    }
    expect(input).toMatchObject({ action: "question", question: "Why?", followUp: "mock-turn" });
    return route.fulfill({ json: { status: "scope" } });
  });

  await openLesson(page, "en", "builder", true);
  await expect(page.locator("html")).toHaveAttribute("data-focus-mode", "true");
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  const existingQuiz = page.getByRole("main");
  const existingOption = existingQuiz.getByRole("radio").first();
  await existingOption.check();
  const assistant = page.locator("[data-lesson-assistant]");
  const trigger = assistant.getByRole("button", { name: "AI lesson helper" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // Same wait-for-visible idiom the locale-coverage test above already
  // uses for these same async-gated buttons (line 48) - the panel's
  // content only exists once the availability check resolves, so Tab
  // order into it isn't meaningful (and isn't what toBeFocused() below
  // is testing) until the button it's aiming for actually exists.
  const listenButton = assistant.getByRole("button", { name: "Listen", exact: true });
  await expect(listenButton).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(listenButton).toBeFocused();
  await assistant.getByRole("button", { name: "Give me a challenge" }).press("Enter");
  await expect(assistant.locator("[aria-live]").getByText("Which item is food?")).toBeVisible();
  const speech = () => page.evaluate(() => (window as unknown as { assistantTestSpeech: { text: string; lang: string }[] }).assistantTestSpeech);
  expect(await speech()).toEqual([]);
  await assistant.getByRole("button", { name: "Listen", exact: true }).click();
  expect(await speech()).toMatchObject([{ lang: "en-GB" }]);
  await assistant.getByRole("button", { name: "Book", exact: true }).press("Enter");
  await expect(assistant.getByText("Try another answer.")).toBeVisible();
  await assistant.getByRole("button", { name: "Apple", exact: true }).press("Enter");
  await expect(assistant.getByText("Correct! An apple is food.")).toBeVisible();
  const audit = await new AxeBuilder({ page }).include("[data-lesson-assistant]")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  const question = assistant.getByRole("textbox", { name: "Ask about this lesson" });
  await question.fill("Why?");
  await question.press("Enter");
  await expect(assistant.getByText("Try another question about money, business or leading a team.")).toBeVisible();
  await trigger.click();
  await expect(existingOption).toBeChecked();
  await expect(trigger).toBeFocused();
});

for (const reason of ["daily", "monthly", "disabled"] as const) {
  test(`${reason} availability leaves the lesson usable`, async ({ page }) => {
    const copy = lessonAssistantCopy.en;
    if (reason !== "disabled") {
      await page.route(endpoint, (route) => route.request().method() === "GET"
        ? route.fulfill({ json: { ready: true } })
        : route.fulfill({ status: 429, json: { status: reason } }));
    }
    await openLesson(page, "en", "strategist");
    const assistant = page.locator("[data-lesson-assistant]");
    await assistant.getByRole("button", { name: copy.title }).click();
    if (reason !== "disabled") await assistant.getByRole("button", { name: copy.understand }).click();
    await expect(assistant.getByRole("status")).toHaveText(copy[reason]);
    await expect(page.getByRole("main").getByRole("radio").first()).toBeEnabled();
  });
}
