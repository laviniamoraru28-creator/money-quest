import { test, expect } from "@playwright/test";

/**
 * Added directly in response to a real production bug: /ro loaded
 * without error but rendered English content, and the language
 * switcher appeared to do nothing. Root cause was
 * src/app/[locale]/layout.tsx's <NextIntlClientProvider> never being
 * given a `locale` prop — every client component reading useLocale()
 * (including the switcher itself) fell back to an unreliable/default
 * value regardless of the URL. See that file's own comment for the
 * full explanation.
 *
 * Honest status — matching this project's own playwright.config.ts
 * disclosure: this spec has NOT been executed. This sandbox has no
 * browser runtime and no way to run `npx playwright test` against a
 * live instance. It is real, structurally-correct code, checked
 * against this codebase's actual translated strings (not invented
 * placeholders) and ready to run in CI or against the real deployed
 * site — treat a fresh run as required before trusting it as passing.
 */

test.describe("Locale switching", () => {
  test("visiting /ro directly renders Romanian content, not English", async ({ page }) => {
    await page.goto("/ro");
    // messages/ro.json's actual landing.heroTitle — a real translated
    // string, not a placeholder, chosen because it's rendered
    // unconditionally on the homepage for every visitor.
    await expect(page.getByText("Învață despre bani jucându-te, explorând și luând decizii.")).toBeVisible();
    // Negative assertion matters just as much here: this is exactly
    // the failure mode being guarded against — the page loading
    // without error while silently showing the English string instead.
    await expect(page.getByText("Learn about money by playing, exploring, and making decisions.")).toHaveCount(0);
  });

  test("visiting /es directly renders Spanish content", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByText("Aprende sobre el dinero jugando, explorando y tomando decisiones.")).toBeVisible();
  });

  test("the language switcher actually navigates and updates rendered content", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Learn about money by playing, exploring, and making decisions.")).toBeVisible();

    // aria-label from LanguageSwitcher.tsx's own messages key
    // (language.selectorLabel), not an invented selector.
    await page.getByRole("button", { name: /Language|🌐/i }).click();
    await page.getByRole("option", { name: "Română" }).click();

    await expect(page).toHaveURL(/\/ro(\/|$)/);
    await expect(page.getByText("Învață despre bani jucându-te, explorând și luând decizii.")).toBeVisible();
  });

  test("switching language preserves the current page, not just the homepage", async ({ page }) => {
    await page.goto("/en/parent-info");
    await page.getByRole("button", { name: /Language|🌐/i }).click();
    await page.getByRole("option", { name: "Română" }).click();

    // Should land on the Romanian version of the SAME page, per
    // LanguageSwitcher.tsx's own documented behavior ("stays on the
    // Dashboard, in Romanian" — same principle applies to any page).
    await expect(page).toHaveURL(/\/ro\/parent-info/);
  });
});
