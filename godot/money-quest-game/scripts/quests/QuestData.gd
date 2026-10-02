class_name QuestData
extends Resource
## QuestData — the thing a child actually "picks up" in the world. Wraps
## an optional LessonData reference so a lesson's educational content
## never duplicates between "where it lives in the world" (this resource)
## and "what it says" (LessonData) — see docs/money-quest-world-
## architecture.md Section 4.

enum QuestKind { LESSON, EXPLORATION, CHALLENGE, SIMULATION }

@export var quest_id: String = ""
@export var title_key: String = ""
@export var description_key: String = ""
@export var educational_objective_key: String = ""   # "" for a pure exploration quest

## "money-quest" | "entrepreneur-quest" | "leadership-quest" — which Quest
## track this belongs to. Not yet used for anything beyond organization/
## future filtering, but set from day one so content never needs
## retrofitting once Entrepreneur Quest and Leadership Quest zones exist.
@export var track: String = "money-quest"

@export var zone_id: String = ""
@export var giver_npc_id: String = ""

@export var kind: QuestKind = QuestKind.LESSON

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
@export var challenge_choice: DialogueChoice

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
