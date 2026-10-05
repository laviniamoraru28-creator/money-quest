extends CanvasLayer
## SpotPanel — the "spot the problem" mini-game: toggle-select any number
## of items, then submit. Checks the selected set against every item's
## `is_suspicious` flag exactly (an exact-set match) — the same contract
## the website's own SpotMechanic.tsx uses. A wrong submission recolors
## every item as feedback and stays open for another try: this mechanic
## has no hard-fail state, matching the site's "always eventually
## succeeds" design.

@onready var panel: PanelContainer = $Panel
@onready var scenario_label: Label = $Panel/VBox/ScenarioLabel
@onready var items_box: VBoxContainer = $Panel/VBox/ItemsBox
@onready var submit_button: Button = $Panel/VBox/SubmitButton

const MIN_BUTTON_HEIGHT: float = 56.0
const CORRECT_COLOR: Color = Color(0.7, 1.0, 0.7)
const MISSED_COLOR: Color = Color(1.0, 0.85, 0.5)
const WRONG_COLOR: Color = Color(1.0, 0.6, 0.6)
const DEFAULT_COLOR: Color = Color(1, 1, 1)

var _items: Array[SpotItemData] = []
var _item_buttons: Array[Button] = []
var _solved: bool = false


func _ready() -> void:
	visible = false
	submit_button.pressed.connect(_on_submit_pressed)


func show_spot(scenario_text_key: String, items: Array[SpotItemData]) -> void:
	scenario_label.text = Localization.t(scenario_text_key)
	submit_button.text = Localization.t("common.spot_submit_button")
	_items = items
	_solved = false
	_clear_items()

	_item_buttons.clear()
	for item in _items:
		var button := Button.new()
		button.text = Localization.t(item.text_key)
		button.toggle_mode = true
		button.custom_minimum_size = Vector2(0, MIN_BUTTON_HEIGHT)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		button.toggled.connect(func(_pressed): _refresh_submit_enabled())
		items_box.add_child(button)
		_item_buttons.append(button)
	_refresh_submit_enabled()

	visible = true
	UIFocus.focus(items_box)
	while not _solved:
		await get_tree().process_frame
	visible = false


func _refresh_submit_enabled() -> void:
	var any_selected := false
	for button in _item_buttons:
		if button.button_pressed:
			any_selected = true
			break
	submit_button.disabled = not any_selected


func _on_submit_pressed() -> void:
	var all_correct := true
	for i in _items.size():
		var button := _item_buttons[i]
		var is_selected := button.button_pressed
		var should_be_selected: bool = _items[i].is_suspicious
		if is_selected == should_be_selected:
			button.modulate = CORRECT_COLOR if should_be_selected else DEFAULT_COLOR
		else:
			all_correct = false
			button.modulate = WRONG_COLOR if is_selected else MISSED_COLOR

	if all_correct:
		_solved = true


func _clear_items() -> void:
	for child in items_box.get_children():
		child.queue_free()
