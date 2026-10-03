extends Node3D
## LeadershipAcademy — Leadership Quest's first zone: a small space where
## Priya gives "The Big Mistake" quest, ported directly from the website's
## own real `big-mistake-choice` decision event (see src/content/
## leadership-quest/structures.ts and messages/en.json's
## leadershipQuest.missions.big-mistake). Proves the same QuestData/
## QuestManager `CHALLENGE` pipeline Entrepreneur Quest's Idea Lab zone
## uses also carries Leadership Quest content without any new systems
## (see docs/money-quest-world-architecture.md Section 5).
##
## Priya also gives 3 more quests: "Meet Your Team" and "The First
## Challenge" (both MATCH-kind, ported from the real website's own
## matching mini-games — see MatchPanel.gd) and "The Pressure Test"
## (SORT-kind, ported from the real website's sorting mini-game — see
## SortPanel.gd). Leadership Quest only has 4 real characters total, so
## talking to Priya offers whichever of her 4 quests isn't finished yet,
## in a fixed order — the same pattern Team Challenge's Theo already
## proved — falling back to a single "already done" line only once all 4
## are complete.

const MEET_YOUR_TEAM_QUEST_ID: String = "lq-meet-your-team-quest"
const FIRST_CHALLENGE_QUEST_ID: String = "lq-first-challenge-quest"
const BIG_MISTAKE_QUEST_ID: String = "lq-big-mistake-quest"
const PRESSURE_TEST_QUEST_ID: String = "lq-pressure-test-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var priya: NPC = $Priya


func _ready() -> void:
	camera_controller.target = player
	priya.talked_to.connect(_on_priya_talked_to)


func _on_priya_talked_to(_npc_id: String) -> void:
	if not QuestManager.is_quest_completed(MEET_YOUR_TEAM_QUEST_ID):
		QuestManager.start_quest(MEET_YOUR_TEAM_QUEST_ID)
	elif not QuestManager.is_quest_completed(FIRST_CHALLENGE_QUEST_ID):
		QuestManager.start_quest(FIRST_CHALLENGE_QUEST_ID)
	elif not QuestManager.is_quest_completed(BIG_MISTAKE_QUEST_ID):
		QuestManager.start_quest(BIG_MISTAKE_QUEST_ID)
	elif not QuestManager.is_quest_completed(PRESSURE_TEST_QUEST_ID):
		QuestManager.start_quest(PRESSURE_TEST_QUEST_ID)
	else:
		DialogueBox.show_text("zone.leadership_academy.priya.already_done")
