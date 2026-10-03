extends Node3D
## AiWorkshop — Entrepreneur Quest's ninth zone, reached via a path
## inside Supply Yard rather than its own Hub portal — extending the
## same zone-graph pattern every earlier Entrepreneur Quest zone has
## proved (see docs/money-quest-world-architecture.md Section 3). Hosts
## the real website's "AI Business Lab" — specifically its one genuine
## decision event, `ai-wrong-answer` (the real site's other AI Lab
## facets — a pure-lookup Q&A list, a prompt-quality quiz, and a privacy
## quiz — are non-decision mechanics, out of scope for the same reason
## every BUILD stage's own non-decision mechanics remain unbuilt).
##
## The Tech Advisor gives "AI Can Be Wrong" (ports the real
## `ai-wrong-answer` decision event). Its dialogue speaks for a
## "Simulated AI Assistant (not real AI)" — the real website's own
## explicit framing, kept intact here — never an actual AI integration;
## every word is pre-written, exactly like every other quest in this
## project (see the project's own non-negotiable: no AI chatbot).

const AI_WRONG_ANSWER_QUEST_ID: String = "eq-ai-wrong-answer-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var tech_advisor: NPC = $TechAdvisor


func _ready() -> void:
	camera_controller.target = player
	tech_advisor.talked_to.connect(_on_tech_advisor_talked_to)


func _on_tech_advisor_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(AI_WRONG_ANSWER_QUEST_ID):
		DialogueBox.show_text("zone.ai_workshop.tech_advisor.already_done")
	else:
		QuestManager.start_quest(AI_WRONG_ANSWER_QUEST_ID)
