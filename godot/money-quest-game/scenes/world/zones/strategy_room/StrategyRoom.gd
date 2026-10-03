extends Node3D
## StrategyRoom — Leadership Quest's third zone, reached via a path inside
## Team Challenge rather than its own Hub portal — the same "track grows
## its own zone graph beyond one zone" pattern Money Quest's Guardian Gate
## and Entrepreneur Quest's Workshop already proved (see docs/money-
## quest-world-architecture.md Section 3). Nadia gives "The Better Idea"
## (ports the website's real `better-idea-choice` decision event), a
## CHALLENGE-kind quest reusing the exact pipeline "The Big
## Mistake"/"The Angry Customer" already proved — no new systems.
##
## Nadia also gives a SECOND and final quest, "The Final Challenge"
## (MULTI_STEP-kind: a matching mini-game followed by two separate
## decision points, ported from the real website's own capstone mission
## — see QuestManager._run_multi_step_quest). Its first decision point
## uses the real site's own "none"-tag fallback situation text, since
## Godot has no equivalent of the website's Leadership Profile archetype
## tracking that personalizes it there — an honest simplification, not
## fabricated content. Talking to Nadia offers whichever of her 2 quests
## isn't finished yet, in a fixed order.

const BETTER_IDEA_QUEST_ID: String = "lq-better-idea-quest"
const FINAL_CHALLENGE_QUEST_ID: String = "lq-final-challenge-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var nadia: NPC = $Nadia


func _ready() -> void:
	camera_controller.target = player
	nadia.talked_to.connect(_on_nadia_talked_to)


func _on_nadia_talked_to(_npc_id: String) -> void:
	if not QuestManager.is_quest_completed(BETTER_IDEA_QUEST_ID):
		QuestManager.start_quest(BETTER_IDEA_QUEST_ID)
	elif not QuestManager.is_quest_completed(FINAL_CHALLENGE_QUEST_ID):
		QuestManager.start_quest(FINAL_CHALLENGE_QUEST_ID)
	else:
		DialogueBox.show_text("zone.strategy_room.nadia.already_done")
