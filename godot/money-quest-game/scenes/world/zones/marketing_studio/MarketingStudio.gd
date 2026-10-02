extends Node3D
## MarketingStudio — Entrepreneur Quest's second zone, reached via a path
## inside Idea Lab rather than its own Hub portal — the same "track grows
## its own zone graph beyond one zone" pattern Money Quest's Market Town
## proved first (see docs/money-quest-world-architecture.md Section 3).
## The Marketing Guide gives "Create Your Marketing"
## (ports the website's real `product-unclear` decision event), a
## CHALLENGE-kind quest reusing the exact pipeline "Handle Competition"
## already proved — no new systems.

const CREATE_YOUR_MARKETING_QUEST_ID: String = "eq-create-your-marketing-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var marketing_guide: NPC = $MarketingGuide


func _ready() -> void:
	camera_controller.target = player
	marketing_guide.talked_to.connect(_on_marketing_guide_talked_to)


func _on_marketing_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CREATE_YOUR_MARKETING_QUEST_ID):
		DialogueBox.show_text("zone.marketing_studio.guide.already_done")
	else:
		QuestManager.start_quest(CREATE_YOUR_MARKETING_QUEST_ID)
