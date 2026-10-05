extends CanvasLayer
## AllocatePanel — a +/- stepper budget-splitting mini-game: tap - or +
## on each category until the full total is allocated, then submit.
## Checks every category's allocated amount against its own target ±
## tolerance — same contract the website's own AllocateMechanic.tsx uses
## (always with plain integers here, e.g. minutes — never currency).
## Wrong submissions stay open for another try; nothing here is a hard
## fail.

@onready var panel: PanelContainer = $Panel
@onready var instructions_label: Label = $Panel/VBox/InstructionsLabel
@onready var categories_box: VBoxContainer = $Panel/VBox/CategoriesBox
@onready var remaining_label: Label = $Panel/VBox/RemainingLabel
@onready var submit_button: Button = $Panel/VBox/SubmitButton

const STEP_AMOUNT: int = 100
const CORRECT_COLOR: Color = Color(0.7, 1.0, 0.7)
const WRONG_COLOR: Color = Color(1.0, 0.6, 0.6)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

var _categories: Array[AllocateCategoryData] = []
var _allocated: Array = []   # int per category, parallel to _categories
var _category_labels: Array[Label] = []
var _total_amount: int = 0
var _unit_label_key: String = ""
var _solved: bool = false


func _ready() -> void:
	visible = false
	submit_button.pressed.connect(_on_submit_pressed)


func show_allocate(total_amount: int, unit_label_key: String, categories: Array[AllocateCategoryData]) -> void:
	instructions_label.text = Localization.t("common.allocate_instructions")
	submit_button.text = Localization.t("common.allocate_submit_button")
	_categories = categories
	_total_amount = total_amount
	_unit_label_key = unit_label_key
	_allocated.clear()
	for i in _categories.size():
		_allocated.append(0)
	_solved = false
	_clear_categories()

	_category_labels.clear()
	for i in _categories.size():
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)

		var label := Label.new()
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(label)
		_category_labels.append(label)

		var minus_button := Button.new()
		minus_button.text = "-"
		minus_button.custom_minimum_size = Vector2(56, 56)
		var this_index := i
		minus_button.pressed.connect(func(): _adjust(this_index, -STEP_AMOUNT))
		row.add_child(minus_button)

		var plus_button := Button.new()
		plus_button.text = "+"
		plus_button.custom_minimum_size = Vector2(56, 56)
		plus_button.pressed.connect(func(): _adjust(this_index, STEP_AMOUNT))
		row.add_child(plus_button)

		categories_box.add_child(row)

	_refresh_labels()

	visible = true
	UIFocus.focus(categories_box)
	while not _solved:
		await get_tree().process_frame
	visible = false


func _adjust(index: int, delta: int) -> void:
	var new_value: int = _allocated[index] + delta
	if new_value < 0:
		return
	if delta > 0 and (_total_amount - _sum_allocated()) < STEP_AMOUNT:
		return
	_allocated[index] = new_value
	_refresh_labels()


func _sum_allocated() -> int:
	var total := 0
	for amount in _allocated:
		total += amount
	return total


func _refresh_labels() -> void:
	for i in _categories.size():
		_category_labels[i].text = "%s: %d %s" % [
			Localization.t(_categories[i].label_key),
			_allocated[i],
			Localization.t(_unit_label_key),
		]
		_category_labels[i].modulate = DEFAULT_COLOR

	var remaining: int = _total_amount - _sum_allocated()
	if remaining == 0:
		remaining_label.text = Localization.t("common.allocate_complete")
	else:
		remaining_label.text = Localization.t("common.allocate_remaining", {
			"amount": remaining,
			"unit": Localization.t(_unit_label_key),
		})
	submit_button.disabled = remaining != 0


func _on_submit_pressed() -> void:
	var all_correct := true
	for i in _categories.size():
		var category := _categories[i]
		var within_tolerance: bool = abs(_allocated[i] - category.target_amount) <= category.tolerance_amount
		_category_labels[i].modulate = CORRECT_COLOR if within_tolerance else WRONG_COLOR
		if not within_tolerance:
			all_correct = false

	if all_correct:
		_solved = true


func _clear_categories() -> void:
	for child in categories_box.get_children():
		child.queue_free()
