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

const LONG_TERM_THINKING_QUEST_ID: String = "builder-long-term-thinking-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var finn: NPC = $Finn


func _ready() -> void:
	camera_controller.target = player
	finn.talked_to.connect(_on_finn_talked_to)


func _on_finn_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(LONG_TERM_THINKING_QUEST_ID):
		DialogueBox.show_text("zone.horizon_peaks.finn.already_done")
	else:
		QuestManager.start_quest(LONG_TERM_THINKING_QUEST_ID)
