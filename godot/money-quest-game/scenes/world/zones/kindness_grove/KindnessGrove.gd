extends Node3D
## KindnessGrove — Money Quest's seventh and final zone (real website
## world id "kindness-grove", real badge display name "Giving Hero"),
## reached via a path inside Horizon Peaks rather than its own Hub portal
## — extending the Golden Vault → Market Town → Guardian Gate →
## Sky Exchange → Coin Cove → Horizon Peaks → Kindness Grove chain (see
## docs/money-quest-world-architecture.md Section 3). This completes all
## 7 of the real website's Money Quest zones.
##
## Omar — the real child named in the "Giving on Purpose" story — gives
## builder-giving-l1. His name coincidentally matches Sky Exchange's Omar
## (an unrelated real character from a different real source text) —
## harmless, for the same reason the earlier Theo and Priya coincidences
## were: quest-completion state keys off quest_id, not npc_id, and the
## two zones are never loaded at the same time.

const GIVING_QUEST_ID: String = "builder-giving-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var omar: NPC = $Omar


func _ready() -> void:
	camera_controller.target = player
	omar.talked_to.connect(_on_omar_talked_to)


func _on_omar_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GIVING_QUEST_ID):
		DialogueBox.show_text("zone.kindness_grove.omar.already_done")
	else:
		QuestManager.start_quest(GIVING_QUEST_ID)
