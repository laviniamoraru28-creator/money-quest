extends Node3D
## IdeaLab — Entrepreneur Quest's first zone: a small space where a guide
## NPC gives the "Handle Competition" quest, ported directly from the
## website's own real `competitor-lower-price` decision event (see
## src/content/entrepreneur-quest/structures.ts and messages/en.json's
## entrepreneurQuest.decisionEvents). Proves the same QuestData/
## QuestManager pipeline Money Quest's Golden Vault zone uses also
## carries Entrepreneur Quest content without any new systems (see
## docs/money-quest-world-architecture.md Section 5).
##
## The Startup Mentor — this zone's second resident — launches the real
## website's own BUILD stage stepper (see `BusinessBuilder.gd`'s own
## doc comment): all 18 real BUILD stages, building one persistent
## business from scratch through to a final pitch. Always resumable —
## talking to the Startup Mentor again continues at the next unfinished
## stage, or re-shows the finished pitch once every stage is done.

const HANDLE_COMPETITION_QUEST_ID: String = "eq-handle-competition-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var guide: NPC = $BusinessGuide
@onready var startup_mentor: NPC = $StartupMentor


func _ready() -> void:
	camera_controller.target = player
	guide.talked_to.connect(_on_guide_talked_to)
	startup_mentor.talked_to.connect(_on_startup_mentor_talked_to)


func _on_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(HANDLE_COMPETITION_QUEST_ID):
		DialogueBox.show_text("zone.idea_lab.guide.already_done")
	else:
		QuestManager.start_quest(HANDLE_COMPETITION_QUEST_ID)


func _on_startup_mentor_talked_to(_npc_id: String) -> void:
	BusinessBuilder.start_building()
