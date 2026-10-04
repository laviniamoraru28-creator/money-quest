extends Node3D
## EmotionLab — Mind Lab's "Emotion Lab" room (project brief, Mind Lab
## Section 1, room 2): emotional intelligence (Section 2A) — recognizing
## and naming emotions, noticing that feelings can change, and choosing a
## constructive response. The Emotion Explorer offers "Name That Feeling,"
## a MATCH-kind quest (no new mechanic — reuses the existing matching
## mini-game with a plain emotion word on the right instead of a
## character, see MatchPairData.gd's `right_text_key`). Reached from Mind
## Lab's own entrance zone; a second portal leads onward to Thought Lab —
## the same "inner portal" chain every multi-zone destination uses.
##
## Never framed as diagnosis or treatment anywhere in this zone's copy —
## see docs/money-quest-world-architecture.md Section 7.

const NAME_THAT_FEELING_QUEST_ID: String = "mindlab-name-that-feeling-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var emotion_explorer: NPC = $EmotionExplorer


func _ready() -> void:
	camera_controller.target = player
	emotion_explorer.talked_to.connect(_on_emotion_explorer_talked_to)


func _on_emotion_explorer_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NAME_THAT_FEELING_QUEST_ID):
		DialogueBox.show_text("zone.emotion_lab.guide.already_done")
	else:
		QuestManager.start_quest(NAME_THAT_FEELING_QUEST_ID)
