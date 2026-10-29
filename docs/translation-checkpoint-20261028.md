# Authored-content translation checkpoint

The owner's latest instruction requires all nine website languages for every deliverable, including printable PDFs, journal, parent guide and answers. The older English-only worksheet instruction is superseded.

`messages/*.json` already contains the legacy translated lesson/game/UI keys. It does not contain all new Library manuscripts, mini-biographies, Museum readings, lab age variants or the hardcoded parent-shop UI. Key parity must never be presented as complete translation of the website.

This checkpoint:
- Inventories 1,938 source text fragments in eight new authored-content groups, excluding names, identifiers, URLs, artwork paths and bibliography titles. This is not a complete UI/SEO/legal/PDF inventory.
- Adds draft Romanian text for all 10 mini-biographies (147 translated fragments), including titles, topics, age guidance, alt text, playful introductions, 30 factual/activity sections and 30 takeaways.
- Preserves proper names, image paths, source URLs, original bibliography titles, source-check dates and identifiers.
- Adds a source fingerprint per biography. Changed English copy makes the Romanian draft stale until reviewed. Structural validation rejects missing text, changed arrays or attempts to replace metadata.
- Does not activate Romanian routes or substitute partial Romanian content into an English interface. `ACTIVE_LOCALES` remains English until the whole locale is complete and reviewed.

Still required: remaining reading domains in Romanian (laboratories and external-book introductions); remaining original-book, biography, laboratory and external-book domains in Spanish/French/German/Italian/Portuguese/Dutch/Polish; all hardcoded interface and SEO text; parent commercial/privacy/recovery copy; all 20 printable activities, guides, answers and journal pages in each language; editorial and real-layout checks. Narration requires a separately verified voice per supported language.

The translation drafts and tests check coverage/structure/source synchronisation, not native-editor approval or learning quality. The English source and existing message files are preserved.

## Book translation follow-up

All ten original books now also have complete Romanian text drafts: 62 chapters and 908 translated fragments. This includes the three original reading levels, seven Explorer shared-reading stories, chapter questions, feedback, activities and glossaries. Existing English manuscripts, cover paths, slugs, chapter/paragraph counts and correct-answer positions are preserved. Tests additionally check GBP amounts and detect changed answer flags and stale source copy. These are editorial drafts, not proof of native-editor approval, child usability or finished Romanian pages. Romanian UI, other authored domains, PDFs, SEO and narration remain pending.


## Museum translation follow-up, 29 October 2026

All ten Museum room readings, quizzes, explanations and activities now have complete content drafts in Romanian, Spanish, French, German, Italian, Portuguese, Dutch and Polish. Each edition also includes the ten feedback texts and all thirty distinct Explorer/Builder/Strategist practical challenges. That is 130 text fragments per language, 1,040 translated fragments in total. English source copy is unchanged.

`museumTranslationSource` projects only translatable room text and age challenges. `draftTranslatedMuseum` rejects changed source fingerprints, incomplete arrays, changed correct-answer indices and extra fields. Slugs, icons, source URLs and canonical bibliography titles stay on the source records. Tests verify every locale/room, three distinct answers and age challenges, numeric quantities/dates/GBP examples, source changes and invalid translation attempts.

The source inventory now excludes twelve canonical bibliography titles that the initial count included despite its stated scope. This changes the count of source text fragments from 1,938 to 1,926 without deleting content. It is a counting correction, not a reduction in translation work. The initial checkpoint above remains a historical record.

These are content drafts and tested adapters, not an activated multilingual Museum. The existing public Museum interface still uses English. Localized navigation, feedback prompts, metadata, read-aloud locale, rendering integration and actual per-language layout/child/native-editor review remain required before rollout. Other content groups, parent products/PDFs, shop and the rest of the website remain incomplete. `ACTIVE_LOCALES` stays English, with no new hreflang or mixed-language public pages.


## Short-read translation follow-up, 29 October 2026

The eight existing three-page short reads now also have complete text drafts in all eight non-English languages. Each edition includes 24 pages, topics, questions, answer choices, feedback and 24 distinct practical challenges across the three age levels. That is another 128 text fragments per language, 1,024 translated fragments in total. These eight short reads remain separate from the ten original chapter books and ten mini-biographies.

A typed short-read projection and adapter preserve slugs, icons, source titles/URLs, page structure and correct-answer positions. The regression checks every locale/entry, dates, numeric quantities, GBP examples, three distinct answers/age challenges, stale English prose or feedback and rejected extra fields. English source copy is unchanged. The translations retain qualified historical claims, including the unbuilt complete Analytical Engine and Robert Stephenson’s design of Rocket, and distinguish debit from borrowing on credit.

Museum and short-read content drafts added on 29 October total 2,064 translated fragments across eight languages. Neither group is wired into public non-English routes yet. Discovery navigation, prompts, metadata, voice locale, localized rendering and per-language layout/editorial review remain pending. Existing message-key parity is not evidence that these integrations or the rest of the website/PDFs are complete.
