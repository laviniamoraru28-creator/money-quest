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
| `track` | String | `"money-quest"` \| `"entrepreneur-quest"` \| `"leadership-quest"` \| `"library"` — which top-level Quest track (or the Library/Mentor Hall) this belongs to |
| `zone_id` | String | Which `ZoneData.zone_id` the quest is given/played in |
| `giver_npc_id` | String | Which NPC starts this quest when talked to. `""` for a Mentor Hall "Try This" quest, which is launched from `MentorCardPanel` directly rather than a zone NPC |
| `kind` | `QuestKind` enum | `LESSON` \| `EXPLORATION` \| `CHALLENGE` \| `SIMULATION` \| `MATCH` \| `SPOT` \| `ALLOCATE` \| `SORT` \| `MULTI_STEP`. Every kind except `SIMULATION` has a runner built — see `QuestManager._run_lesson_quest` / `_start_exploration_quest` / `_run_challenge_quest` / `_run_match_quest` / `_run_spot_quest` / `_run_allocate_quest` / `_run_sort_quest` / `_run_multi_step_quest` |
| `target_entry_id` | String | Only set when `kind == EXPLORATION` — the `BookData`/`MentorData`/`ExhibitData` `entry_id` the child must open to complete this quest (a Library/Museum "go discover something specific" prompt). See the dedicated section below |
| `lesson_data_path` | String | `res://` path to a `LessonData` resource (see `LESSON_DATA_FORMAT.md`). Only set when `kind == LESSON` |
| `intro_dialogue` | `Array[DialogueLine]` | Spoken lines between named characters, shown before `intro_text_key`/`challenge_choice` — the exact same shape `LessonData.intro_dialogue` uses. Only meaningful when `kind == CHALLENGE`; see `data/quests/lq-big-mistake-quest.tres` for a worked example (Priya/Oren reacting to the mistake before the player decides) |
| `intro_text_key` | String | A single narrator-style line, shown after `intro_dialogue` and before `diagnosis_choice`/`challenge_choice`, if set. Only meaningful when `kind == CHALLENGE` |
| `diagnosis_choice` | `DialogueChoice` (nullable) | Only set for a "business problem"-shaped quest (the real website's investigate-clues -> identify-a-cause -> choose-a-response flow). Shown, if set, after `intro_text_key` and before `challenge_choice`: a reflective, non-scored choice — its options' `ConsequenceEffect`s should have `coin_delta = 0`/`xp_delta = 0` (the runner pays no reward for this step; only `challenge_choice` does) and `consequence_text_key` set to the real cause's own feedback text. Left unset for every ordinary CHALLENGE quest; see `data/quests/eq-not-enough-customers-quest.tres` for a worked example |
| `challenge_choice` | `DialogueChoice` (nullable) | A single situation + 2-4 `ChoiceOption`s, each with a `ConsequenceEffect` — the exact same shape `LessonData.choice_point` uses. For `CHALLENGE` this is the whole quest's decision; for `MATCH`/`SPOT`/`ALLOCATE`/`SORT`/`MULTI_STEP` it's an optional follow-up decision shown after the mini-game resolves. See `data/quests/eq-handle-competition-quest.tres` for a worked CHALLENGE example |
| `second_challenge_choice` | `DialogueChoice` (nullable) | Only set when `kind == MULTI_STEP` — a second decision point shown after `challenge_choice` resolves, before the flat reward is paid (e.g. Leadership Quest's "Final Challenge," which follows its matching mini-game with two separate decisions) |
| `match_pairs` | `Array[MatchPairData]` | Only set when `kind == MATCH` or `MULTI_STEP` — the tap-tap matching mini-game's left/right pairs (e.g. a task matched to the teammate who's good at it, or — via `MatchPairData.right_text_key` — a situation matched to a plain emotion word, see Mind Lab's "Name That Feeling"). `MatchPanel` shuffles the right column and never uses drag. See `MatchPairData.gd` |
| `match_outro_text_key` | String | Shown once all pairs are matched, before `challenge_choice`. May be left empty |
| `spot_scenario_text_key` / `spot_items` | String / `Array[SpotItemData]` | Only set when `kind == SPOT` — the "spot the problem" mini-game's scenario text and selectable items (each with an `is_suspicious` flag). `SpotPanel` checks the selected set exactly and allows unlimited retry on a wrong submission. See `SpotItemData.gd` |
| `spot_outro_text_key` | String | Shown once the correct set is submitted, before `challenge_choice`. May be left empty |
| `allocate_total_amount` / `allocate_unit_label_key` / `allocate_categories` | int / String / `Array[AllocateCategoryData]` | Only set when `kind == ALLOCATE` — the budget-splitting mini-game's fixed total, unit label (e.g. "minutes"), and per-category target±tolerance. Plain integers, never currency. See `AllocateCategoryData.gd` |
| `allocate_outro_text_key` | String | Shown once the plan is confirmed, before `challenge_choice`. May be left empty |
| `sort_buckets` / `sort_items` | `Array[SortBucketData]` / `Array[SortItemData]` | Only set when `kind == SORT` — the tap-select-then-tap-bucket sorting mini-game's destination buckets and placeable items (each with a `correct_bucket_key`). See `SortBucketData.gd` / `SortItemData.gd` |
| `sort_outro_text_key` | String | Shown once every item is correctly sorted, before `challenge_choice`. May be left empty |
| `reward_message_key` | String | The reward line shown at the end of a non-`LESSON` quest. Only set for `CHALLENGE`/`MATCH`/`SPOT`/`ALLOCATE`/`SORT`/`MULTI_STEP` — a `LESSON`-kind quest's reward line is `LessonData.reward_message_key` instead |
| `xp_reward` / `coin_reward` | int | For a `LESSON`-kind quest, leave these at `0` — the wrapped `LessonData` already pays its own reward via `ProgressManager.complete_lesson()`, and `QuestManager` never double-pays. Every other kind (no wrapped `LessonData`) uses these directly, paid once as a flat reward after any mini-game/choice resolves |
| `skill_ids` | `Array[String]` | Which Smart Skills this quest exercises (see `docs/money-quest-world-architecture.md` Section 17) — tallied into `ProgressManager.skill_points`, never shown as a score |

## Mini-game quest kinds (MATCH / SPOT / ALLOCATE / SORT / MULTI_STEP)

These five kinds port the real website's own reusable mini-game
mechanics (`src/game-engine/mechanics/{Match,Spot,Allocate,Sort}Mechanic.tsx`)
into Godot, as autoloaded `CanvasLayer` panels (`MatchPanel`/`SpotPanel`/
`AllocatePanel`/`SortPanel`) mirroring `ChoicePanel`'s own conventions. All
five flow the same way: `intro_dialogue`/`intro_text_key` → the mini-game
itself → an optional outro line → an optional `challenge_choice` (and, for
`MULTI_STEP` only, a `second_challenge_choice`) → the flat
`xp_reward`/`coin_reward`. The mini-game's own completion pays no reward
on its own — only a `challenge_choice`'s per-pick `ConsequenceEffect`
deltas and the quest's flat reward ever add coins/xp. Every mini-game
panel is retry-until-correct (no hard-fail state), matching the real
website's own "always eventually succeeds" design. See
`data/quests/lq-meet-your-team-quest.tres` (MATCH),
`data/quests/lq-team-conflict-quest.tres` (SPOT),
`data/quests/lq-the-deadline-quest.tres` (ALLOCATE),
`data/quests/lq-pressure-test-quest.tres` (SORT), and
`data/quests/lq-final-challenge-quest.tres` (MULTI_STEP) for worked
examples.

## `EXPLORATION` kind: Library/Museum discovery prompts

Unlike every other kind, `EXPLORATION` is a standing invitation, not a
modal flow — a child offered "find a book about saving" should stay free
to keep browsing, talk to other NPCs, or leave the zone entirely without
the rest of the game staying "busy" in the meantime. So `start_quest()`
routes `EXPLORATION` quests to `QuestManager._start_exploration_quest()`
instead of the normal `_active`-guarded path: it shows `intro_text_key`
(the prompt) and returns immediately, tracking the quest id in
`_pending_exploration_quest_ids`. Whichever `BookInteraction`/
`MentorInteraction` the child opens next calls
`QuestManager.notify_entry_discovered(entry_id)`, which checks every
still-pending `EXPLORATION` quest for a `target_entry_id` match and, if
found, pays `xp_reward`/`coin_reward` and completes it — same as any
other kind's reward, just resolved from the world instead of a dialogue
choice. Talking to the same giver again while a prompt is still pending
just repeats `intro_text_key` as a reminder, rather than starting a
second copy or going silent. See `data/quests/lib-discover-saving-book.tres`
for a worked example.

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
