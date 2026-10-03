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
##
## Teammate — this zone's second resident — gives "A Teammate's Idea"
## (ports the website's real `teammate-wants-change` decision event, the
## sibling decision under the same real "make-a-business-decision" BUILD
## stage as the Office Guide's quest). Since the Office Guide's quest
## already used that stage's real title/learnText verbatim, this quest's
## title/intro are original framing instead, the same convention
## Workshop's Supplier established.

const MAKE_A_BUSINESS_DECISION_QUEST_ID: String = "eq-make-a-business-decision-quest"
const TEAMMATE_WANTS_CHANGE_QUEST_ID: String = "eq-teammate-wants-change-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var office_guide: NPC = $OfficeGuide
@onready var teammate: NPC = $Teammate


func _ready() -> void:
	camera_controller.target = player
	office_guide.talked_to.connect(_on_office_guide_talked_to)
	teammate.talked_to.connect(_on_teammate_talked_to)


func _on_office_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MAKE_A_BUSINESS_DECISION_QUEST_ID):
		DialogueBox.show_text("zone.office.guide.already_done")
	else:
		QuestManager.start_quest(MAKE_A_BUSINESS_DECISION_QUEST_ID)


func _on_teammate_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TEAMMATE_WANTS_CHANGE_QUEST_ID):
		DialogueBox.show_text("zone.office.teammate.already_done")
	else:
		QuestManager.start_quest(TEAMMATE_WANTS_CHANGE_QUEST_ID)
