extends CanvasLayer
## SimulatorPanel — the Business Simulator: split a fixed starting
## amount across 4 categories (materials/packaging/advertising/saved
## aside) with a +/- stepper, then see the real results — ports
## src/app/[locale]/entrepreneur-quest/simulator/page.tsx and its exact
## `runSimulator()` formula from src/lib/entrepreneur-quest/state.ts
## verbatim (unitsMade/reachedCustomers/buyFraction/unitsSold/sales/
## costs/profit/remaining — see `_run_simulation()` below). Every split
## of the starting money is a legitimate choice here, never a
## right-or-wrong answer to check — unlike `AllocatePanel`, which
## checks against a target range, this never colors a category as
## "wrong."
##
## Plain integers throughout, no currency formatting — see
## `BusinessProfileData`'s own comment on this project's business
## numbers never being minor-unit/currency-formatted.

const STEP_AMOUNT: int = 1
const CATEGORY_KEYS: Array[String] = ["materials", "packaging", "advertising", "saved_aside"]

## Any of this panel's finishing buttons -> the waiting show function
## resumes. (A signal, not a local flag: a GDScript 4 lambda only changes
## its own copy of a captured local, so the old flag never reached the
## waiting loop and the panel never closed.)
signal _closed

@onready var panel: PanelContainer = $Panel
@onready var allocation_view: VBoxContainer = $Panel/VBox/AllocationView
@onready var categories_box: VBoxContainer = $Panel/VBox/AllocationView/CategoriesBox
@onready var remaining_label: Label = $Panel/VBox/AllocationView/RemainingLabel
@onready var see_result_button: Button = $Panel/VBox/AllocationView/SeeResultButton
@onready var result_view: VBoxContainer = $Panel/VBox/ResultView
@onready var result_title_label: Label = $Panel/VBox/ResultView/ResultTitleLabel
@onready var result_lines_label: Label = $Panel/VBox/ResultView/ResultLinesLabel
@onready var explanation_label: Label = $Panel/VBox/ResultView/ExplanationLabel
@onready var try_again_button: Button = $Panel/VBox/ResultView/ButtonsRow/TryAgainButton
@onready var continue_button: Button = $Panel/VBox/ResultView/ButtonsRow/ContinueButton

var _allocated: Dictionary = {}
var _category_labels: Dictionary = {}
var _starting_money: int = 50
var _cost_per_unit: int = 2
var _price: int = 5
var _total_potential_customers: int = 20
var _last_run: Dictionary = {}


func _ready() -> void:
	visible = false
	see_result_button.pressed.connect(_on_see_result_pressed)


## Runs the full simulator flow (allocate -> see result -> optionally
## try again) and returns the final run's result dict once "Continue"
## is pressed: {units_made, units_sold, sales, costs, profit, remaining}.
func show_simulator(cost_per_unit: int, price: int, starting_money: int, total_potential_customers: int) -> Dictionary:
	_cost_per_unit = max(cost_per_unit, 1)
	_price = max(price, 1)
	_starting_money = starting_money
	_total_potential_customers = total_potential_customers

	for key in CATEGORY_KEYS:
		_allocated[key] = 0
	_build_category_rows()
	_refresh_allocation_labels()

	visible = true
	allocation_view.visible = true
	result_view.visible = false

	continue_button.pressed.connect(func(): _closed.emit(), CONNECT_ONE_SHOT)

	await _closed
	visible = false

	return _last_run


func _build_category_rows() -> void:
	for child in categories_box.get_children():
		child.queue_free()
	_category_labels.clear()

	for key in CATEGORY_KEYS:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)

		var name_label := Label.new()
		name_label.text = Localization.t("eq_build.simulator.category_%s" % key)
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name_label)

		var minus_button := Button.new()
		minus_button.text = "-"
		minus_button.custom_minimum_size = Vector2(48, 48)
		var this_key: String = key
		minus_button.pressed.connect(func(): _adjust(this_key, -STEP_AMOUNT))
		row.add_child(minus_button)

		var value_label := Label.new()
		value_label.custom_minimum_size = Vector2(60, 0)
		value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		row.add_child(value_label)
		_category_labels[key] = value_label

		var plus_button := Button.new()
		plus_button.text = "+"
		plus_button.custom_minimum_size = Vector2(48, 48)
		plus_button.pressed.connect(func(): _adjust(this_key, STEP_AMOUNT))
		row.add_child(plus_button)

		categories_box.add_child(row)


