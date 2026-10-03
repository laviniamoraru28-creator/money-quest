extends Node3D
## Growth Lab — Entrepreneur Quest's fifth zone, reached via a path inside
## Office rather than its own Hub portal — extending the same zone-graph
## pattern Idea Lab → Marketing Studio → Workshop → Office already proved
## (see docs/money-quest-world-architecture.md Section 3). The Growth
## Guide gives "Grow Your Business" (ports the website's real
## `fewer-sales-than-expected` decision event, the only quest under the
## real "grow-your-business" BUILD stage), a CHALLENGE-kind quest reusing
## the exact pipeline already proved — no new systems.
##
## Like every Entrepreneur Quest giver NPC so far, "Growth Guide" is an
## invented mentor-role name: the real decision event has no secondary
## character at all (pure second-person "you, the business owner"), and
## the website itself never names anyone in these BUILD-stage decisions.

const GROW_YOUR_BUSINESS_QUEST_ID: String = "eq-grow-your-business-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var growth_guide: NPC = $GrowthGuide


func _ready() -> void:
	camera_controller.target = player
	growth_guide.talked_to.connect(_on_growth_guide_talked_to)


func _on_growth_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GROW_YOUR_BUSINESS_QUEST_ID):
		DialogueBox.show_text("zone.growth_lab.guide.already_done")
	else:
		QuestManager.start_quest(GROW_YOUR_BUSINESS_QUEST_ID)
