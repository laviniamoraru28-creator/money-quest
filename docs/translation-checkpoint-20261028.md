# Authored-content translation checkpoint

The owner's latest instruction requires all nine website languages for every deliverable, including printable PDFs, journal, parent guide and answers. The older English-only worksheet instruction is superseded.

`messages/*.json` already contains the legacy translated lesson/game/UI keys. It does not contain all new Library manuscripts, mini-biographies, Museum readings, lab age variants or the hardcoded parent-shop UI. Key parity must never be presented as complete translation of the website.

This checkpoint:
- Inventories 1,938 source text fragments in eight new authored-content groups, excluding names, identifiers, URLs, artwork paths and bibliography titles. This is not a complete UI/SEO/legal/PDF inventory.
- Adds draft Romanian text for all 10 mini-biographies (147 translated fragments), including titles, topics, age guidance, alt text, playful introductions, 30 factual/activity sections and 30 takeaways.
- Preserves proper names, image paths, source URLs, original bibliography titles, source-check dates and identifiers.
- Adds a source fingerprint per biography. Changed English copy makes the Romanian draft stale until reviewed. Structural validation rejects missing text, changed arrays or attempts to replace metadata.
- Does not activate Romanian routes or substitute partial Romanian content into an English interface. `ACTIVE_LOCALES` remains English until the whole locale is complete and reviewed.

Still required: remaining reading domains in Romanian; all new reading domains in Spanish/French/German/Italian/Portuguese/Dutch/Polish; all hardcoded interface and SEO text; parent commercial/privacy/recovery copy; all 20 printable activities, guides, answers and journal pages in each language; editorial and real-layout checks. Narration requires a separately verified voice per supported language.

The translation drafts and tests check coverage/structure/source synchronisation, not native-editor approval or learning quality. The English source and existing message files are preserved.
