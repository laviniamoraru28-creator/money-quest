> Historical planning record. The combined implementation and current scope are recorded in `website-integration-record.md`. Consult the final QA record for executed checks.

# Inclusive Future Skills — initial GitHub audit

Scope: website (Next.js), not the Godot game. Source reviewed on `main` on 27 October 2026. Changes are isolated to `feature/inclusive-future-skills`.

## Coordination with Claude
- Do not change `godot/**`, Claude branches, or `rlq-isolated-delivery`.
- Do not duplicate Real Life Quests or overwrite curriculum/translations while Claude's work is ongoing.
- Museum/Library work remains on `feature/museum-library`; integrate only after separate testing and review.
- This branch contains editorial rules and planned web-only content.

## Confirmed source facts
- The app has three level options and a local-progress mechanism; verify actual UX on devices before claiming it is accessible.
- `src/i18n/config.ts` declares nine locales: en, ro, es, fr, de, it, pt, nl, pl. English-only public launch remains the product decision; audit routing before changing any locale config.
- `src/components/ui/LanguageSwitcher.tsx` is implemented, including keyboard Escape handling. Its own documentation states it is not a complete ARIA listbox interaction.
- `src/components/ui/Button.tsx` has multiple button variants and touch sizing, but no explicit focus-visible class in the shared base. Audit focus styles sitewide before altering this shared component.
- `src/content/articles.ts` contains six informational article structures aimed primarily at adults. Do not rewrite parent/teacher information as if addressing a six-year-old.
- `src/app/[locale]/play/page.tsx` uses existing worlds and levels. No changes to the play flow are proposed here.

## Work packages
1. Editorial review of child-facing English strings: short, concrete, encouraging and accurate.
2. Translation QA: terminology, naturalness, placeholders, reading level, locale consistency; review by competent human speakers before publishing each language.
3. Inclusive controls: optional audio, readable text, predictable navigation, clear focus, no time pressure, visual alternatives, reduced motion and keyboard-only testing.
4. Web-only Future Skills Hub: critical thinking, checking AI output, creativity, decision-making, emotional regulation, practical autonomy and digital safety.
5. Teacher/parent guidance: one observable goal, one accessible adaptation and one everyday activity per lesson.
6. Automated checks: missing translation keys, route navigation, accessible names and regression tests.

## Known risks and limits
- A complete set of translation keys does not prove linguistic quality.
- Current GitHub access allows reading and writing, but does not itself run a local build or browser test.
- The user has not approved publication; do not merge to `main` or deploy.
- A child-friendly text change may require corresponding updates in all active locales. Avoid silent English fallbacks.
- Do not introduce an AI companion or unsupervised child-facing generative chat.
