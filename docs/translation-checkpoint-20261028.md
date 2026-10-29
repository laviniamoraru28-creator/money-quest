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

## Romanian laboratories and external-book introductions, 29 October 2026

All three laboratories now have Romanian text drafts: 22 tasks with the original Builder readings, separate authored Explorer and Strategist readings, and 66 practical challenges. This is 490 text fragments, covering task/lab headings, introductions, situations, answer choices, explanations and activities. Short concrete language is retained for Explorer; Strategist preserves uncertainty, evidence, opportunity costs and consent/support nuances rather than merely lengthening the simpler text.

Twelve external-book introductions add another 111 Romanian fragments: age guidance and its attribution, topic labels, descriptions, three ideas per book, discussion prompts and external-link labels. The actual published titles, credited authors/illustrators/publishers, source URLs and original verification dates remain unchanged. No Romanian-language edition, availability or newly checked source is claimed. The count previously included twelve canonical external published titles as translatable prose; the new projection correctly excludes them. The source count therefore changes from 1,926 to 1,914 without removing any content or title.

Romanian drafts now cover all eight authored-content groups in this inventory (1,914 text fragments): ten original books, ten biographies, Museum rooms, eight short reads, base laboratory tasks, laboratory age readings, discovery feedback/challenges and twelve external-book introductions. This is not a complete website translation: hardcoded/shared UI, metadata/SEO, parent-commercial text, all printable products, narration, localized rendering and all-language editorial/layout checks remain unfinished. Other languages still need their missing content domains. English remains the only active edition.

The two new draft groups received an AI bilingual writing/revision pass for natural Romanian, spelling, diacritics, punctuation, age/register consistency and fidelity to the English content. This is not a native-speaker or professional-editor certification, owner signoff, rendered-language evaluation or final proofread of every existing Romanian text. Sterling amounts use Romanian decimal commas and suffix currency placement in these drafts (for example 2,40 £); 80p is written as 80 de pence. The numeric/currency checks compare values rather than forcing English typography onto Romanian.

Each new group has a typed source projection/adapter and a per-entry source-fingerprint manifest. Only translatable fields may be replaced; identifiers, answer indices and bibliography cannot be overwritten. `labTaskAtLevel` now accepts an optional collection of localized age readings; existing three-argument English callers keep the same default. Tests exercise all three levels with the Romanian collection so future localized callers do not accidentally merge English age readings into Romanian tasks.

Verification covers complete arrays/fields, three distinct choices and age readings, task IDs, answer positions, age guidance, unchanged quantities and sterling/pence values, Unicode Romanian diacritics, stale English changes (including age-variant explanations), rejected metadata replacements and unchanged public locale activation. The readiness inventory records coverage separately from editorial and rendering status. Execution evidence is recorded with the resulting PR commit/run; these tests do not themselves certify linguistic quality or physical-device usability.
