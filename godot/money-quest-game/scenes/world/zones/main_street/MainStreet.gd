extends Node3D
## Main Street — Entrepreneur Quest's seventh zone, reached via a path
## inside Research Lab rather than its own Hub portal — extending the
## same zone-graph pattern Idea Lab → Marketing Studio → Workshop →
## Office → Growth Lab → Research Lab already proved (see docs/
## money-quest-world-architecture.md Section 3). Unlike every earlier
## Entrepreneur Quest zone (each tied to one specific real BUILD stage),
## Main Street hosts the real website's v2 "Business Problems" library —
## reusable situations a growing business can run into at any time, not
## tied to one stage, so a street of shops fits better than a single
## office.
##
## The Shop Manager gives "Not Enough Customers" (ports the real
## `not-enough-customers` Business Problem). Its real website shape is
## richer than every earlier CHALLENGE quest: investigate 3 clues ->
## identify a likely cause (reflective, no reward) -> choose a response
## (the real decision, rewarded). This motivated `QuestData.diagnosis_
## choice` (see its own doc comment) — the first quest to use it. Like
## every Entrepreneur Quest giver NPC so far, "Shop Manager" is an
## invented mentor-role name; the real content never names anyone.
##
## The Accountant — this zone's second resident — gives "Costs
## Increased" (ports the real `costs-increased` Business Problem, the
## same investigate/diagnose/respond shape). Another invented
## mentor-role name, tied to the scenario (reviewing rising costs)
## rather than a real person.

const NOT_ENOUGH_CUSTOMERS_QUEST_ID: String = "eq-not-enough-customers-quest"
const COSTS_INCREASED_QUEST_ID: String = "eq-costs-increased-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var shop_manager: NPC = $ShopManager
@onready var accountant: NPC = $Accountant


func _ready() -> void:
	camera_controller.target = player
	shop_manager.talked_to.connect(_on_shop_manager_talked_to)
	accountant.talked_to.connect(_on_accountant_talked_to)


func _on_shop_manager_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NOT_ENOUGH_CUSTOMERS_QUEST_ID):
		DialogueBox.show_text("zone.main_street.shop_manager.already_done")
	else:
		QuestManager.start_quest(NOT_ENOUGH_CUSTOMERS_QUEST_ID)


func _on_accountant_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(COSTS_INCREASED_QUEST_ID):
		DialogueBox.show_text("zone.main_street.accountant.already_done")
	else:
		QuestManager.start_quest(COSTS_INCREASED_QUEST_ID)
