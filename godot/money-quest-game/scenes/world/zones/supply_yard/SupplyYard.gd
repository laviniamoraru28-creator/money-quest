extends Node3D
## SupplyYard — Entrepreneur Quest's eighth zone, reached via a path
## inside Main Street rather than its own Hub portal — extending the
## same zone-graph pattern every earlier Entrepreneur Quest zone has
## proved (see docs/money-quest-world-architecture.md Section 3). Hosts
## the real website's v2 "Run Your Business" activities that aren't
## Business Problems: pricing, suppliers, stock, and cash flow — each
## its own decision event, each a single CHALLENGE quest since none of
## them need the investigate-diagnose-respond shape `diagnosis_choice`
## was built for.
##
## The Pricing Tester gives "The Pricing Experiment" (ports the real
## `pricing-experiment-reflection` decision event — the real website
## shows 3 pre-authored price/units-sold rows in a table; Godot has no
## table UI, so the Pricing Tester speaks the same 3 real rows as
## `intro_dialogue` lines instead, the same adaptation Research Lab's
## Research Guide already used for the Fresh Trout market data).
##
## The Supplier Scout gives "Choose a Supplier" (ports the real
## `choose-a-supplier` decision event — the real website compares 3
## suppliers' price/delivery/minimum-order/quality levels in a table;
## again spoken as `intro_dialogue` lines instead, using the real
## structural levels from `EQ_SUPPLIER_OPTIONS` verbatim).
##
## The Stock Keeper gives "Managing Your Stock" (ports the real
## `stock-management-scenario` decision event — a second decision on
## the same real website page as the supplier choice, so given here by
## a second NPC rather than folded into one quest, keeping one NPC per
## decision exactly like every Business Problem in Main Street).
##
## The Bookkeeper gives "Cash Flow" (ports the real `cash-flow-decision`
## decision event — the real website's restaurant/30-days example,
## teaching "profit is not the same as cash"; its real minor-unit
## amounts (2000/600) are spoken as plain numbers, since this project's
## virtual economy has no real-currency formatting to apply to them —
## see `EQ_CASH_FLOW_SCENARIO`).

const PRICING_EXPERIMENT_QUEST_ID: String = "eq-pricing-experiment-quest"
const CHOOSE_A_SUPPLIER_QUEST_ID: String = "eq-choose-a-supplier-quest"
const STOCK_MANAGEMENT_QUEST_ID: String = "eq-stock-management-quest"
const CASH_FLOW_QUEST_ID: String = "eq-cash-flow-quest"

@onready var player: Node3D = $Player
@onready var camera_controller: CameraController = $CameraController
@onready var pricing_tester: NPC = $PricingTester
@onready var supplier_scout: NPC = $SupplierScout
@onready var stock_keeper: NPC = $StockKeeper
@onready var bookkeeper: NPC = $Bookkeeper


func _ready() -> void:
	camera_controller.target = player
	pricing_tester.talked_to.connect(_on_pricing_tester_talked_to)
	supplier_scout.talked_to.connect(_on_supplier_scout_talked_to)
	stock_keeper.talked_to.connect(_on_stock_keeper_talked_to)
	bookkeeper.talked_to.connect(_on_bookkeeper_talked_to)


func _on_pricing_tester_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(PRICING_EXPERIMENT_QUEST_ID):
		DialogueBox.show_text("zone.supply_yard.pricing_tester.already_done")
	else:
		QuestManager.start_quest(PRICING_EXPERIMENT_QUEST_ID)


func _on_supplier_scout_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CHOOSE_A_SUPPLIER_QUEST_ID):
		DialogueBox.show_text("zone.supply_yard.supplier_scout.already_done")
	else:
		QuestManager.start_quest(CHOOSE_A_SUPPLIER_QUEST_ID)


func _on_stock_keeper_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(STOCK_MANAGEMENT_QUEST_ID):
		DialogueBox.show_text("zone.supply_yard.stock_keeper.already_done")
	else:
		QuestManager.start_quest(STOCK_MANAGEMENT_QUEST_ID)


func _on_bookkeeper_talked_to(_npc_id: String) -> void:
	if QuestManager.is_quest_completed(CASH_FLOW_QUEST_ID):
		DialogueBox.show_text("zone.supply_yard.bookkeeper.already_done")
	else:
		QuestManager.start_quest(CASH_FLOW_QUEST_ID)
