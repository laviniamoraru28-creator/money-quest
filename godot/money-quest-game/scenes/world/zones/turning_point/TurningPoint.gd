extends Node3D
## TurningPoint — Entrepreneur Quest's tenth and final current zone,
## reached via a path inside AI Workshop rather than its own Hub portal
## — extending the same zone-graph pattern every earlier Entrepreneur
## Quest zone has proved (see docs/money-quest-world-architecture.md
## Section 3). Hosts the real website's "Rescue & Grow" decision events
## that stand on their own (not the Business Rescue scenario itself,
## which reuses 3 existing Business Problems against a fixed separate
## company and needs its own local-stats model — out of scope here,
## same reasoning the BUILD stages' own non-decision mechanics remain
## unbuilt): Business Pivot, Grow or Stay Small, and all 3 Business
## Ethics scenarios.
##
## The Business Advisor gives "Business Pivot" (ports the real
## `business-pivot` decision event — its real situation text references
## "{businessName}", the child's own persisted company name; Godot's
## CHALLENGE quests have no such persisted identity, so the situation
## is spoken generically as "your business" instead, an honest
## simplification, not fabricated content).
##
## The Growth Coach gives "Grow or Stay Small" (ports the real
## `grow-or-stay-small` decision event).
##
## The Ad Reviewer, Quality Inspector, and Sourcing Advisor each give one
## of the 3 real Business Ethics scenarios (ports `misleading-ad`,
## `hiding-a-problem`, and `cheap-questionable-supplier` verbatim) — kept
## as 3 separate NPCs/quests rather than one multi-part quest, the same
## "one NPC per decision" shape every other Entrepreneur Quest zone uses.

const BUSINESS_PIVOT_QUEST_ID: String = "eq-business-pivot-quest"
const GROW_OR_STAY_SMALL_QUEST_ID: String = "eq-grow-or-stay-small-quest"
const MISLEADING_AD_QUEST_ID: String = "eq-misleading-ad-quest"
const HIDING_A_PROBLEM_QUEST_ID: String = "eq-hiding-a-problem-quest"
const CHEAP_QUESTIONABLE_SUPPLIER_QUEST_ID: String = "eq-cheap-questionable-supplier-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var business_advisor: NPC = $BusinessAdvisor
@onready var growth_coach: NPC = $GrowthCoach
@onready var ad_reviewer: NPC = $AdReviewer
@onready var quality_inspector: NPC = $QualityInspector
@onready var sourcing_advisor: NPC = $SourcingAdvisor


func _ready() -> void:
	camera_controller.target = player
	business_advisor.talked_to.connect(_on_business_advisor_talked_to)
	growth_coach.talked_to.connect(_on_growth_coach_talked_to)
	ad_reviewer.talked_to.connect(_on_ad_reviewer_talked_to)
	quality_inspector.talked_to.connect(_on_quality_inspector_talked_to)
	sourcing_advisor.talked_to.connect(_on_sourcing_advisor_talked_to)


func _on_business_advisor_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(BUSINESS_PIVOT_QUEST_ID):
		DialogueBox.show_text("zone.turning_point.business_advisor.already_done")
	else:
		QuestManager.start_quest(BUSINESS_PIVOT_QUEST_ID)


func _on_growth_coach_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(GROW_OR_STAY_SMALL_QUEST_ID):
		DialogueBox.show_text("zone.turning_point.growth_coach.already_done")
	else:
		QuestManager.start_quest(GROW_OR_STAY_SMALL_QUEST_ID)


func _on_ad_reviewer_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(MISLEADING_AD_QUEST_ID):
		DialogueBox.show_text("zone.turning_point.ad_reviewer.already_done")
	else:
		QuestManager.start_quest(MISLEADING_AD_QUEST_ID)


func _on_quality_inspector_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(HIDING_A_PROBLEM_QUEST_ID):
		DialogueBox.show_text("zone.turning_point.quality_inspector.already_done")
	else:
		QuestManager.start_quest(HIDING_A_PROBLEM_QUEST_ID)


func _on_sourcing_advisor_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CHEAP_QUESTIONABLE_SUPPLIER_QUEST_ID):
		DialogueBox.show_text("zone.turning_point.sourcing_advisor.already_done")
	else:
		QuestManager.start_quest(CHEAP_QUESTIONABLE_SUPPLIER_QUEST_ID)
