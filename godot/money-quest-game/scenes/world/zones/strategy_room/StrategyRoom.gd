extends Node3D
## StrategyRoom — Leadership Quest's third zone, reached via a path inside
## Team Challenge rather than its own Hub portal — the same "track grows
## its own zone graph beyond one zone" pattern Money Quest's Guardian Gate
## and Entrepreneur Quest's Workshop already proved (see docs/money-
## quest-world-architecture.md Section 3). Nadia gives "The Better Idea"
## (ports the website's real `better-idea-choice` decision event), a
## CHALLENGE-kind quest reusing the exact pipeline "The Big
## Mistake"/"The Angry Customer" already proved — no new systems.

const BETTER_IDEA_QUEST_ID: String = "lq-better-idea-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var nadia: NPC = $Nadia


func _ready() -> void:
	camera_controller.target = player
	nadia.talked_to.connect(_on_nadia_talked_to)


func _on_nadia_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(BETTER_IDEA_QUEST_ID):
		DialogueBox.show_text("zone.strategy_room.nadia.already_done")
	else:
		QuestManager.start_quest(BETTER_IDEA_QUEST_ID)
