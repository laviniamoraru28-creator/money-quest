class_name QuestData
extends Resource
## QuestData — the thing a child actually "picks up" in the world. Wraps
## an optional LessonData reference so a lesson's educational content
## never duplicates between "where it lives in the world" (this resource)
## and "what it says" (LessonData) — see docs/money-quest-world-
## architecture.md Section 4.

enum QuestKind { LESSON, EXPLORATION, CHALLENGE, SIMULATION, MATCH, SPOT, ALLOCATE, SORT, MULTI_STEP }

@export var quest_id: String = ""
@export var title_key: String = ""
@export var description_key: String = ""
@export var educational_objective_key: String = ""   # "" for a pure exploration quest

## "money-quest" | "entrepreneur-quest" | "leadership-quest" | "mind-lab" —
## which Quest track this belongs to. Not yet used for anything beyond
## organization/future filtering, but set from day one so content never
## needs retrofitting once more destinations exist.
@export var track: String = "money-quest"

@export var zone_id: String = ""
@export var giver_npc_id: String = ""

@export var kind: QuestKind = QuestKind.LESSON

## Only set when kind == EXPLORATION — a "go discover something specific
## in the world" prompt (e.g. Library discovery challenges: "find a book
## about saving"), the entry_id of the BookData/ExhibitData/MentorData
## the child must interact with to complete it. Unlike every other quest
## kind, EXPLORATION never holds QuestManager busy waiting — see
## QuestManager._start_exploration_quest()'s own comment for why.
@export var target_entry_id: String = ""

## Only set when kind == LESSON. LessonData itself knows nothing about
## quests, zones, or NPCs — this is the ONE place a lesson and its
## in-world placement connect.
@export var lesson_data_path: String = ""

## Only set when kind == CHALLENGE — a standalone situation-and-consequence
## decision with no wrapped LessonData (used for Entrepreneur Quest/
## Leadership Quest content ported from the website's own "mission"-shaped
## decision events, which are already exactly this shape — see
## docs/money-quest-world-architecture.md Section 4). Shown, in order,
## before `challenge_choice`: `intro_dialogue` (spoken lines, e.g. two
## characters reacting to a situation) then `intro_text_key` (a single
## narrator-style line, no speaker) — either or both may be empty.
@export var intro_dialogue: Array[DialogueLine] = []
@export var intro_text_key: String = ""

## Only set for a "business problem"-shaped CHALLENGE quest (the real
## website's investigate-clues -> identify-a-cause -> choose-a-response
## flow, e.g. Entrepreneur Quest's v2 Business Problems). Shown, if set,
## after `intro_text_key` and before `challenge_choice`: a reflective,
## non-scored choice whose options should each carry a
## `ConsequenceEffect` with `coin_delta = 0` and `xp_delta = 0` (no
## reward for picking a cause — only `challenge_choice`'s response pays
## the quest's reward), and whose `consequence_text_key` is the real
## cause's own feedback text. Left null for every ordinary CHALLENGE
## quest (the vast majority) — no existing quest needs to change.
@export var diagnosis_choice: DialogueChoice

@export var challenge_choice: DialogueChoice

## Only set when kind == MULTI_STEP — a second DialogueChoice shown after
## `challenge_choice` resolves, before the flat reward is paid (e.g.
## Leadership Quest's "Final Challenge," which follows its matching
## mini-game with two separate decision points rather than one).
@export var second_challenge_choice: DialogueChoice

## Only set when kind == MATCH — the matching mini-game's pairs (e.g.
## Leadership Quest's "Meet Your Team," matching a task to the teammate
## who's good at it). Shown after `intro_dialogue`/`intro_text_key` and
## before `challenge_choice`. See MatchPairData.gd.
@export var match_pairs: Array[MatchPairData] = []
## Shown once all pairs are matched, before `challenge_choice`. May be empty.
@export var match_outro_text_key: String = ""

## Only set when kind == SPOT — the "spot the problem" mini-game (e.g.
## Leadership Quest's "The Team Conflict"). Shown after `intro_dialogue`/
## `intro_text_key` and before `challenge_choice`. See SpotItemData.gd.
@export var spot_scenario_text_key: String = ""
@export var spot_items: Array[SpotItemData] = []
## Shown once the correct set is submitted, before `challenge_choice`. May be empty.
@export var spot_outro_text_key: String = ""

## Only set when kind == ALLOCATE — the budget-splitting mini-game (e.g.
## Leadership Quest's "The Deadline," splitting time across tasks). Plain
## integers, no currency formatting. See AllocateCategoryData.gd.
@export var allocate_total_amount: int = 0
@export var allocate_unit_label_key: String = ""
@export var allocate_categories: Array[AllocateCategoryData] = []
## Shown once the plan is confirmed, before `challenge_choice`. May be empty.
@export var allocate_outro_text_key: String = ""

## Only set when kind == SORT — the tap-select-then-tap-bucket sorting
## mini-game (e.g. Leadership Quest's "The Pressure Test"). See
## SortBucketData.gd / SortItemData.gd.
@export var sort_buckets: Array[SortBucketData] = []
@export var sort_items: Array[SortItemData] = []
## Shown once every item is correctly sorted, before `challenge_choice`. May be empty.
@export var sort_outro_text_key: String = ""

## Only set when kind == CHALLENGE — LESSON-kind quests get their reward
## line from the wrapped LessonData instead (see `reward_message_key` on
## LessonData).
@export var reward_message_key: String = ""

## For LESSON-kind quests, leave these at 0 — the wrapped LessonData pays
## its own reward via ProgressManager.complete_lesson() and QuestManager
## never double-pays. CHALLENGE-kind quests (no wrapped LessonData) use
## these directly — see data/schemas/QUEST_DATA_FORMAT.md.
@export var xp_reward: int = 0
@export var coin_reward: int = 0
## Which Smart Skill(s) this quest develops (see ProgressManager.skill_points)
## — a quest "demonstrates" a skill by listing it; no separate grading engine.
@export var skill_ids: Array[String] = []
