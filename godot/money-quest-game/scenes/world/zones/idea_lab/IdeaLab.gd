extends Node3D
## IdeaLab — Entrepreneur Quest's first zone: a small space where a guide
## NPC gives the "Handle Competition" quest, ported directly from the
## website's own real `competitor-lower-price` decision event (see
## src/content/entrepreneur-quest/structures.ts and messages/en.json's
## entrepreneurQuest.decisionEvents). The full BUILD → RUN → RESCUE & GROW
## track stays on the website; this is one representative, self-contained
## slice proving the same QuestData/QuestManager pipeline Money Quest's
## Golden Vault zone uses also carries Entrepreneur Quest content without
## any new systems (see docs/money-quest-world-architecture.md Section 5).

const HANDLE_COMPETITION_QUEST_ID: String = "eq-handle-competition-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var guide: NPC = $BusinessGuide


func _ready() -> void:
	camera_controller.target = player
	guide.talked_to.connect(_on_guide_talked_to)


func _on_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(HANDLE_COMPETITION_QUEST_ID):
		DialogueBox.show_text("zone.idea_lab.guide.already_done")
	else:
		QuestManager.start_quest(HANDLE_COMPETITION_QUEST_ID)
