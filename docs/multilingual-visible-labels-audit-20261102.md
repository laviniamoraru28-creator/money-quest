# Visible English labels: multilingual release blocker (2 Nov 2026)

User observation: Museum and other navigation buttons remain English on the deployed website. Do not mark the nine-language release complete until verified on the actual deployed build.

## Code evidence from main
- `src/content/discovery-copy.json` already contains `ro.museum = "Muzeu"`, `ro.library = "Bibliotecă"` and translations for the Museum/Library controls.
- `src/components/DiscoveryExperience.tsx` uses `discoveryCopy[locale]` for its Museum and Library navigation.
- `src/content/public-navigation-copy.ts` contains translated discovery labels for nine languages.
- `src/lib/i18n/discovery-presentation.ts` imports eight non-English museum translations, and its public presentation uses `publicLibraryLocale(requestedLocale)`.
- `src/app/[locale]/layout.tsx` explicitly passes `locale` to `NextIntlClientProvider`.

Therefore the observed English buttons **cannot be explained simply by missing Romanian Museum/Library keys**. Check the exact component rendering the observed buttons, its deployed revision, the current route locale and any locale fallback before editing translations. Navigation PR #11 may replace or modify the menu: coordinate, do not overwrite it.

## Required checks on exact merged release candidate
- [ ] Compare deployed build commit/ZIP with GitHub main and PR #11. Identify screenshot/URL/component for each English button.
- [ ] For each of en, ro, es, fr, de, it, pt, nl, pl, visit landing, universal navigation, Museum hub and room, Library hub and book, Brain Lab, Mind Lab, Future Skills, Inclusive Learning, shop, privacy, parent resources and Learn hub.
- [ ] Verify navigation labels, cards, calls to action, challenge controls, page-turn controls, speech buttons, aria labels, error and empty states, title/description, and text within images where applicable.
- [ ] Confirm the URL locale, rendered `html lang`, UI labels and spoken voice all agree. Changing locale should not silently return to English.
- [ ] Assert exact expected translated Museum/Library labels in an end-to-end test on `/ro/museum` and `/ro/library`; add analogous checks for every locale. Avoid selectors tied to layout or English strings.
- [ ] Check that article and authored-content fallback is explicit and does not claim fully translated content. Flag any untranslated paragraphs, quiz answers or age-level prompts.
- [ ] Verify on mobile, desktop and actual production after Namecheap deployment. Record tested commit, date and pass/fail per locale.

Status: **OPEN / NOT VERIFIED**. Existing translation dictionaries do not prove the deployed experience is fully localized.
