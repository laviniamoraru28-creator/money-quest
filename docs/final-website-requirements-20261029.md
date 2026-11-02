# Final website handoff requirements

Owner instruction, 29 October 2026: Codex handles the remaining Money Quest website work, final all-language review, SEO and Namecheap delivery. Claude's work is confined to the separate Godot game. Do not change the Godot repository or game-hosting files as part of this website handoff.

## Required order

1. Finish the requested website features and educational content while preserving existing lessons, worlds, labs, Library, Museum, free resources, accessibility and Explorer/Builder/Strategist levels.
2. Finish and recheck every language edition, including all printable products and parent material. Review the actual rendered experience, not only the existence of JSON keys.
3. Complete the final SEO articles and technical SEO against that finished content and those reviewed language editions.
4. Build and rehearse the exact final release, then deliver the Namecheap upload archive, checksums and practical instructions. Do not label an intermediate snapshot as the final upload ZIP.

Website code remains on feature/review branches. No main merge, hosting change, deployment or paid-provider purchase follows automatically from this work order. Continue the work already authorized without repeatedly asking about routine implementation choices. Any owner information needed for a real commercial launch should be identified concretely; a free release can retain disabled purchasing.

## Full translation and language review

The scope is English, Romanian, Spanish, French, German, Italian, Portuguese, Dutch and Polish. It includes all lesson/game/simulator and age-variant text; original books, biographies, Museum, short reads, labs and external-book introductions; navigation, buttons, status/error/empty states, questions/answers/feedback; narration and captions; alternative text and communication support; reviews, parent/shop/consumer/privacy/recovery copy; SEO articles, metadata and structured-data text; every public/private printable, journal, guide and answer key.

Use consistent regional editions: en-GB, ro-RO, es-ES, fr-FR, de-DE, it-IT, pt-PT, nl-NL and pl-PL. These are editorial targets, not new URL segments and not a claim that language uniquely identifies a country. Do not mix European and Brazilian Portuguese or several English/Spanish conventions accidentally. If the intended audience changes, review the whole affected edition consistently.

For each edition, review meaning against the English source and rewrite literal or awkward translations naturally. Check child-appropriate wording separately at all three levels. Check agreement, tense, word order, pronouns, idioms, diacritics, capitals, spacing, quotation marks, apostrophes, questions/exclamations, lists and sentence punctuation in that edition. Follow a consistent local style rather than applying English punctuation to every language. Preserve proper names and original published book/source titles where appropriate.

Check prices, GBP examples, numeric quantities, dates and answer keys against the source; translate the presentation without silently changing the economics or correct answer. Separate fictional practice amounts from real parent-product prices. Use locale-aware display formatting where appropriate. Keep ICU placeholders, identifiers, slugs, source links and code intact. Translation tooling must not rewrite these as ordinary prose.

Then check the live-rendered language: no unexplained English fallback, mixed-language prompts, wrong speech locale, raw translation keys, clipped text, broken line wrapping or missing PDF glyphs. Verify narrow screens, zoom and keyboard/screen-reader names. Listen to representative narration in each supported language and confirm the voice actually matches it. Unavailable voice support needs an understandable fallback, not a claim that every device has the same voice.

Automated checks can identify missing keys, stale source hashes, broken placeholders, amounts, structural differences and layout regressions. They do not establish natural grammar or complete editorial review. Record editorial review by file/domain, locale and source revision, distinguishing completed, needs revision and not reviewed. Do not invent native-speaker or professional accreditation for an AI review. Recheck affected translations after any later English/source change.

## SEO articles: competencies grounded in real activities

The final articles must explain both the competency and a concrete activity available on this website, with a useful internal link and an age-appropriate example. Map each proposed claim to the actual final content before publishing. Candidate domains include financial literacy, numeracy, planning and goal setting, critical thinking and checking evidence, problem solving, creativity, entrepreneurship, collaboration and leadership, emotional awareness and asking for support, digital safety and AI literacy, communication and practical independence.

Describe opportunities to practise and learn. Do not promise guaranteed gains, IQ improvement, therapy, autism treatment, school attainment or real-life transfer that has not been demonstrated for Money Quest. Do not describe an activity or adaptation that the website does not actually offer. Parent-facing explanations should distinguish the picture-supported Explorer pilot from a completed adaptation of every lesson.

Update relevant existing articles naturally and add a broader competencies article if the final content warrants it. Avoid repetitive keyword lists or identical boilerplate appended to all six articles. Cite suitable authoritative evidence for educational claims and retain its limitations; general evidence is not an evaluation of this product. Each language needs a natural local-language article, not a word-for-word translation of an English keyword list.

Check titles, descriptions, headings, links, image descriptions, sitemap, robots, canonicals, language alternates and structured data against active, complete editions and the real production domain. Review stale or absolute privacy/outcome claims as well as new copy. Search visibility cannot be guaranteed by adding competency keywords.

## Upload handoff

Follow docs/deployment-runbook.md using Node 24 and the existing custom server. The final archive must identify the exact source revision, runtime and build, include the matching offline content, and contain no credentials or private customer/product data. Rehearse installation and startup from the extracted archive, rather than testing only the developer checkout. Include short instructions usable by the owner for Namecheap upload, environment configuration, restart, checks and rollback.

No final ZIP is complete until the requested content, translation, SEO and release verification work is complete. The current English-only activation, incomplete full-site/PDF translations, voice/video limitations and commercial prerequisites remain visible work items, not completed checks.
