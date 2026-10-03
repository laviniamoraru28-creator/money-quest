extends Node3D
## HuddleRoom — Leadership Quest's fourth zone, reached via a path inside
## Strategy Room rather than its own Hub portal — the same "track grows
## its own zone graph beyond one zone" pattern Money Quest and
## Entrepreneur Quest already proved (see docs/money-quest-world-
## architecture.md Section 3). Oren gives "Everyone Has an Idea" (ports
## the website's real `everyone-has-an-idea-choice` decision event,
## including its own two-line `nadia`/`oren` intro dialogue), a
## CHALLENGE-kind quest reusing the exact pipeline "The Big Mistake"/
## "The Angry Customer"/"The Better Idea" already proved — no new
## systems. Oren is the fourth and last of Leadership Quest's 4 real
## characters (Nadia, Oren, Priya, Theo), completing the real cast.

const EVERYONE_HAS_AN_IDEA_QUEST_ID: String = "lq-everyone-has-an-idea-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var oren: NPC = $Oren


func _ready() -> void:
	camera_controller.target = player
	oren.talked_to.connect(_on_oren_talked_to)


func _on_oren_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(EVERYONE_HAS_AN_IDEA_QUEST_ID):
		DialogueBox.show_text("zone.huddle_room.oren.already_done")
	else:
		QuestManager.start_quest(EVERYONE_HAS_AN_IDEA_QUEST_ID)
