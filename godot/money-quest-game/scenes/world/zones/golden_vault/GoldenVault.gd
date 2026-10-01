extends Node3D
## GoldenVault — the persistent 3D zone where Maya's "Saving for Something
## Bigger" quest lives. Maya is a permanent resident NPC here, not a
## separate instanced "lesson room" the way the 2D prototype worked — see
## docs/money-quest-world-architecture.md's reasoning for why a lesson is
## now a Quest triggered from inside a persistent zone.

const MAYA_QUEST_ID: String = "builder-saving-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var maya: NPC = $Maya


func _ready() -> void:
	camera_controller.target = player
	maya.talked_to.connect(_on_maya_talked_to)


func _on_maya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MAYA_QUEST_ID):
		DialogueBox.show_text("zone.golden_vault.maya.already_done")
	else:
		QuestManager.start_quest(MAYA_QUEST_ID)
