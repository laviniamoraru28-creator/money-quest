extends Node3D
## ThoughtLab — Mind Lab's "Thought Lab" room (Mind Lab Section 1, room 3):
## thoughts and thinking patterns (Section 2C) — noticing that a thought
## isn't always a fact, distinguishing facts from guesses, and loosening
## "always/never" thinking. The Thought Detective offers "Fact or Guess?",
## a SORT-kind quest (no new mechanic). Never framed as clinical cognitive
## behavioural therapy — see docs/money-quest-world-architecture.md
## Section 7 and the project brief's own explicit instruction.

const FACT_OR_GUESS_QUEST_ID: String = "mindlab-fact-or-guess-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var thought_detective: NPC = $ThoughtDetective


func _ready() -> void:
	camera_controller.target = player
	thought_detective.talked_to.connect(_on_thought_detective_talked_to)


func _on_thought_detective_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(FACT_OR_GUESS_QUEST_ID):
		DialogueBox.show_text("zone.thought_lab.guide.already_done")
	else:
		QuestManager.start_quest(FACT_OR_GUESS_QUEST_ID)
