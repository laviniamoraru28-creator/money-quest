extends Node3D
## Office — Entrepreneur Quest's fourth zone, reached via a path inside
## Workshop rather than its own Hub portal — extending the same
## zone-graph pattern Idea Lab → Marketing Studio → Workshop already
## proved (see docs/money-quest-world-architecture.md Section 3). The
## Office Guide gives "Make a Business Decision" (ports the website's
## real `more-orders-than-expected` decision event, the first quest under
## the real "make-a-business-decision" BUILD stage), a CHALLENGE-kind
## quest reusing the exact pipeline already proved — no new systems.
##
## Like every Entrepreneur Quest giver NPC so far, "Office Guide" is an
## invented mentor-role name: the real decision event has no secondary
## character at all (pure second-person "you, the business owner"), and
## the website itself never names anyone in these BUILD-stage decisions.

const MAKE_A_BUSINESS_DECISION_QUEST_ID: String = "eq-make-a-business-decision-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var office_guide: NPC = $OfficeGuide


func _ready() -> void:
	camera_controller.target = player
	office_guide.talked_to.connect(_on_office_guide_talked_to)


func _on_office_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MAKE_A_BUSINESS_DECISION_QUEST_ID):
		DialogueBox.show_text("zone.office.guide.already_done")
	else:
		QuestManager.start_quest(MAKE_A_BUSINESS_DECISION_QUEST_ID)
