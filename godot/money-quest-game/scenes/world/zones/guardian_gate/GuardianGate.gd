extends Node3D
## GuardianGate — Money Quest's third zone (real website world id
## "guardian-gate"), reached via a path inside Market Town rather than its
## own Hub portal — extending the same inner-zone-graph pattern Golden
## Vault → Market Town already proved (see docs/money-quest-world-
## architecture.md Section 3). Zara — the real child from the website's
## own "builder-scams-l1" story — gives "Spotting a Scam"
## (builder-scams-l1), ported via LessonData.choice_point with no new
## mini-game, same shape as Market Town's "Need It or Want It?".

const SCAMS_QUEST_ID: String = "builder-scams-l1-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var zara: NPC = $Zara


func _ready() -> void:
	camera_controller.target = player
	zara.talked_to.connect(_on_zara_talked_to)


func _on_zara_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SCAMS_QUEST_ID):
		DialogueBox.show_text("zone.guardian_gate.zara.already_done")
	else:
		QuestManager.start_quest(SCAMS_QUEST_ID)
