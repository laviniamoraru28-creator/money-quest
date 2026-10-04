# EntryData format (Library / Museum / Mentors / Dictionary)

This documents the shape of Money Quest World's "Browse" family — content
a child discovers by walking up and reading/hearing it, with no choice or
consequence of its own (that's what `QuestData`/`DialogueChoice` are for).
See `scripts/library/EntryData.gd`, `BookData.gd`, `ExhibitData.gd`,
`MentorData.gd`, `DictionaryTermData.gd` for the authoritative field lists,
and `data/dictionary/goal.tres` for a complete worked example.

**Status: Library, Mentor Hall, Museum, and Mind Lab's exploration-only
content are all now populated.** `data/library/` holds 8 real, sourced
books, `data/mentors/` holds 5 real, sourced mentors, `data/museum/`
holds 16 real, sourced exhibits across the Museum's 10 rooms, and
`data/mindlab/` holds 7 `MindLabEntryData` entries (3 calming strategies,
4 "mind facts") across Mind Lab's Calm & Reset Lab and Discovery Room
(see each file's own `source_url`/`source_name`/`source_type`/
`verification_date`). See the rules below for why an empty folder is the
correct, honest state until real content is approved, and
`data/dictionary/` for the one content type that was always safe to
populate.

## `EntryData` (base — never used directly)

| Field | Type | Notes |
|---|---|---|
| `entry_id` | String | Stable, lowercase-hyphenated |
| `title_key` / `summary_key` | String | Translation keys. `summary_key` is the short text shown first |
| `detail_key` | String | The fuller text, shown only on "read more" |
| `source_url` | String | A REAL, verifiable link. Empty until approved — see the two Mentor Hall entries (Sara Blakely, Daymond John) that still need one found and added |
| `icon_key` | String | Optional |
| `source_name` | String | e.g. `"DK (Dorling Kindersley)"`, `"NASA"` — who/what the facts came from |
| `source_type` | String | `"official_publisher"` \| `"museum"` \| `"government"` \| `"university"` \| `"reputable_organization"` |
| `verification_date` | String | `"YYYY-MM-DD"` — when `source_url` was last checked. Empty alongside an empty `source_url` |

Sourcing fields are shown in the UI (`BookCardPanel`/`MentorCardPanel`)
behind an optional "About this" / "Source" toggle, never as the first
thing a child sees (project brief Section 22).

## `BookData` (Library) — adds

| Field | Type | Notes |
|---|---|---|
| `author_key` | String | Empty until a real, verifiable author is approved |
| `recommended_age_band` | String | `"explorer"` \| `"builder"` \| `"strategist"` |
| `discover_point_keys` | `Array[String]` | 3-5 short "what you'll discover" bullets — original framing lines, never copied book text |
| `cross_link_zone_id` | String | A Hub zone id for "Explore this topic in ___" (reuses `WorldManager.travel_to()` directly). `""` when no corresponding Quest-track zone exists |

## `ExhibitData` (Museum) — adds

| Field | Type | Notes |
|---|---|---|
| `exhibit_category` | String | `"money-through-time"` \| `"business-stories"` \| `"failure-museum"` \| `"great-ideas"` \| `"leadership-stories"` \| `"innovation"` |
| `what_happened_key` / `what_went_wrong_key` / `what_could_differ_key` / `what_we_learn_key` | String | Only set when `exhibit_category == "failure-museum"` — maps to the brief's required 4-part structure |

## `MentorData` (Mentor Hall, inside the Library) — adds

| Field | Type | Notes |
|---|---|---|
| `known_for_key` | String | What they did |
| `mistake_or_challenge_key` | String | A real mistake or challenge they faced |
| `lesson_key` | String | What they learned |
| `small_challenge_key` | String | A short framing line for the "Try This" mini-quest, worded as "try a challenge inspired by this skill" — never as the real person addressing the child directly. `""` when no mini-quest exists for this mentor yet |
| `skill_ids` | `Array[String]` | Which Smart Skills this mentor models (same vocabulary as `QuestData.skill_ids`) |
| `cross_link_zone_id` | String | A Hub zone id for "Explore this" — `""` when no existing zone is a strong enough fit (left empty rather than forced) |
| `try_quest_id` | String | A `QuestData` id for the "Try a challenge inspired by this skill" mini-quest, launched by `MentorCardPanel` via `QuestManager.start_quest()`. `""` when none exists yet |

## `MindLabEntryData` (Mind Lab's Calm & Reset Lab / Discovery Room) — adds

| Field | Type | Notes |
|---|---|---|
| `entry_category` | String | `"calm-strategy"` \| `"mind-fact"` |
| `cross_link_zone_id` | String | A Hub zone id for an optional "Want to explore a calm space?"-style button — `""` when no cross-link applies |

Unlike every other `EntryData` subclass, a `MindLabEntryInteraction`
never calls `QuestManager.notify_entry_discovered()` — no Mind Lab entry
is ever the target of an `EXPLORATION` quest's `target_entry_id` built
around *this specific entry being found*, since nothing here is meant to
be a "go find this one thing" prompt (see `MindLabEntryInteraction.gd`'s
own comment). The one `EXPLORATION` quest Mind Lab does use (Calm &
Reset Lab's "Notice Something Around You") is a gentle, fully optional
invitation layered on top of entries that are already freely walkable
and interactable without it.

## `DictionaryTermData` (not an `EntryData` subclass — simpler shape)

| Field | Type | Notes |
|---|---|---|
| `term_key` / `definition_key` | String | Translation keys |
| `related_lesson_ids` | `Array[String]` | Which lessons use this term |

## Rule: books/exhibits/mentors are never invented

**No book, author, historical story, or mentor biography may be added
without being real, verifiable, and explicitly approved first.** The 8
books in `data/library/` and 5 mentors in `data/mentors/` were added only
once explicitly supplied by name/author/publisher/official source —
every biography is an original paraphrase (never an invented quote), and
every "Try This" mini-quest is framed as "inspired by," never as the
real person addressing the child (see `MentorData.gd`'s own comment).
Two mentors (Sara Blakely, Daymond John) still have `source_url = ""`:
their facts are well-documented and widely repeated, but no specific
official source page was supplied or could be verified at the time they
were added (this project's environment had no outbound network access
to look one up) — finding and adding a real `source_url` for each is
still open work, tracked here rather than filled with a guessed link.
`data/museum/` and `data/mindlab/` are now populated the same way — only
once real, verifiable facts existed to put in them. An empty folder
remains the correct, honest state for any future content type before
that point: a walkable zone with nothing real to discover in it would be
worse than no zone at all.

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
