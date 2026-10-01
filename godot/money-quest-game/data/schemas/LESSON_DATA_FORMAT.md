# LessonData format

This documents the shape every lesson's `.tres` file follows — see
`scripts/core/LessonData.gd` for the authoritative field list and
`data/lessons/builder_saving_l1.tres` for a complete worked example.

A new lesson is **one `.tres` resource file**. Adding lesson 31 should
never require changing `LessonManager.gd` or any core script — only
content.

## Fields

| Field | Type | Notes |
|---|---|---|
| `lesson_id` | String | Matches the website's id exactly, e.g. `"builder-saving-l1"` |
| `age_band` | String | `"explorer"` \| `"builder"` \| `"strategist"` |
| `world_id` | String | e.g. `"golden-vault"` — see `src/content/worlds.ts` on the website for the real 7 ids |
| `topic_id` | String | e.g. `"saving"` |
| `xp_reward` / `coin_reward` | int | Virtual only — see `scripts/core/VirtualMoney.gd` |
| `learning_objective_key` / `key_concept_key` | String | Translation keys, not literal text |
| `vocabulary` | `Array[VocabTerm]` | `{term_key, definition_key}` pairs, lesson-scoped |
| `intro_dialogue` | `Array[DialogueLine]` | `{speaker_id, text_key}` — the lesson's story, as spoken lines |
| `choice_point` | `DialogueChoice` (nullable) | A single reflective decision with 2-4 `ChoiceOption`s, each with a `ConsequenceEffect`. **Leave null** if the lesson's real choice-and-consequence moment lives inside its stage scene's mini-game instead (see `builder_saving_l1.tres`) |
| `explanation_key` | String | Shown AFTER the experience, never before |
| `quiz_question_key` / `quiz_option_keys` / `quiz_correct_index` / `quiz_explanation_key` | — | A genuine factual check, retryable, never shaming |
| `quiz_success_feedback_key` / `quiz_retry_feedback_key` | String | — |
| `reward_message_key` | String | — |
| `stage_scene_path` | String | `res://` path to this lesson's bespoke scene, or empty for a pure dialogue+choice lesson with no walk-around component |

## Rule: content is never hard-coded

Every `*_key` field is a translation key resolved through
`Localization.t(key)` at display time — never literal English (or any
other language) baked into the `.tres` file or a script. See
`localization/translations.csv`.

## Rule: a stage scene's one contract

If `stage_scene_path` is set, that scene's **root node must emit a
`stage_finished` signal** exactly once when its hands-on content (walking
around, talking to an NPC, playing a mini-game) is done.
`LessonManager._run_stage_scene()` awaits that signal and then continues
into `choice_point` → `explanation_key` → quiz → reward. The stage scene
may also accept `dialogue_box` / `choice_panel` properties, set
automatically by `LessonManager` if present — see `BuilderSavingL1.gd`.

## Choosing where the "choice and consequence" moment lives

Most lessons should use `choice_point` directly — it's the simplest,
default path (see `docs/godot-architecture-plan.md` Section 9). Use a
bespoke stage scene + mini-game instead when the real lesson content
describes a decision repeated over time (several weeks, several rounds) —
`builder_saving_l1` is the first example of this second pattern; see
`scripts/minigames/SavingsAllocationMiniGame.gd`.
