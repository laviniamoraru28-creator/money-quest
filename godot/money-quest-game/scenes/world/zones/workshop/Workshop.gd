extends Node3D
## Workshop — Entrepreneur Quest's third zone, reached via a path inside
## Marketing Studio rather than its own Hub portal — extending the same
## zone-graph pattern Idea Lab → Marketing Studio already proved (see
## docs/money-quest-world-architecture.md Section 3). The Workshop Guide
## gives "Handle a Customer Problem" (ports the website's real
## `too-expensive-feedback` decision event), a CHALLENGE-kind quest
## reusing the exact pipeline "Handle Competition"/"Create Your
## Marketing" already proved — no new systems.

const HANDLE_CUSTOMER_PROBLEM_QUEST_ID: String = "eq-handle-a-customer-problem-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var workshop_guide: NPC = $WorkshopGuide


func _ready() -> void:
	camera_controller.target = player
	workshop_guide.talked_to.connect(_on_workshop_guide_talked_to)


func _on_workshop_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(HANDLE_CUSTOMER_PROBLEM_QUEST_ID):
		DialogueBox.show_text("zone.workshop.guide.already_done")
	else:
		QuestManager.start_quest(HANDLE_CUSTOMER_PROBLEM_QUEST_ID)
