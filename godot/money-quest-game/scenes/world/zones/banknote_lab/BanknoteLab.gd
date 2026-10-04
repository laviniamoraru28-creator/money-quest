extends Node3D
## BanknoteLab — Museum Room 5: a "spot the real security feature"
## detective mini-game (project brief Section 15), reusing the existing
## SPOT quest kind exactly as-is — `is_suspicious` here just means
## "is this a real security feature," the same generic exact-set-match
## mechanic Leadership Quest's "spot the problem" rounds already use,
## repurposed by framing alone, never a new mechanic. Teaches recognizing
## official security features, never how to forge one (the brief's own
## explicit boundary). Also hosts one real, sourced exhibit on banknote
## design more broadly.

const BANKNOTE_QUEST_ID: String = "museum-banknote-lab-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var inspector: NPC = $Inspector


func _ready() -> void:
	camera_controller.target = player
	inspector.talked_to.connect(_on_inspector_talked_to)


func _on_inspector_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(BANKNOTE_QUEST_ID):
		DialogueBox.show_text("zone.banknote_lab.inspector.already_done")
	else:
		QuestManager.start_quest(BANKNOTE_QUEST_ID)
