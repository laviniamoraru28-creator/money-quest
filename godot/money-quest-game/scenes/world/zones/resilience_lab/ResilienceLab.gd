extends Node3D
## ResilienceLab — Mind Lab's "Resilience Lab" room (Mind Lab Section 1,
## room 7): resilience (Section 2G) — mistakes are information, trying
## again, asking for help, changing strategy, and recognizing that
## sometimes changing direction is the smart call too (never simplistic
## "never give up" messaging). The Resilience Coach offers "The Tower
## Fell Down," a CHALLENGE-kind quest with no single correct option.

const TOWER_FELL_DOWN_QUEST_ID: String = "mindlab-tower-fell-down-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var resilience_coach: NPC = $ResilienceCoach


func _ready() -> void:
	camera_controller.target = player
	resilience_coach.talked_to.connect(_on_resilience_coach_talked_to)


func _on_resilience_coach_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TOWER_FELL_DOWN_QUEST_ID):
		DialogueBox.show_text("zone.resilience_lab.guide.already_done")
	else:
		QuestManager.start_quest(TOWER_FELL_DOWN_QUEST_ID)