func _adjust(key: String, delta: int) -> void:
	var current: int = _allocated[key]
	var new_value: int = max(0, current + delta)
	var would_be_total: int = _sum_allocated() - current + new_value
	if would_be_total > _starting_money:
		return
	_allocated[key] = new_value
	_refresh_allocation_labels()


func _sum_allocated() -> int:
	var total := 0
	for key in CATEGORY_KEYS:
		total += int(_allocated[key])
	return total


func _refresh_allocation_labels() -> void:
	for key in CATEGORY_KEYS:
		_category_labels[key].text = str(_allocated[key])

	var remaining: int = _starting_money - _sum_allocated()
	if remaining == 0:
		remaining_label.text = Localization.t("common.allocate_complete")
	else:
		remaining_label.text = Localization.t("eq_build.simulator.remaining_to_allocate", {"amount": remaining})
	see_result_button.disabled = remaining != 0
	see_result_button.text = Localization.t("eq_build.simulator.see_result_button")


func _on_see_result_pressed() -> void:
	_last_run = _run_simulation()
	_show_result_view(_last_run)


## Exact port of runSimulator() in src/lib/entrepreneur-quest/state.ts.
func _run_simulation() -> Dictionary:
	var materials: int = _allocated["materials"]
	var packaging: int = _allocated["packaging"]
	var advertising: int = _allocated["advertising"]
	var saved_aside: int = _allocated["saved_aside"]

	var units_made: int = floori(float(materials) / float(_cost_per_unit))
	var reached_customers: int = roundi((float(advertising) / float(_starting_money)) * _total_potential_customers)

	var price_to_cost_ratio: float = float(_price) / float(_cost_per_unit)
	var buy_fraction: float = 1.0 if price_to_cost_ratio <= 2.0 else (0.7 if price_to_cost_ratio <= 3.0 else 0.4)

	var potential_buyers: int = roundi(reached_customers * buy_fraction)
	var units_sold: int = min(units_made, potential_buyers)

	var sales: int = units_sold * _price
	var costs: int = materials + packaging + advertising
	var profit: int = sales - costs
	var remaining_money: int = max(0, saved_aside + profit)

	return {
		"units_made": units_made,
		"units_sold": units_sold,
		"sales": sales,
		"costs": costs,
		"profit": profit,
		"remaining": remaining_money,
	}


func _show_result_view(run: Dictionary) -> void:
	allocation_view.visible = false
	result_view.visible = true

	result_title_label.text = Localization.t("eq_build.simulator.result_title")
	result_lines_label.text = "%s\n%s\n\n%s: %d\n%s: %d\n%s: %d" % [
		Localization.t("eq_build.simulator.units_made_label", {"count": run["units_made"]}),
		Localization.t("eq_build.simulator.units_sold_label", {"count": run["units_sold"]}),
		Localization.t("eq_build.simulator.sales_label"), run["sales"],
		Localization.t("eq_build.simulator.costs_label"), run["costs"],
		Localization.t("eq_build.simulator.profit_label"), run["profit"],
	]
	result_lines_label.text += "\n%s: %d" % [Localization.t("eq_build.simulator.remaining_label"), run["remaining"]]

	if run["profit"] > 0:
		explanation_label.text = Localization.t("eq_build.simulator.explanation_profit", {"profit": run["profit"]})
	else:
		explanation_label.text = Localization.t("eq_build.simulator.explanation_loss")

	try_again_button.text = Localization.t("eq_build.simulator.try_again_button")
	continue_button.text = Localization.t("common.continue_button")

	try_again_button.pressed.connect(_on_try_again_pressed, CONNECT_ONE_SHOT)


func _on_try_again_pressed() -> void:
	allocation_view.visible = true
	result_view.visible = false
