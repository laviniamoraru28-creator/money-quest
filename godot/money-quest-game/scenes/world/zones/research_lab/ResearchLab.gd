extends Node3D
## Research Lab — Entrepreneur Quest's sixth zone, reached via a path
## inside Growth Lab rather than its own Hub portal — extending the same
## zone-graph pattern Idea Lab → Marketing Studio → Workshop → Office →
## Growth Lab already proved (see docs/money-quest-world-architecture.md
## Section 3). This zone hosts the real website's two earliest BUILD
## decisions, "Research Demand" and "Test the Idea" — both real stages
## had no Godot zone/NPC yet, so one new 2-NPC zone covers both at once,
## the same "new zone, built with 2 residents from the start" shape
## Office already used.
##
## The Research Guide gives "Research Demand" (ports the real
## `market-detective-reflection` decision event). Its real website
## version shows a market-data TABLE (the fixed "Fresh Trout" scenario:
## 300 interested customers, 75 recent buyers, 4 competitors) before the
## reflection question — Godot has no such table UI, so the same real
## numbers are instead spoken by the Research Guide as `intro_dialogue`
## lines, in the exact order and values the real data uses. This is a
## presentation-shape adaptation only: every number and every choice/
## consequence is still the website's real content verbatim.
##
## The Test Guide gives "Test the Idea" (ports the real
## `test-before-invest` decision event, a simple 2-choice decision with
## no table dependency).
##
## Like every Entrepreneur Quest giver NPC so far, "Research Guide" and
## "Test Guide" are invented mentor-role names: neither real decision
## event names a secondary character.

const RESEARCH_DEMAND_QUEST_ID: String = "eq-research-demand-quest"
const TEST_THE_IDEA_QUEST_ID: String = "eq-test-the-idea-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var research_guide: NPC = $ResearchGuide
@onready var test_guide: NPC = $TestGuide


func _ready() -> void:
	camera_controller.target = player
	research_guide.talked_to.connect(_on_research_guide_talked_to)
	test_guide.talked_to.connect(_on_test_guide_talked_to)


func _on_research_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(RESEARCH_DEMAND_QUEST_ID):
		DialogueBox.show_text("zone.research_lab.research_guide.already_done")
	else:
		QuestManager.start_quest(RESEARCH_DEMAND_QUEST_ID)


func _on_test_guide_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TEST_THE_IDEA_QUEST_ID):
		DialogueBox.show_text("zone.research_lab.test_guide.already_done")
	else:
		QuestManager.start_quest(TEST_THE_IDEA_QUEST_ID)
