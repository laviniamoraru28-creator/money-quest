# EntryData format (Library / Museum / Mentors / Dictionary)

This documents the shape of Money Quest World's "Browse" family — content
a child discovers by walking up and reading/hearing it, with no choice or
consequence of its own (that's what `QuestData`/`DialogueChoice` are for).
See `scripts/library/EntryData.gd`, `BookData.gd`, `ExhibitData.gd`,
`MentorData.gd`, `DictionaryTermData.gd` for the authoritative field lists,
and `data/dictionary/goal.tres` for a complete worked example.

**Status this phase: foundation only.** The schema below is built and
ready; `data/library/` and `data/museum/` are still empty (zero books,
exhibits, or mentors) — see the rules below for why, and
`data/dictionary/` for the one content type that's safe to populate now.

## `EntryData` (base — never used directly)

| Field | Type | Notes |
|---|---|---|
| `entry_id` | String | Stable, lowercase-hyphenated |
| `title_key` / `summary_key` | String | Translation keys. `summary_key` is the short text shown first |
| `detail_key` | String | The fuller text, shown only on "read more" |
| `source_url` | String | Library only: a REAL, verifiable link. Empty until approved |
| `icon_key` | String | Optional |

## `BookData` (Library) — adds

| Field | Type | Notes |
|---|---|---|
| `author_key` | String | Empty until a real, verifiable author is approved |
| `recommended_age_band` | String | `"explorer"` \| `"builder"` \| `"strategist"` |

## `ExhibitData` (Museum) — adds

| Field | Type | Notes |
|---|---|---|
| `exhibit_category` | String | `"money-through-time"` \| `"business-stories"` \| `"failure-museum"` \| `"great-ideas"` \| `"leadership-stories"` \| `"innovation"` |
| `what_happened_key` / `what_went_wrong_key` / `what_could_differ_key` / `what_we_learn_key` | String | Only set when `exhibit_category == "failure-museum"` — maps to the brief's required 4-part structure |

## `MentorData` (Library sub-area) — adds

| Field | Type | Notes |
|---|---|---|
| `known_for_key` | String | What they did |
| `mistake_or_challenge_key` | String | A real mistake or challenge they faced |
| `lesson_key` | String | What they learned |
| `small_challenge_key` | String | A small challenge for the child, inspired by them |

## `DictionaryTermData` (not an `EntryData` subclass — simpler shape)

| Field | Type | Notes |
|---|---|---|
| `term_key` / `definition_key` | String | Translation keys |
| `related_lesson_ids` | `Array[String]` | Which lessons use this term |

## Rule: books/exhibits/mentors are never invented

**No book, author, historical story, or mentor biography may be added
without being real, verifiable, and explicitly approved first.** Until
then, `data/library/` and `data/museum/` stay empty — an empty folder is
the correct, honest state, not a gap to quietly fill with placeholder
content. This is why no Library or Museum zone is built yet either: a
walkable zone with nothing real to discover in it would be worse than no
zone at all.

## Rule: Dictionary content is different — reuse, don't invent

A dictionary term is **not** new content — it's the same term/definition
already authored for a real lesson's `LessonData.vocabulary`
(`VocabTerm`). `data/dictionary/goal.tres` and `data/dictionary/trade-
off.tres` point their `term_key`/`definition_key` at
`curriculum.builder-saving-l1.vocabulary.0`/`.1` verbatim — the exact same
translation keys the lesson itself uses, never a new definition written
for Godot. Adding dictionary term N for an already-shipped lesson's
vocabulary is always safe; inventing a *new* definition that doesn't exist
in any lesson is not.
