extends Node3D
## HorizonPeaks — Money Quest's sixth zone (real website world id
## "horizon-peaks", real badge display name "Future Planner"), reached via
## a path inside Coin Cove rather than its own Hub portal — extending the
## Golden Vault → Market Town → Guardian Gate → Sky Exchange → Coin Cove
## → Horizon Peaks chain (see docs/money-quest-world-architecture.md
## Section 3).
## Finn — the real child named in the lesson's own story — gives
## "Planning a Few Steps Ahead" (builder-long_term_thinking-l1), ported
## via LessonData.choice_point with no mini-game, same shape as every
## other choice_point-only lesson so far.
##
## Aisha — the real teen named in the "Big Decisions, Long Timelines"
## story — is this zone's second resident, giving
## strategist-long_term_thinking-l1. Unlike every prior choice_point,
## this lesson's own text explicitly says there's no single right answer
## (spend a paycheck now vs. save some for later), so the choice_point
## directly mirrors the real decision instead of using a sidestep
## scenario — the quiz tests deliberateness, not which option was picked,
## so there's no risk of the choice contradicting the quiz's correct
## answer.

const LONG_TERM_THINKING_QUEST_ID: String = "builder-long-term-thinking-l1-quest"
const LONG_TERM_THINKING_STRATEGIST_QUEST_ID: String = "strategist-long-term-thinking-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var finn: NPC = $Finn
@onready var aisha: NPC = $Aisha


func _ready() -> void:
	camera_controller.target = player
	finn.talked_to.connect(_on_finn_talked_to)
	aisha.talked_to.connect(_on_aisha_talked_to)


func _on_finn_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(LONG_TERM_THINKING_QUEST_ID):
		DialogueBox.show_text("zone.horizon_peaks.finn.already_done")
	else:
		QuestManager.start_quest(LONG_TERM_THINKING_QUEST_ID)


func _on_aisha_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(LONG_TERM_THINKING_STRATEGIST_QUEST_ID):
		DialogueBox.show_text("zone.horizon_peaks.aisha.already_done")
	else:
		QuestManager.start_quest(LONG_TERM_THINKING_STRATEGIST_QUEST_ID)
