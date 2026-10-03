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
##
## The Support Rep — this zone's third resident — gives "A Negative
## Review" (ports the real `negative-review` Business Problem, the
## same investigate/diagnose/respond shape). Another invented
## mentor-role name, tied to the scenario (handling customer feedback).
##
## Four more residents complete the real v2 Business Problems library
## (7 of 7 problems), each another invented mentor-role name tied to
## its own scenario, all reusing the exact same investigate/diagnose/
## respond shape with no further changes to QuestData/QuestManager:
## - Sales Tracker: "Sales Are Falling" (`sales-falling`)
## - Profit Analyst: "Why Aren't We Making Money?" (`rising-costs-eating-profit`)
## - Cash Flow Advisor: "Profit But No Cash" (`profit-but-no-cash`)
## - Warehouse Keeper: "Too Much Unsold Stock" (`too-much-stock`)

const NOT_ENOUGH_CUSTOMERS_QUEST_ID: String = "eq-not-enough-customers-quest"
const COSTS_INCREASED_QUEST_ID: String = "eq-costs-increased-quest"
const NEGATIVE_REVIEW_QUEST_ID: String = "eq-negative-review-quest"
const SALES_FALLING_QUEST_ID: String = "eq-sales-falling-quest"
const RISING_COSTS_EATING_PROFIT_QUEST_ID: String = "eq-rising-costs-eating-profit-quest"
const PROFIT_BUT_NO_CASH_QUEST_ID: String = "eq-profit-but-no-cash-quest"
const TOO_MUCH_STOCK_QUEST_ID: String = "eq-too-much-stock-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var shop_manager: NPC = $ShopManager
@onready var accountant: NPC = $Accountant
@onready var support_rep: NPC = $SupportRep
@onready var sales_tracker: NPC = $SalesTracker
@onready var profit_analyst: NPC = $ProfitAnalyst
@onready var cash_flow_advisor: NPC = $CashFlowAdvisor
@onready var warehouse_keeper: NPC = $WarehouseKeeper


func _ready() -> void:
	camera_controller.target = player
	shop_manager.talked_to.connect(_on_shop_manager_talked_to)
	accountant.talked_to.connect(_on_accountant_talked_to)
	support_rep.talked_to.connect(_on_support_rep_talked_to)
	sales_tracker.talked_to.connect(_on_sales_tracker_talked_to)
	profit_analyst.talked_to.connect(_on_profit_analyst_talked_to)
	cash_flow_advisor.talked_to.connect(_on_cash_flow_advisor_talked_to)
	warehouse_keeper.talked_to.connect(_on_warehouse_keeper_talked_to)


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


func _on_support_rep_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(NEGATIVE_REVIEW_QUEST_ID):
		DialogueBox.show_text("zone.main_street.support_rep.already_done")
	else:
		QuestManager.start_quest(NEGATIVE_REVIEW_QUEST_ID)


func _on_sales_tracker_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(SALES_FALLING_QUEST_ID):
		DialogueBox.show_text("zone.main_street.sales_tracker.already_done")
	else:
		QuestManager.start_quest(SALES_FALLING_QUEST_ID)


func _on_profit_analyst_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(RISING_COSTS_EATING_PROFIT_QUEST_ID):
		DialogueBox.show_text("zone.main_street.profit_analyst.already_done")
	else:
		QuestManager.start_quest(RISING_COSTS_EATING_PROFIT_QUEST_ID)


func _on_cash_flow_advisor_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(PROFIT_BUT_NO_CASH_QUEST_ID):
		DialogueBox.show_text("zone.main_street.cash_flow_advisor.already_done")
	else:
		QuestManager.start_quest(PROFIT_BUT_NO_CASH_QUEST_ID)


func _on_warehouse_keeper_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(TOO_MUCH_STOCK_QUEST_ID):
		DialogueBox.show_text("zone.main_street.warehouse_keeper.already_done")
	else:
		QuestManager.start_quest(TOO_MUCH_STOCK_QUEST_ID)
