extends Node3D
## AdaptabilityLab — Mind Lab's "Adaptability Lab" room (Mind Lab Section
## 1, room 9): adaptability (Section 2H) — plans can change, unexpected
## events happen, and flexible thinking helps. The Adaptability Guide
## offers "The Rained-Out Picnic," a CHALLENGE-kind quest with no single
## correct option. A second portal leads onward to the Mind Lab Discovery
## Room — the last room in the chain.

const RAINED_OUT_PICNIC_QUEST_ID: String = "mindlab-rained-out-picnic-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var adaptability_guide: NPC = $AdaptabilityGuide


func _ready() -> void:
	camera_controller.target = player
	adaptability_guide.talked_to.connect(_on_adaptability_guide_talked_to)


func _on_adaptability_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(RAINED_OUT_PICNIC_QUEST_ID):
		DialogueBox.show_text("zone.adaptability_lab.guide.already_done")
	else:
		QuestManager.start_quest(RAINED_OUT_PICNIC_QUEST_ID)
