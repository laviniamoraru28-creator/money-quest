extends Node3D
## TeamChallenge — Leadership Quest's second zone, reached via a path
## inside Leadership Academy rather than its own Hub portal — the same
## "track grows its own zone graph beyond one zone" pattern Money Quest's
## Market Town and Entrepreneur Quest's Marketing Studio already proved
## (see docs/money-quest-world-architecture.md Section 3). Theo gives
## "The Angry Customer" (ports the website's real `angry-customer-choice`
## decision event), a CHALLENGE-kind quest reusing the exact pipeline
## "The Big Mistake" already proved — no new systems.

const ANGRY_CUSTOMER_QUEST_ID: String = "lq-angry-customer-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var theo: NPC = $Theo


func _ready() -> void:
	camera_controller.target = player
	theo.talked_to.connect(_on_theo_talked_to)


func _on_theo_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(ANGRY_CUSTOMER_QUEST_ID):
		DialogueBox.show_text("zone.team_challenge.theo.already_done")
	else:
		QuestManager.start_quest(ANGRY_CUSTOMER_QUEST_ID)
