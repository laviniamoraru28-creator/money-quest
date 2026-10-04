extends Node3D
## SelfAwarenessLab — Mind Lab's "Self-Awareness Lab" room (Mind Lab
## Section 1, room 8): self-awareness (Section 2B) — recognizing
## strengths, preferences, and that people learn differently. The
## Strength Spotter offers "Spot Your Strengths," a SPOT-kind quest (no
## new mechanic — `SpotItemData.is_suspicious` reused to mean "is this a
## strength moment," the same honest reuse-by-framing the Museum's
## Banknote Lab already established).

const SPOT_YOUR_STRENGTHS_QUEST_ID: String = "mindlab-spot-your-strengths-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var strength_spotter: NPC = $StrengthSpotter


func _ready() -> void:
	camera_controller.target = player
	strength_spotter.talked_to.connect(_on_strength_spotter_talked_to)


func _on_strength_spotter_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SPOT_YOUR_STRENGTHS_QUEST_ID):
		DialogueBox.show_text("zone.self_awareness_lab.guide.already_done")
	else:
		QuestManager.start_quest(SPOT_YOUR_STRENGTHS_QUEST_ID)
