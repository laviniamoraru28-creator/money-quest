extends Node3D
## LeadershipAcademy — Leadership Quest's first zone: a small space where
## Priya gives "The Big Mistake" quest, ported directly from the website's
## own real `big-mistake-choice` decision event (see src/content/
## leadership-quest/structures.ts and messages/en.json's
## leadershipQuest.missions.big-mistake). Proves the same QuestData/
## QuestManager `CHALLENGE` pipeline Entrepreneur Quest's Idea Lab zone
## uses also carries Leadership Quest content without any new systems
## (see docs/money-quest-world-architecture.md Section 5).

const BIG_MISTAKE_QUEST_ID: String = "lq-big-mistake-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var priya: NPC = $Priya


func _ready() -> void:
	camera_controller.target = player
	priya.talked_to.connect(_on_priya_talked_to)


func _on_priya_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(BIG_MISTAKE_QUEST_ID):
		DialogueBox.show_text("zone.leadership_academy.priya.already_done")
	else:
		QuestManager.start_quest(BIG_MISTAKE_QUEST_ID)
