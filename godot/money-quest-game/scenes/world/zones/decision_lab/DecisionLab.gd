extends Node3D
## DecisionLab — Mind Lab's "Decision Lab" room (Mind Lab Section 1, room
## 6): decision making (Section 2F) — identifying choices, thinking about
## consequences, short-term vs long-term effects, and considering other
## people. The Decision Scientist offers "The Two Invitations," a
## CHALLENGE-kind quest with no single correct option (no new mechanic).

const TWO_INVITATIONS_QUEST_ID: String = "mindlab-two-invitations-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var decision_scientist: NPC = $DecisionScientist


func _ready() -> void:
	camera_controller.target = player
	decision_scientist.talked_to.connect(_on_decision_scientist_talked_to)


func _on_decision_scientist_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TWO_INVITATIONS_QUEST_ID):
		DialogueBox.show_text("zone.decision_lab.guide.already_done")
	else:
		QuestManager.start_quest(TWO_INVITATIONS_QUEST_ID)
