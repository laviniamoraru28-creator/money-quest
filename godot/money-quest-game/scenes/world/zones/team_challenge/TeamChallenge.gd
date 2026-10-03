extends Node3D
## TeamChallenge — Leadership Quest's second zone, reached via a path
## inside Leadership Academy rather than its own Hub portal — the same
## "track grows its own zone graph beyond one zone" pattern Money Quest's
## Market Town and Entrepreneur Quest's Marketing Studio already proved
## (see docs/money-quest-world-architecture.md Section 3). Theo gives
## "The Angry Customer" (ports the website's real `angry-customer-choice`
## decision event), a CHALLENGE-kind quest reusing the exact pipeline
## "The Big Mistake" already proved — no new systems.
##
## Theo also gives a SECOND quest, "The Missing Task" (ports the real
## `missing-task-choice` decision event, with its own `theo`/`priya`
## intro dialogue plus 3 narrator-style "investigate" lines — the real
## site's tap-to-reveal clues, shown here as sequential `intro_dialogue`
## lines, same adaptation Entrepreneur Quest's Business Problems already
## used for their own clues), a THIRD quest, "The Team Conflict"
## (SPOT-kind, ported from the real website's spot-the-problem mini-game
## — see SpotPanel.gd), and a FOURTH quest, "The Deadline" (ALLOCATE-kind,
## ported from the real website's budget-splitting mini-game — see
## AllocatePanel.gd). Leadership Quest only has 4 real characters total
## (Nadia, Oren, Priya, Theo), so once every character has their own
## zone, a later mission featuring an already-placed character offers its
## quest from that same NPC instead of inventing a new one — talking to
## Theo offers whichever of his 4 quests isn't finished yet, in a fixed
## order, falling back to a single "already done" line only once all 4
## are complete.

const ANGRY_CUSTOMER_QUEST_ID: String = "lq-angry-customer-quest"
const MISSING_TASK_QUEST_ID: String = "lq-missing-task-quest"
const TEAM_CONFLICT_QUEST_ID: String = "lq-team-conflict-quest"
const THE_DEADLINE_QUEST_ID: String = "lq-the-deadline-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var theo: NPC = $Theo


func _ready() -> void:
	camera_controller.target = player
	theo.talked_to.connect(_on_theo_talked_to)


func _on_theo_talked_to(_npc_id: String) -> void:
	if not QuestManager.is_quest_completed(ANGRY_CUSTOMER_QUEST_ID):
		QuestManager.start_quest(ANGRY_CUSTOMER_QUEST_ID)
	elif not QuestManager.is_quest_completed(MISSING_TASK_QUEST_ID):
		QuestManager.start_quest(MISSING_TASK_QUEST_ID)
	elif not QuestManager.is_quest_completed(TEAM_CONFLICT_QUEST_ID):
		QuestManager.start_quest(TEAM_CONFLICT_QUEST_ID)
	elif not QuestManager.is_quest_completed(THE_DEADLINE_QUEST_ID):
		QuestManager.start_quest(THE_DEADLINE_QUEST_ID)
	else:
		DialogueBox.show_text("zone.team_challenge.theo.already_done")
