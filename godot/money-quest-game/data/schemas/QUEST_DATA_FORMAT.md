# QuestData format

This documents the shape every quest's `.tres` file follows — see
`scripts/quests/QuestData.gd` for the authoritative field list and
`data/quests/builder-saving-l1-quest.tres` for a complete worked example.

A new quest is **one `.tres` resource file**. Adding quest 22 should never
require changing `QuestManager.gd` — only content.

## Fields

| Field | Type | Notes |
|---|---|---|
| `quest_id` | String | Stable, lowercase-hyphenated |
| `title_key` / `description_key` / `educational_objective_key` | String | Translation keys, never literal text |
| `track` | String | `"money-quest"` \| `"entrepreneur-quest"` \| `"leadership-quest"` — which top-level Quest track this belongs to |
| `zone_id` | String | Which `ZoneData.zone_id` the quest is given/played in |
| `giver_npc_id` | String | Which NPC starts this quest when talked to |
| `kind` | `QuestKind` enum | `LESSON` \| `EXPLORATION` \| `CHALLENGE` \| `SIMULATION`. Only `LESSON` has a runner built this phase — see `QuestManager._run_lesson_quest` |
| `lesson_data_path` | String | `res://` path to a `LessonData` resource (see `LESSON_DATA_FORMAT.md`). Only meaningful when `kind == LESSON` |
| `xp_reward` / `coin_reward` | int | For a `LESSON`-kind quest, leave these at `0` — the wrapped `LessonData` already pays its own reward via `ProgressManager.complete_lesson()`, and `QuestManager` never double-pays. Non-lesson kinds (once built) will use these directly |
| `skill_ids` | `Array[String]` | Which Smart Skills this quest exercises (see `docs/money-quest-world-architecture.md` Section 17) — tallied into `ProgressManager.skill_points`, never shown as a score |

## Rule: a quest wraps a lesson, it doesn't duplicate one

`QuestData` is a thin pointer to an existing `LessonData` for `kind ==
LESSON` — the lesson's own content (dialogue, vocabulary, quiz, mini-game)
is authored once and never copied. This is also how the same curriculum
content could, in principle, back both the website's lesson player and
Money Quest World without maintaining it twice.

## Rule: only one quest runs at a time

`QuestManager.start_quest()` ignores a second call while one is already
active (mirrors there only ever being one child talking to one NPC at
once) — see its own comment.
