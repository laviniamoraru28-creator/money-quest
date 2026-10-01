class_name LessonData
extends Resource
## LessonData — the data-driven definition of one lesson.
##
## Field-for-field mirrors the website's own LessonContent shape
## (src/content/curriculum/types.ts) wherever a Godot equivalent makes
## sense, specifically so a content author moving between the two systems
## recognizes the same concepts under the same names (see
## docs/godot-architecture-plan.md Section 9 for the full rationale).
##
## A new lesson is ONE .tres resource file like this — adding lesson 31
## should never require touching LessonManager.gd or any scene script.

## Structural fields — match the website's curriculum/structures.ts ids
## exactly so the two systems can be cross-referenced by a content author.
@export_group("Identity")
@export var lesson_id: String = ""          # e.g. "builder-saving-l1"
@export var age_band: String = "builder"    # "explorer" | "builder" | "strategist"
@export var world_id: String = ""           # e.g. "golden-vault"
@export var topic_id: String = ""           # e.g. "saving"

@export_group("Rewards")
@export var xp_reward: int = 10
@export var coin_reward: int = 10           # virtual coins, see VirtualMoney.gd

@export_group("Core concept")
@export var learning_objective_key: String = ""
@export var key_concept_key: String = ""
@export var vocabulary: Array[VocabTerm] = []

@export_group("Opening scene")
## Shown before the choice point — the lesson's "story" beat, as a short
## sequence of dialogue lines (narrator and/or NPC), not a wall of text.
@export var intro_dialogue: Array[DialogueLine] = []

@export_group("Decision")
## The lesson's single central decision — see DialogueChoice.gd for why
## this is one choice, not a branching tree, for this lesson model.
@export var choice_point: DialogueChoice

@export_group("Explanation")
## Shown AFTER the consequence plays out — the website's `explanation`
## field: the financial principle behind what the child just experienced,
## never shown before the choice (experience first, label second — see
## project brief Phase 6).
@export var explanation_key: String = ""

@export_group("Quiz")
## A genuine factual check, separate from the choice_point's open-ended
## decision (see ChoiceOption.gd's comment on why these are kept distinct).
@export var quiz_question_key: String = ""
@export var quiz_option_keys: Array[String] = []
@export var quiz_correct_index: int = 0
@export var quiz_explanation_key: String = ""
@export var quiz_success_feedback_key: String = ""
@export var quiz_retry_feedback_key: String = ""

@export_group("Reward")
@export var reward_message_key: String = ""

@export_group("Presentation")
## Which scene under scenes/quests/<lesson_id>/ provides this lesson's
## stage content (typically a mini-game — the player/NPC/zone staging
## itself now lives in the persistent zone scene, not here; see
## docs/money-quest-world-architecture.md). Loaded by LessonManager at
## runtime via load(). Empty for a pure dialogue+choice lesson with no
## hands-on stage.
@export var stage_scene_path: String = ""
